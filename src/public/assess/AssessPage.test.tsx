import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: false },
  getAccessToken: vi.fn(async () => null),
  forceRefreshToken: vi.fn(async () => false),
}));

import { apiError, happyBackend, invitation, mockApi, renderAssess, session, TOKEN } from './test.helpers';

const base = `/public/assess/${TOKEN}`;

describe('/assess/:token state machine', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    // Node ≥ 22 exposes its own (unavailable) `localStorage` global that shadows jsdom's here.
    window.localStorage?.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('landing → otp → form: sends a code, verifies it, stores the session and loads the questionnaire with the link token', async () => {
    const user = userEvent.setup();
    const { calls } = mockApi(happyBackend());
    renderAssess();

    // landing
    expect(await screen.findByRole('heading', { name: 'Delhi Cargo Services' })).toBeInTheDocument();
    expect(screen.getByText('a***@delcargo.test', { selector: 'dd span' })).toBeInTheDocument();
    expect(screen.getByText(/Nobody at Delhi Cargo Services sees an individual response/)).toBeInTheDocument();
    expect(screen.getByText(/31 Oct 2026, 23:59/)).toBeInTheDocument();
    expect(screen.getByText('Freight forwarder', { exact: false })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Delhi Cargo Services' })).toHaveFocus());

    await user.click(screen.getByRole('button', { name: 'Send me a code' }));

    // otp
    expect(await screen.findByRole('heading', { name: 'Enter the code' })).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'POST' && c.path === `${base}/otp`)).toBe(true);
    expect(screen.getByText(/5 attempts per code/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('textbox')[0]).toHaveFocus());
    await user.keyboard('123456');

    // form (auto-submitted on the sixth digit)
    await waitFor(() => expect(calls.some((c) => c.method === 'GET' && c.path === `${base}/form`)).toBe(true));
    const formCall = calls.find((c) => c.method === 'GET' && c.path === `${base}/form`);
    expect(formCall?.headers.get('x-csq-link-token')).toBe(session.sessionToken);
    expect(formCall?.headers.get('Authorization')).toBeNull();
    expect(JSON.parse(sessionStorage.getItem(`csq.assess.${TOKEN}`) ?? 'null')).toMatchObject({ sessionToken: session.sessionToken });
    expect(await screen.findByText('Domestic cargo service quality', { exact: false })).toBeInTheDocument();
  });

  it('fills the dev OTP banner when the backend reveals the code', async () => {
    const user = userEvent.setup();
    mockApi(happyBackend({ devOtp: '123456' }));
    renderAssess();
    await user.click(await screen.findByRole('button', { name: 'Send me a code' }));
    const banner = await screen.findByTestId('dev-otp');
    expect(banner).toHaveTextContent('123456');
    await user.click(screen.getByRole('button', { name: 'Fill' }));
    await user.click(screen.getByRole('button', { name: 'Verify and start' }));
    expect(await screen.findByText('Domestic cargo service quality', { exact: false })).toBeInTheDocument();
  });

  it('wrong OTP ×5 counts down the attempts, then locks until a new code is requested', async () => {
    const user = userEvent.setup();
    mockApi(happyBackend());
    renderAssess();
    await user.click(await screen.findByRole('button', { name: 'Send me a code' }));
    await screen.findByRole('heading', { name: 'Enter the code' });

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      await waitFor(() => expect(screen.getAllByRole('textbox')[0]).toHaveFocus());
      await user.keyboard('000000');
      expect(await screen.findByText(`That code is not right · ${5 - attempt} ${5 - attempt === 1 ? 'attempt' : 'attempts'} left`)).toBeInTheDocument();
    }
    await waitFor(() => expect(screen.getAllByRole('textbox')[0]).toHaveFocus());
    await user.keyboard('000000');
    expect(await screen.findByText(/No attempts left for this code/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Verify and start' })).toBeNull();
    const resend = screen.getByRole('button', { name: /Request a new code/ });
    expect(resend).toBeDisabled(); // 30 s cooldown since the first send
    screen.getAllByRole('textbox').forEach((box) => expect(box).toBeDisabled());
  });

  it('honours the server attempt counter in OTP_INVALID details', async () => {
    const user = userEvent.setup();
    mockApi(({ method, path }) => (method === 'POST' && path === `${base}/verify` ? apiError(400, 'OTP_INVALID', 'Invalid code', { attemptsLeft: 1 }) : undefined), happyBackend());
    renderAssess();
    await user.click(await screen.findByRole('button', { name: 'Send me a code' }));
    await waitFor(() => expect(screen.getAllByRole('textbox')[0]).toHaveFocus());
    await user.keyboard('000000');
    expect(await screen.findByText('That code is not right · 1 attempt left')).toBeInTheDocument();
  });

  it('a verified session in sessionStorage skips the OTP', async () => {
    sessionStorage.setItem(`csq.assess.${TOKEN}`, JSON.stringify(session));
    const { calls } = mockApi(happyBackend());
    renderAssess();
    expect(await screen.findByText('Domestic cargo service quality', { exact: false })).toBeInTheDocument();
    expect(calls.some((c) => c.path.endsWith('/otp'))).toBe(false);
    expect(screen.queryByRole('button', { name: 'Send me a code' })).toBeNull();
  });

  it('an expired stored session is ignored and the landing shows', async () => {
    sessionStorage.setItem(`csq.assess.${TOKEN}`, JSON.stringify({ ...session, expiresAt: '2020-01-01T00:00:00Z' }));
    mockApi(happyBackend());
    renderAssess();
    expect(await screen.findByRole('button', { name: 'Send me a code' })).toBeInTheDocument();
  });

  it('a rejected link token sends the participant back to the landing with a note', async () => {
    sessionStorage.setItem(`csq.assess.${TOKEN}`, JSON.stringify(session));
    mockApi(({ method, path }) => (method === 'GET' && path === `${base}/form` ? apiError(401, 'UNAUTHENTICATED', 'Invalid link session') : undefined), happyBackend());
    renderAssess();
    expect(await screen.findByText(/Your session ended/)).toBeInTheDocument();
    expect(sessionStorage.getItem(`csq.assess.${TOKEN}`)).toBeNull();
  });

  it('expired: the invitation state closes the page calmly', async () => {
    mockApi(happyBackend({ invitation: { state: 'EXPIRED' } }));
    renderAssess();
    expect(await screen.findByRole('heading', { name: 'This assessment has closed' })).toBeInTheDocument();
    expect(screen.getByText(/Closed 31 Oct 2026, 23:59/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('expired: a 410 while requesting the code closes the page', async () => {
    const user = userEvent.setup();
    mockApi(({ method, path }) => (method === 'POST' && path === `${base}/otp` ? apiError(410, 'LINK_EXPIRED', 'This link has expired') : undefined), happyBackend());
    renderAssess();
    await user.click(await screen.findByRole('button', { name: 'Send me a code' }));
    expect(await screen.findByRole('heading', { name: 'This assessment has closed' })).toBeInTheDocument();
  });

  it('submitted: shows the thank-you with the submission time', async () => {
    mockApi(happyBackend({ invitation: { state: 'SUBMITTED', submittedAt: '2026-10-05T04:30:00.000Z' } }));
    renderAssess();
    expect(await screen.findByRole('heading', { name: 'Thank you — this assessment is in' })).toBeInTheDocument();
    expect(screen.getByText(/Submitted 5 Oct 2026, 10:00/)).toBeInTheDocument();
  });

  it('revoked and unknown links', async () => {
    mockApi(happyBackend({ invitation: { state: 'REVOKED' } }));
    const { unmount } = renderAssess();
    expect(await screen.findByRole('heading', { name: 'This link is no longer active' })).toBeInTheDocument();
    unmount();

    mockApi(() => apiError(404, 'NOT_FOUND', 'Not found'));
    renderAssess();
    expect(await screen.findByRole('heading', { name: 'We could not find this invitation' })).toBeInTheDocument();
  });

  it('a server error offers a retry with the request id', async () => {
    const user = userEvent.setup();
    let failures = 1;
    mockApi(({ method, path }) => {
      if (method === 'GET' && path === base && failures > 0) {
        failures -= 1;
        return apiError(500, 'INTERNAL', 'Internal server error');
      }
      return undefined;
    }, happyBackend());
    renderAssess();
    expect(await screen.findByRole('heading', { name: 'We could not open this invitation' })).toBeInTheDocument();
    expect(screen.getByText(/Request req_internal/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: invitation.operator.name })).toBeInTheDocument();
  });

  it('rate-limited code requests explain the wait', async () => {
    const user = userEvent.setup();
    mockApi(({ method, path }) => (method === 'POST' && path === `${base}/otp` ? apiError(429, 'RATE_LIMITED', 'Too many requests', { retryAfterMs: 120_000 }) : undefined), happyBackend());
    renderAssess();
    await user.click(await screen.findByRole('button', { name: 'Send me a code' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Too many codes were requested/);
  });

  it('form → done: answers every question, saves through the link token, confirms and submits', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(`csq.assess.${TOKEN}`, JSON.stringify(session));
    const { calls } = mockApi(happyBackend());
    renderAssess();
    await screen.findByText('Domestic cargo service quality', { exact: false });
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Domestic cargo service quality' })).toHaveFocus());

    // Step 1 · Operations (q1, q2)
    for (const radio of screen.getAllByRole('radio', { name: 'Excellent' })) await user.click(radio);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    // Step 2 · Security (q3, q4)
    for (const radio of await screen.findAllByRole('radio', { name: 'Very good' })) await user.click(radio);
    await user.click(screen.getByRole('button', { name: 'Review' }));

    expect(await screen.findByText('Everything is answered')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('4 of 4 questions answered');
    expect(dialog).toHaveTextContent(/only in aggregate/);
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
    expect(screen.getByText(/Submitted 7 Oct 2026, 15:35/)).toBeInTheDocument();

    const saves = calls.filter((c) => c.method === 'PATCH' && c.path === `${base}/answers`);
    expect(saves.length).toBeGreaterThan(0);
    saves.forEach((c) => expect(c.headers.get('x-csq-link-token')).toBe(session.sessionToken));
    const sent = saves.flatMap((c) => (c.body as { answers: { questionId: string; rating: number }[] }).answers);
    expect(new Set(sent.map((a) => a.questionId))).toEqual(new Set(['q1', 'q2', 'q3', 'q4']));
    expect(sent.find((a) => a.questionId === 'q3')?.rating).toBe(4);
    const submit = calls.find((c) => c.method === 'POST' && c.path === `${base}/submit`);
    expect(submit?.headers.get('x-csq-link-token')).toBe(session.sessionToken);
    expect(window.sessionStorage.getItem(`csq.assess.${TOKEN}`)).toBeNull();
  });

  it('a link that dies mid-form closes the page on the next save', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(`csq.assess.${TOKEN}`, JSON.stringify(session));
    mockApi(({ method, path }) => (method === 'PATCH' && path === `${base}/answers` ? apiError(410, 'LINK_EXPIRED', 'This link has expired') : undefined), happyBackend());
    renderAssess();
    await screen.findByText('Domestic cargo service quality', { exact: false });
    await user.click(screen.getAllByRole('radio', { name: 'Good' })[0] as HTMLElement);
    expect(await screen.findByRole('heading', { name: 'This assessment has closed' }, { timeout: 4000 })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(`csq.assess.${TOKEN}`)).toBeNull();
  });

  it('replays answers queued on this device under the token key', async () => {
    window.sessionStorage.setItem(`csq.assess.${TOKEN}`, JSON.stringify(session));
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    });
    store.set(`csq.assess.${TOKEN}`, JSON.stringify({ v: 1, answers: { q3: { questionId: 'q3', rating: 4, na: false, comment: '', followUp: [] } } }));
    const { calls } = mockApi(happyBackend());
    renderAssess();
    await screen.findByText('Domestic cargo service quality', { exact: false });
    await waitFor(() => expect(calls.some((c) => c.method === 'PATCH' && c.path === `${base}/answers`)).toBe(true));
    const save = calls.find((c) => c.method === 'PATCH' && c.path === `${base}/answers`);
    expect(save?.body).toEqual({ answers: [{ questionId: 'q3', rating: 4, na: false, comment: null, followUp: [] }] });
    await waitFor(() => expect(store.has(`csq.assess.${TOKEN}`)).toBe(false));
  });
});
