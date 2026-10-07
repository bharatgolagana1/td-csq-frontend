import { ApiError, isApiError } from '@/api/client';

/* `POST /cycles/:id/publish` refuses with PRECONDITION_FAILED (412), one guard at
   a time (cycles.service.ts publishCycle): status, windows `{ issues }`,
   participants, operator `{ acoId, code }`, market shares `{ airportId, iata,
   name, total }`, surveys `{ surveyType }`. `details` is a flat object for most
   of them; this parser reads that shape first and tolerates list shapes too, and
   always falls back to the message, so the dialog never shows a bare error. */

export type PublishProblemKind = 'MARKET_SHARE' | 'SURVEY' | 'WINDOWS' | 'PARTICIPANTS' | 'STATUS' | 'OTHER';

export type PublishProblem = {
  kind: PublishProblemKind;
  message: string;
  /** Where to fix it, as an app path (resolved by the caller through the shell). */
  fixPath?: string;
  fixLabel?: string;
  /** Builder step that can fix it when the builder is already open. */
  fixStep?: 'windows' | 'participants';
};

type Raw = {
  code?: string;
  kind?: string;
  type?: string;
  message?: string;
  path?: string | (string | number)[];
  airportId?: string;
  iata?: string | null;
  airport?: string | { id?: string; iata?: string; name?: string };
  name?: string | null;
  total?: number;
  surveyType?: string;
  acoId?: string;
  status?: string;
};

const FLAT_KEYS = ['airportId', 'iata', 'surveyType', 'acoId', 'status', 'path'] as const;

function kindOf(raw: Raw): PublishProblemKind {
  const text = `${raw.code ?? raw.kind ?? raw.type ?? ''} ${Array.isArray(raw.path) ? raw.path.join('.') : (raw.path ?? '')} ${raw.message ?? ''}`.toLowerCase();
  if (raw.airportId || raw.iata || raw.airport || /market|share/.test(text)) return 'MARKET_SHARE';
  if (raw.surveyType || /survey/.test(text)) return 'SURVEY';
  if (raw.acoId || /participant|operator/.test(text)) return 'PARTICIPANTS';
  if (/window|sampling|assessment|order|overlap|past|ended/.test(text)) return 'WINDOWS';
  if (raw.status || /only a draft|is (published|sampling|assessment|scored|archived)/.test(text)) return 'STATUS';
  if (/airport/.test(text)) return 'PARTICIPANTS';
  return 'OTHER';
}

function airportLabel(raw: Raw): string | undefined {
  if (typeof raw.airport === 'string') return raw.airport;
  const iata = raw.iata ?? raw.airport?.iata;
  const name = raw.name ?? raw.airport?.name;
  if (iata && name) return `${iata} · ${name}`;
  return iata ?? name ?? raw.airportId;
}

function toProblem(raw: Raw): PublishProblem {
  const kind = kindOf(raw);
  let message = raw.message ?? '';
  if (kind === 'MARKET_SHARE') {
    const label = airportLabel(raw);
    if (!message) message = label ? `Market shares at ${label} do not total 100 %` : 'Market shares do not total 100 %';
    if (typeof raw.total === 'number' && !/\d/.test(message)) message += ` (currently ${raw.total} %)`;
    return { kind, message, fixPath: '/market-share', fixLabel: 'Fix market shares' };
  }
  if (kind === 'SURVEY') {
    if (!message) message = raw.surveyType ? `The ${raw.surveyType.toLowerCase()} survey has no published version` : 'A survey has no published version';
    return { kind, message, fixPath: '/surveys', fixLabel: 'Open surveys' };
  }
  if (kind === 'WINDOWS') return { kind, message: message || 'The windows are not in order', fixStep: 'windows', fixLabel: 'Fix the windows' };
  if (kind === 'PARTICIPANTS') {
    return { kind, message: message || 'The cycle needs at least one participating airport and operator', fixStep: 'participants', fixLabel: 'Edit participants' };
  }
  if (kind === 'STATUS') return { kind, message: message || 'Only a draft cycle can be published' };
  return { kind, message: message || 'The cycle cannot be published yet' };
}

function rawList(details: unknown, message: string): Raw[] {
  if (!details) return [];
  if (Array.isArray(details)) return details.filter((d): d is Raw => typeof d === 'object' && d !== null);
  if (typeof details !== 'object') return [];
  const d = details as Record<string, unknown>;
  const out: Raw[] = [];
  for (const key of ['problems', 'issues', 'errors']) {
    const v = d[key];
    if (Array.isArray(v)) out.push(...rawList(v, message));
  }
  const shares = d.marketShare ?? d.marketShares ?? d.airports;
  if (Array.isArray(shares)) out.push(...rawList(shares, message).map((r) => ({ code: 'MARKET_SHARE', ...r })));
  const surveys = d.surveys ?? d.unpublishedSurveys;
  if (Array.isArray(surveys)) out.push(...surveys.map((s) => (typeof s === 'string' ? { code: 'SURVEY', surveyType: s } : { code: 'SURVEY', ...(s as Raw) })));
  // The backend's usual shape: one flat object describing the single failed guard.
  if (out.length === 0 && FLAT_KEYS.some((k) => d[k] !== undefined && d[k] !== null)) out.push({ ...(d as Raw), message });
  return out;
}

/** Problems to show in the publish dialog; empty when the error is not a precondition failure. */
export function publishProblems(error: unknown): PublishProblem[] {
  if (!(error instanceof ApiError)) return [];
  if (!isApiError(error, 'PRECONDITION_FAILED') && !isApiError(error, 'CONFLICT')) return [];
  const list = rawList(error.details, error.message).map(toProblem);
  if (list.length > 0) return list;
  return [toProblem({ message: error.message })];
}
