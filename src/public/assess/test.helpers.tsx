import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { type AssessmentFormResponse, type Draft, type PublicInvitation } from '@/api/publicAssess.types';

import AssessPage from './AssessPage';

/* Test-only helpers for the /assess/:token flow: fixtures that mirror the backend
   zod schemas, a fetch-level mock router (the real `api` client runs on top of
   it, so headers and error parsing are exercised), and a render helper. */

export const TOKEN = 'tok_abcdefghijklmnopqrstuvwxyz0123456789ABCDE';

export const invitation: PublicInvitation = {
  state: 'SENT',
  cycle: { id: 'cyc_1', name: 'CSQ 2026 · Q4', assessmentEnd: '2026-10-31T18:29:59.000Z' },
  operator: { name: 'Delhi Cargo Services', airport: { iata: 'DEL', name: 'Indira Gandhi International' } },
  surveyType: 'DOMESTIC',
  customer: { nameMasked: 'A*** R***', emailMasked: 'a***@delcargo.test', type: 'FF' },
  submittedAt: null,
  expiresAt: '2026-10-31T18:29:59.000Z',
};

// Relative to now: a fixed instant silently expires and turns a resume test into an OTP test.
export const session = { sessionToken: 'jwt_session', expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), assessmentId: 'asg_1' };

const q = (id: string, text: string, commentMode: 'OPTIONAL' | 'REQUIRED' | 'REQUIRED_ON_LOW' | 'NONE' = 'OPTIONAL', followUp: string[] | null = null) => ({
  id,
  code: id.toUpperCase(),
  text,
  help: null,
  order: 1,
  mandatory: true,
  commentMode,
  followUp: followUp ? { prompt: 'What went wrong?', options: followUp } : null,
});

export const form: AssessmentFormResponse = {
  assessment: {
    id: 'asg_1',
    cycleId: 'cyc_1',
    acoId: 'org_1',
    airportId: 'ap_del',
    surveyId: 'svy_dom_3',
    surveyType: 'DOMESTIC',
    kind: 'CUSTOMER',
    customerType: 'FF',
    invitationId: 'inv_1',
    userId: null,
    status: 'DRAFT',
    progress: { answered: 0, total: 4, pct: 0 },
    startedAt: '2026-10-07T09:00:00.000Z',
    lastSavedAt: null,
    submittedAt: null,
  },
  survey: { id: 'svy_dom_3', code: 'DOMESTIC', name: 'Domestic cargo service quality', version: 3 },
  categories: [
    {
      id: 'cat_ops',
      code: 'OPS',
      name: 'Operations',
      order: 1,
      weightPct: 50,
      subcategories: [
        { id: 'sub_acc', code: 'ACC', name: 'Acceptance', order: 1, questions: [q('q1', 'Speed of cargo acceptance'), q('q2', 'Accuracy of documentation checks', 'REQUIRED_ON_LOW', ['Long queues', 'Staff shortage'])] },
      ],
      questions: [],
    },
    {
      id: 'cat_sec',
      code: 'SEC',
      name: 'Security',
      order: 2,
      weightPct: 50,
      subcategories: [],
      questions: [q('q3', 'Screening turnaround'), q('q4', 'Handling of dangerous goods', 'NONE')],
    },
  ],
  progress: { answered: 0, total: 4, pct: 0 },
};

export const emptyDraft: Draft = { id: 'asg_1', status: 'DRAFT', answers: [], progress: { answered: 0, total: 4, pct: 0 }, lastSavedAt: null, submittedAt: null };

export type MockRequest = { method: string; path: string; body: unknown; headers: Headers };
export type MockReply = { status?: number; body?: unknown } | undefined;
export type MockHandler = (req: MockRequest) => MockReply;

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return { status, body: { error: { code, message, details, requestId: `req_${code.toLowerCase()}` } } };
}

/**
 * Installs a fetch mock for the API base. Handlers run in order; the first that
 * returns a reply wins. Every request is recorded in `calls`.
 */
export function mockApi(...handlers: MockHandler[]) {
  const calls: MockRequest[] = [];
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const path = url.pathname.replace(/^\/api\/v1/, '');
    const body = init?.body ? (JSON.parse(String(init.body)) as unknown) : undefined;
    const req: MockRequest = { method: (init?.method ?? 'GET').toUpperCase(), path, body, headers: new Headers(init?.headers) };
    calls.push(req);
    for (const handler of handlers) {
      const reply = handler(req);
      if (reply) {
        const status = reply.status ?? 200;
        if (status === 204) return new Response(null, { status });
        const payload = reply.body !== undefined && 'error' in (reply.body as object) ? reply.body : { data: reply.body };
        return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
      }
    }
    return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: `No mock for ${req.method} ${path}`, requestId: 'req_none' } }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock };
}

/** The happy-path backend: a SENT invitation, an OTP that is always 123456, the fixture form and an empty draft. */
export function happyBackend(overrides: { invitation?: Partial<PublicInvitation>; draft?: Draft; devOtp?: string } = {}): MockHandler {
  const inv = { ...invitation, ...overrides.invitation };
  const base = `/public/assess/${TOKEN}`;
  return ({ method, path, body, headers }) => {
    if (method === 'GET' && path === base) return { body: inv };
    if (method === 'POST' && path === `${base}/otp`) return { body: { sent: true, expiresAt: '2026-10-07T10:10:00.000Z', ...(overrides.devOtp ? { devOtp: overrides.devOtp } : {}) } };
    if (method === 'POST' && path === `${base}/verify`) {
      const otp = (body as { otp?: string } | undefined)?.otp;
      return otp === '123456' ? { body: session } : apiError(400, 'OTP_INVALID', 'Invalid code');
    }
    if (headers.get('x-csq-link-token') !== session.sessionToken) return apiError(401, 'UNAUTHENTICATED', 'Missing x-csq-link-token header');
    if (method === 'GET' && path === `${base}/form`) return { body: form };
    if (method === 'GET' && path === `${base}/draft`) return { body: overrides.draft ?? emptyDraft };
    if (method === 'PATCH' && path === `${base}/answers`) {
      const answers = (body as { answers: unknown[] }).answers;
      return { body: { answered: answers.length, total: 4, pct: Math.round((answers.length / 4) * 100), lastSavedAt: '2026-10-07T10:04:00.000Z' } };
    }
    if (method === 'GET' && path === `${base}/readiness`) return { body: { answered: 4, total: 4, missing: [], complete: true } };
    if (method === 'POST' && path === `${base}/submit`) return { body: { ...form.assessment, status: 'SUBMITTED', submittedAt: '2026-10-07T10:05:00.000Z' } };
    return undefined;
  };
}

export function renderAssess(token = TOKEN) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/assess/${token}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/assess/:token" element={<AssessPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
