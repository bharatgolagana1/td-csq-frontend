import { api } from '@/api/client';
import { type CycleSummary } from '@/api/cycles.types';

import { addCalendarDays, deriveWindows, isCalendarDate, wallToDate } from './derive';

/** The statuses that reserve a cycle's whole schedule (backend RESERVING_CYCLE_STATUSES). */
const RESERVING = ['PUBLISHED', 'SAMPLING_OPEN', 'SAMPLING_CLOSED', 'ASSESSMENT_OPEN'];

function overlapsReserved(start: number, end: number, cycles: readonly CycleSummary[], ownId?: string): boolean {
  return cycles.some((cycle) => cycle.id !== ownId && RESERVING.includes(cycle.status) && start < Date.parse(cycle.assessment.end.utc) && Date.parse(cycle.sampling.start.utc) < end);
}

/** Read every page so a conflict cannot hide beyond the first results. */
export async function fetchCycleSchedule(signal?: AbortSignal): Promise<CycleSummary[]> {
  const cycles: CycleSummary[] = [];
  for (let page = 1; ; page += 1) {
    const result = await api.list<CycleSummary>('/cycles', { page, pageSize: 200, sort: '-createdAt' }, { signal });
    cycles.push(...result.data);
    if (page * result.meta.pageSize >= result.meta.total) return cycles;
    if (result.data.length === 0) throw new Error('Could not load the complete cycle schedule. Please retry.');
  }
}

/** Disable any day occupied by a published, unfinished cycle in the selected zone. */
export function isCycleDateReserved(date: string, tz: string, cycles: readonly CycleSummary[], ownId?: string): boolean {
  if (!isCalendarDate(date)) return false;
  const start = wallToDate(`${date}T00:00`, tz)?.getTime();
  const end = wallToDate(`${addCalendarDays(date, 1)}T00:00`, tz)?.getTime();
  if (start === undefined || end === undefined) return false;
  return overlapsReserved(start, end, cycles, ownId);
}

/**
 * The first initiation date from `from` whose derived windows (the platform
 * defaults) overlap no reserved cycle: a new draft's placeholder, so its first
 * save is not refused while another cycle runs. `from` when none is free in
 * two years (the server then says why).
 */
export function firstFreeInitiationDate(cycles: readonly CycleSummary[], tz: string, defaults: { samplingDays: number; assessmentDays: number }, from: string): string {
  if (!isCalendarDate(from)) return from;
  for (let day = 0; day < 730; day += 1) {
    const date = addCalendarDays(from, day);
    const windows = deriveWindows(date, defaults);
    const start = wallToDate(windows.sampling.start, tz)?.getTime();
    const end = wallToDate(windows.assessment.end, tz)?.getTime();
    if (start === undefined || end === undefined) return from;
    if (!overlapsReserved(start, end, cycles)) return date;
  }
  return from;
}
