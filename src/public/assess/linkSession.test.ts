import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearLinkSession, isSessionLive, linkSessionKey, readLinkSession, writeLinkSession } from './linkSession';

const NOW = Date.parse('2026-10-07T10:00:00Z');
const live = { sessionToken: 'jwt_live', expiresAt: '2026-10-07T22:00:00Z' };
const dead = { sessionToken: 'jwt_dead', expiresAt: '2026-10-07T09:00:00Z' };

describe('linkSession', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('keys by token', () => {
    expect(linkSessionKey('abc')).toBe('csq.assess.abc');
  });

  it('isSessionLive requires a token and a future expiry', () => {
    expect(isSessionLive(live, NOW)).toBe(true);
    expect(isSessionLive(dead, NOW)).toBe(false);
    expect(isSessionLive({ sessionToken: '', expiresAt: live.expiresAt }, NOW)).toBe(false);
    expect(isSessionLive({ sessionToken: 'x', expiresAt: 'nope' }, NOW)).toBe(false);
    expect(isSessionLive(null, NOW)).toBe(false);
  });

  it('round-trips a live session and drops an expired one on read', () => {
    writeLinkSession('t1', live);
    expect(readLinkSession('t1', NOW)).toEqual(live);

    writeLinkSession('t2', dead);
    expect(readLinkSession('t2', NOW)).toBeNull();
    expect(sessionStorage.getItem(linkSessionKey('t2'))).toBeNull();
  });

  it('ignores malformed storage', () => {
    sessionStorage.setItem(linkSessionKey('t3'), '{not json');
    expect(readLinkSession('t3', NOW)).toBeNull();
    sessionStorage.setItem(linkSessionKey('t4'), JSON.stringify({ foo: 1 }));
    expect(readLinkSession('t4', NOW)).toBeNull();
  });

  it('clears', () => {
    writeLinkSession('t5', live);
    clearLinkSession('t5');
    expect(readLinkSession('t5', NOW)).toBeNull();
  });

  it('never throws when storage is unavailable (private window)', () => {
    const blocked = () => {
      throw new Error('blocked');
    };
    vi.stubGlobal('sessionStorage', { getItem: blocked, setItem: blocked, removeItem: blocked });
    try {
      expect(() => writeLinkSession('t6', live)).not.toThrow();
      expect(readLinkSession('t6', NOW)).toBeNull();
      expect(() => clearLinkSession('t6')).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
