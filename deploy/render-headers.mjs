#!/usr/bin/env node
// Build-time renderer for the nginx security-headers include.
//
//   node deploy/render-headers.mjs <dist/index.html> <headers.conf.template> <out>
//
// Reads VITE_API_BASE_URL and VITE_KEYCLOAK_URL from the environment (the
// same values Vite just inlined into the bundle) and the inline <script>
// elements of the built index.html, then fills the __PLACEHOLDERS__ of the
// template:
//   __SCRIPT_SRC__    'self' 'sha256-…' per inline script
//   __CONNECT_SRC__   'self' + API origin + Keycloak origin
//   __FRAME_SRC__     Keycloak origin
//   __FORM_ACTION__   'self' + Keycloak origin
// A relative VITE_API_BASE_URL (e.g. /api/v1) means same-origin and adds
// nothing. No dependencies; Node >= 22.

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const [indexPath, templatePath, outPath] = process.argv.slice(2);
if (!indexPath || !templatePath || !outPath) {
  console.error('usage: render-headers.mjs <dist/index.html> <headers.conf.template> <out>');
  process.exit(2);
}

function originOf(name, { required }) {
  const value = (process.env[name] ?? '').trim();
  if (!value) {
    if (required) throw new Error(`${name} is not set`);
    return null;
  }
  if (value.startsWith('/')) return null; // same-origin
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} is not an absolute URL: ${value}`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error(`${name} must be http(s): ${value}`);
  return url.origin;
}

/** Exact text of every <script> without a src, as the browser hashes it. */
function inlineScriptHashes(html) {
  const hashes = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  for (const match of html.matchAll(pattern)) {
    const attributes = match[1] ?? '';
    if (/\bsrc\s*=/i.test(attributes)) continue;
    const body = match[2] ?? '';
    if (body.trim() === '') continue;
    hashes.push(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
  return hashes;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const apiOrigin = originOf('VITE_API_BASE_URL', { required: true });
const keycloakOrigin = originOf('VITE_KEYCLOAK_URL', { required: true });
if (!keycloakOrigin) throw new Error('VITE_KEYCLOAK_URL must be an absolute URL');

const html = await readFile(indexPath, 'utf8');
const hashes = inlineScriptHashes(html);

const values = {
  __SCRIPT_SRC__: unique(["'self'", ...hashes]).join(' '),
  __CONNECT_SRC__: unique(["'self'", apiOrigin, keycloakOrigin]).join(' '),
  __FRAME_SRC__: keycloakOrigin,
  __FORM_ACTION__: unique(["'self'", keycloakOrigin]).join(' '),
};

let rendered = await readFile(templatePath, 'utf8');
for (const [placeholder, value] of Object.entries(values)) rendered = rendered.split(placeholder).join(value);
const leftover = rendered
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('#'))
  .join('\n')
  .match(/__[A-Z_]+__/);
if (leftover) throw new Error(`template still has an unfilled placeholder: ${leftover[0]}`);

await writeFile(outPath, rendered, 'utf8');
console.log(`rendered ${outPath}: ${hashes.length} inline script hash(es); connect-src ${values.__CONNECT_SRC__}`);
