import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';

import { publishProblems } from './publishProblems';

const e412 = (message: string, details?: unknown) => new ApiError(412, 'PRECONDITION_FAILED', message, details, 'req_1');

describe('publishProblems', () => {
  it('maps the market-share guard to a Market share link', () => {
    const [p] = publishProblems(e412('Market shares at BOM (Mumbai) total 80, not 100', { airportId: 'ap-bom', iata: 'BOM', name: 'Mumbai', total: 80 }));
    expect(p).toMatchObject({ kind: 'MARKET_SHARE', fixPath: '/market-share', fixLabel: 'Fix market shares' });
    expect(p?.message).toBe('Market shares at BOM (Mumbai) total 80, not 100');
  });

  it('maps the survey guard to the surveys page', () => {
    const [p] = publishProblems(e412('No published INTERNATIONAL survey version; publish the international survey first', { surveyType: 'INTERNATIONAL' }));
    expect(p).toMatchObject({ kind: 'SURVEY', fixPath: '/surveys' });
  });

  it('maps window issues and operator problems to builder steps', () => {
    const windows = publishProblems(e412('Cycle windows are not valid for publishing', { issues: [{ path: 'sampling.end', code: 'IN_THE_PAST', message: 'Sampling has already ended' }] }));
    expect(windows).toEqual([{ kind: 'WINDOWS', message: 'Sampling has already ended', fixStep: 'windows', fixLabel: 'Fix the windows' }]);
    const op = publishProblems(e412('Operator MCT-BOM is not at a participating airport', { acoId: 'org-mial', code: 'MCT-BOM' }));
    expect(op[0]).toMatchObject({ kind: 'PARTICIPANTS', fixStep: 'participants' });
  });

  it('falls back to the message and ignores other errors', () => {
    expect(publishProblems(e412('A cycle needs at least one participating airport and operator'))).toEqual([
      { kind: 'PARTICIPANTS', message: 'A cycle needs at least one participating airport and operator', fixStep: 'participants', fixLabel: 'Edit participants' },
    ]);
    expect(publishProblems(e412('Cycle is PUBLISHED; only a DRAFT cycle can be published', { status: 'PUBLISHED' }))[0]?.kind).toBe('STATUS');
    expect(publishProblems(new ApiError(500, 'INTERNAL', 'boom'))).toEqual([]);
    expect(publishProblems(new Error('x'))).toEqual([]);
  });
});
