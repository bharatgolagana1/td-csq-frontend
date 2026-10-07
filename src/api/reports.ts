import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getAccessToken } from '@/auth/keycloak';
import { useSession } from '@/auth/session';
import { type SelectOption } from '@/design/primitives/Select/Select';

import { api, ApiError, buildUrl, NetworkError } from './client';
import { useOperators } from './organisations';
import {
  type AirportOption,
  type AirportReport,
  type ComparisonReport,
  type CycleOption,
  type CycleType,
  type ExportQuery,
  type NationalReport,
  type OperatorQuestions,
  type OperatorReport,
  type ReportQuery,
  type SurveyType,
} from './reports.types';
import { readSelectedOrg } from './selectedOrg';

/* reports module hooks (§6 "scoring and reports"). Keys: ['reports', ...].
   Report queries keep the previous payload while a new selection loads so the
   charts hold their frame (no skeleton flash on refetch). */

export const reportKeys = {
  all: ['reports'] as const,
  operator: (acoId: string, query: ReportQuery) => ['reports', 'operator', acoId, query] as const,
  questions: (acoId: string, query: ReportQuery) => ['reports', 'operator', acoId, 'questions', query] as const,
  airport: (airportId: string, query: ReportQuery) => ['reports', 'airport', airportId, query] as const,
  national: (query: ReportQuery) => ['reports', 'national', query] as const,
  comparison: (acoId: string, cycleIds: string[], surveyType?: SurveyType) => ['reports', 'comparison', acoId, cycleIds, surveyType ?? null] as const,
  cycles: ['reports', 'cycles'] as const,
  airports: ['reports', 'airports'] as const,
};

export function useOperatorReport(acoId: string | undefined, query: ReportQuery = {}, enabled = true) {
  return useQuery({
    queryKey: reportKeys.operator(acoId ?? '', query),
    queryFn: ({ signal }) => api.get<OperatorReport>(`/reports/operator/${acoId}`, { query, signal }),
    enabled: enabled && Boolean(acoId),
    placeholderData: keepPreviousData,
  });
}

export function useOperatorQuestions(acoId: string | undefined, query: ReportQuery = {}, enabled = true) {
  return useQuery({
    queryKey: reportKeys.questions(acoId ?? '', query),
    queryFn: ({ signal }) => api.get<OperatorQuestions>(`/reports/operator/${acoId}/questions`, { query, signal }),
    enabled: enabled && Boolean(acoId),
    placeholderData: keepPreviousData,
  });
}

export function useAirportReport(airportId: string | undefined, query: ReportQuery = {}, enabled = true) {
  return useQuery({
    queryKey: reportKeys.airport(airportId ?? '', query),
    queryFn: ({ signal }) => api.get<AirportReport>(`/reports/airport/${airportId}`, { query, signal }),
    enabled: enabled && Boolean(airportId),
    placeholderData: keepPreviousData,
  });
}

export function useNationalReport(query: ReportQuery = {}, enabled = true) {
  return useQuery({
    queryKey: reportKeys.national(query),
    queryFn: ({ signal }) => api.get<NationalReport>('/reports/national', { query, signal }),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useComparison(acoId: string | undefined, cycleIds: string[], surveyType?: SurveyType) {
  const ids = cycleIds.filter(Boolean);
  return useQuery({
    queryKey: reportKeys.comparison(acoId ?? '', ids, surveyType),
    queryFn: ({ signal }) => api.get<ComparisonReport>('/reports/comparison', { query: { acoId, cycleIds: ids.join(','), surveyType }, signal }),
    enabled: Boolean(acoId) && ids.length >= 2,
    placeholderData: keepPreviousData,
  });
}

/** Cycles the caller may see, newest first (the selectors filter to reportable ones). */
export function useReportCycles(enabled = true) {
  return useQuery({
    queryKey: reportKeys.cycles,
    queryFn: ({ signal }) => api.list<CycleOption>('/cycles', { page: 1, pageSize: 100, sort: '-createdAt' }, { signal }),
    enabled,
    select: (page) => page.data,
  });
}

export function useReportAirports(enabled = true) {
  return useQuery({
    queryKey: reportKeys.airports,
    queryFn: ({ signal }) => api.list<AirportOption>('/airports', { page: 1, pageSize: 200, active: true, sort: 'iata' }, { signal }),
    enabled,
    select: (page) => page.data,
  });
}

// --- cycle selection helpers (pure) ------------------------------------------

const FINAL_STATUSES = new Set(['SCORED', 'ARCHIVED']);
const LIVE_STATUSES = new Set(['PUBLISHED', 'SAMPLING_OPEN', 'SAMPLING_CLOSED', 'ASSESSMENT_OPEN', 'ASSESSMENT_CLOSED']);

/** A SCORED (or archived after scoring) cycle carries final figures. */
export function isScoredStatus(status: string): boolean {
  return FINAL_STATUSES.has(status);
}

/** A published cycle not scored yet: its figures are provisional. */
export function isLiveStatus(status: string): boolean {
  return LIVE_STATUSES.has(status);
}

/** Scored cycles (newest first) followed by the live ones; drafts are never reportable. */
export function reportableCycles(rows: readonly CycleOption[], types?: readonly CycleType[]): CycleOption[] {
  const wanted = (c: CycleOption) => !types || types.includes(c.type) || c.type === 'BOTH';
  const scored = rows.filter((c) => isScoredStatus(c.status) && wanted(c));
  const live = rows.filter((c) => isLiveStatus(c.status) && wanted(c));
  return [...scored, ...live];
}

export function cycleOptionLabel(cycle: CycleOption): string {
  return isScoredStatus(cycle.status) ? cycle.name : `${cycle.name} · provisional`;
}

export function cycleSelectOptions(rows: readonly CycleOption[], types?: readonly CycleType[]): SelectOption[] {
  return reportableCycles(rows, types).map((c) => ({ value: c.id, label: cycleOptionLabel(c) }));
}

/** The survey types a cycle offers; a BOTH cycle offers a toggle. */
export function surveyTypesOf(type: CycleType | undefined): SurveyType[] {
  if (type === 'BOTH') return ['DOMESTIC', 'INTERNATIONAL'];
  if (type === 'INTERNATIONAL') return ['INTERNATIONAL'];
  if (type === 'DOMESTIC') return ['DOMESTIC'];
  return [];
}

export const SURVEY_TYPE_LABELS: Record<SurveyType, string> = { DOMESTIC: 'Domestic', INTERNATIONAL: 'International' };

export function isSurveyType(value: string | null | undefined): value is SurveyType {
  return value === 'DOMESTIC' || value === 'INTERNATIONAL';
}

export type ReportSelection = {
  cycle: CycleOption | null;
  surveyType: SurveyType | undefined;
  /** The cycle's survey types; a toggle is shown when there are two. */
  surveyTypes: SurveyType[];
  provisional: boolean;
};

/**
 * The cycle and survey type a report is about: the requested cycle when it is
 * reportable, else the newest SCORED one, else the live one (provisional); the
 * requested survey type when the cycle offers it, else the cycle's first.
 */
export function resolveReportSelection(rows: readonly CycleOption[], wanted: { cycleId?: string; surveyType?: string | null }): ReportSelection {
  const candidates = reportableCycles(rows);
  const cycle = (wanted.cycleId ? candidates.find((c) => c.id === wanted.cycleId) : undefined) ?? candidates[0] ?? null;
  const surveyTypes = surveyTypesOf(cycle?.type);
  const surveyType = isSurveyType(wanted.surveyType) && surveyTypes.includes(wanted.surveyType) ? wanted.surveyType : surveyTypes[0];
  return { cycle, surveyType, surveyTypes, provisional: cycle ? !isScoredStatus(cycle.status) : false };
}

/** `b − a` to 2 dp, only when both are known. */
export function deltaOf(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (current === null || current === undefined || previous === null || previous === undefined) return null;
  return Math.round((current - previous) * 100) / 100;
}

// --- selection state in the URL ---------------------------------------------

export type ReportParamPatch = Partial<Record<'cycleId' | 'surveyType' | 'acoId' | 'airportId' | 'cycles' | 'level', string | undefined>>;

/** The report selection lives in the search params so links (tabs, exports) carry it. */
export function useReportParams() {
  const [params, setParams] = useSearchParams();
  const set = useCallback(
    (patch: ReportParamPatch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => {
            if (value) next.set(key, value);
            else next.delete(key);
          });
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  const surveyType = params.get('surveyType');
  return {
    cycleId: params.get('cycleId') ?? '',
    surveyType: isSurveyType(surveyType) ? surveyType : undefined,
    acoId: params.get('acoId') ?? '',
    airportId: params.get('airportId') ?? '',
    cycles: (params.get('cycles') ?? '').split(',').filter(Boolean),
    level: params.get('level') ?? '',
    search: params.toString(),
    set,
  };
}

/**
 * The cycle and survey type a report shows, resolved from the cycle list and
 * the URL. The report query waits for the list (`ready`) so the first fetch
 * already carries the selection; when the list cannot be read, the API's own
 * default (newest scored, else live) applies.
 */
export function useCycleSelection() {
  const params = useReportParams();
  const cycles = useReportCycles();
  const selection = useMemo(
    () => resolveReportSelection(cycles.data ?? [], { cycleId: params.cycleId, surveyType: params.surveyType }),
    [cycles.data, params.cycleId, params.surveyType],
  );
  const query = useMemo<ReportQuery>(
    () => (cycles.isSuccess ? { cycleId: selection.cycle?.id, surveyType: selection.surveyType } : {}),
    [cycles.isSuccess, selection.cycle?.id, selection.surveyType],
  );
  const noCycles = cycles.isSuccess && selection.cycle === null;
  const set = params.set;
  const setCycle = useCallback((cycleId: string) => set({ cycleId, surveyType: undefined }), [set]);
  const setSurveyType = useCallback((surveyType: SurveyType) => set({ surveyType }), [set]);
  return {
    cycles: cycles.data ?? [],
    cyclesLoading: cycles.isPending,
    selection,
    query,
    ready: (cycles.isSuccess || cycles.isError) && !noCycles,
    noCycles,
    search: params.search,
    setCycle,
    setSurveyType,
  };
}

export type CycleSelection = ReturnType<typeof useCycleSelection>;

export type ScopeOption = { value: string; label: string };

/**
 * Which operator a report is about: an ACO user's own; platform and airport
 * users choose one (the first active operator until they do). Airport users
 * see only the operators at their airport.
 */
export function useOperatorScope(explicitAcoId?: string) {
  const { scope } = useSession();
  const { acoId: param, set } = useReportParams();
  const canChoose = scope.kind !== 'ACO';
  const airportId = scope.kind === 'AIRPORT' ? scope.airportId : undefined;
  const operators = useOperators({ pageSize: 200, status: 'ACTIVE', sort: 'name', ...(airportId ? { airportId } : {}) }, canChoose);
  const options = useMemo<ScopeOption[]>(() => (operators.data?.data ?? []).map((o) => ({ value: o.id, label: `${o.name} · ${o.airport.iata}` })), [operators.data]);
  const own = scope.kind === 'ACO' ? scope.acoId : '';
  const chosen = explicitAcoId || param;
  const acoId = own || (chosen && (options.length === 0 || options.some((o) => o.value === chosen)) ? chosen : (options[0]?.value ?? ''));
  const setAcoId = useCallback((id: string) => set({ acoId: id }), [set]);
  return { acoId, canChoose, options, setAcoId, loading: canChoose && operators.isPending, error: canChoose ? operators.error : null };
}

/** Which airport a report is about: airport users their own, ACO users the one they operate at, platform users choose. */
export function useAirportScope() {
  const { scope, org } = useSession();
  const { airportId: param, set } = useReportParams();
  const canChoose = scope.kind === 'PLATFORM';
  const airports = useReportAirports(canChoose);
  const options = useMemo<ScopeOption[]>(() => (airports.data ?? []).map((a) => ({ value: a.id, label: `${a.name} · ${a.iata}` })), [airports.data]);
  const own = scope.kind === 'AIRPORT' ? scope.airportId : scope.kind === 'ACO' ? (org.airportId ?? '') : '';
  const airportId = own || (param && options.some((o) => o.value === param) ? param : (options[0]?.value ?? ''));
  const setAirportId = useCallback((id: string) => set({ airportId: id }), [set]);
  return { airportId, canChoose, options, setAirportId, loading: canChoose && airports.isPending, error: canChoose ? airports.error : null };
}

// --- exports -----------------------------------------------------------------

export function exportFileName(query: ExportQuery, cycleCode?: string): string {
  const parts = ['csq', query.scope, cycleCode ?? query.cycleId ?? 'current', query.surveyType?.toLowerCase()].filter(Boolean);
  return `${parts.join('-')}.${query.format ?? 'csv'}`;
}

function fileNameFromDisposition(header: string | null): string | undefined {
  if (!header) return undefined;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1];
}

/** Saves a browser Blob as a file: an object URL on a temporary anchor. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/**
 * GET /reports/export streams a file, not JSON, so it bypasses `api.get`. Same
 * headers as the client (bearer + x-csq-org); errors map to ApiError.
 */
export async function downloadExport(query: ExportQuery, cycleCode?: string): Promise<string> {
  const headers = new Headers({ Accept: 'text/csv, application/octet-stream' });
  const token = await getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const org = readSelectedOrg();
  if (org) headers.set('x-csq-org', org);

  let res: Response;
  try {
    res = await fetch(buildUrl('/reports/export', { ...query, format: query.format ?? 'csv' }), { headers, credentials: 'omit' });
  } catch {
    throw new NetworkError();
  }
  if (!res.ok) {
    let body: { error?: { code?: string; message?: string; details?: unknown; requestId?: string } } = {};
    try {
      body = (await res.json()) as typeof body;
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(res.status, body.error?.code ?? 'INTERNAL', body.error?.message ?? `Export failed (${res.status})`, body.error?.details, body.error?.requestId ?? res.headers.get('x-request-id') ?? undefined);
  }
  const name = fileNameFromDisposition(res.headers.get('content-disposition')) ?? exportFileName(query, cycleCode);
  saveBlob(await res.blob(), name);
  return name;
}

export function useExportReport() {
  return useMutation({ mutationFn: ({ query, cycleCode }: { query: ExportQuery; cycleCode?: string }) => downloadExport(query, cycleCode) });
}
