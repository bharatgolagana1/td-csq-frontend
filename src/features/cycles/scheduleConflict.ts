import { api } from '@/api/client';
import { type CycleSummary } from '@/api/cycles.types';

import { addCalendarDays, isCalendarDate, wallToDate } from './derive';

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
  return cycles.some((cycle) => cycle.id !== ownId
    && ['PUBLISHED', 'SAMPLING_OPEN', 'SAMPLING_CLOSED', 'ASSESSMENT_OPEN'].includes(cycle.status)
    && start < Date.parse(cycle.assessment.end.utc)
    && Date.parse(cycle.sampling.start.utc) < end);
}
