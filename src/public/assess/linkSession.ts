import { type LinkSession } from '@/api/publicAssess.types';

/* The verified link session (from POST …/verify) lives in sessionStorage so a
   participant who reloads or returns within the tab's life skips the OTP.
   Every access is wrapped: private windows and blocked storage must not break
   the page — they only cost an extra code. */

export function linkSessionKey(token: string): string {
  return `csq.assess.${token}`;
}

export function isSessionLive(session: LinkSession | null | undefined, now = Date.now()): session is LinkSession {
  if (!session || typeof session.sessionToken !== 'string' || !session.sessionToken) return false;
  const expires = Date.parse(session.expiresAt);
  return Number.isFinite(expires) && expires > now;
}

/** The live session for this token, or null when missing, malformed or expired. */
export function readLinkSession(token: string, now = Date.now()): LinkSession | null {
  try {
    const raw = sessionStorage.getItem(linkSessionKey(token));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LinkSession;
    if (!isSessionLive(parsed, now)) {
      sessionStorage.removeItem(linkSessionKey(token));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeLinkSession(token: string, session: LinkSession): void {
  try {
    sessionStorage.setItem(linkSessionKey(token), JSON.stringify(session));
  } catch {
    /* storage unavailable: the session stays in memory for this visit */
  }
}

export function clearLinkSession(token: string): void {
  try {
    sessionStorage.removeItem(linkSessionKey(token));
  } catch {
    /* nothing to clear */
  }
}
