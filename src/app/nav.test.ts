import { describe, expect, it } from 'vitest';

import { defaultRoute, holdsTask, NAV, visibleSections } from './nav';

describe('nav', () => {
  it('declares every sidebar entry from ARCHITECTURE §4 exactly once', () => {
    const labels = NAV.flatMap((s) => s.items.map((i) => i.label));
    expect(labels).toEqual([
      'Overview',
      'Cycles',
      'Operators',
      'Airports',
      'Onboarding',
      'Surveys',
      'Market share',
      'Reports',
      'Customers',
      'Sampling',
      'Self-assessment',
      'Dashboard',
      'History',
      'Users & roles',
      'Notifications',
      'Audit',
      'Settings',
    ]);
  });

  it('gates items by task and hides empty sections', () => {
    const tasks = new Set(['customers.view', 'sampling.view', 'reports.operator', 'assessments.self']);
    const sections = visibleSections(tasks);
    expect(sections.map((s) => s.id)).toEqual(['operator']);
    expect(sections[0]?.items.map((i) => i.label)).toEqual(['Customers', 'Sampling', 'Self-assessment', 'Dashboard']);
  });

  it('shows Reports when either report task is held', () => {
    expect(holdsTask(new Set(['reports.airport']), ['reports.national', 'reports.airport'])).toBe(true);
    expect(visibleSections(new Set(['reports.airport']))[0]?.items[0]?.label).toBe('Reports');
    expect(visibleSections(new Set(['reports.operator']))[0]?.items.map((i) => i.label)).toEqual(['Dashboard']);
  });

  it('picks the default route by scope, falling back to the first visible item', () => {
    expect(defaultRoute({ kind: 'PLATFORM' }, new Set(['monitoring.view', 'cycles.view']))).toBe('/overview');
    expect(defaultRoute({ kind: 'ACO', acoId: 'a' }, new Set(['reports.operator']))).toBe('/dashboard');
    expect(defaultRoute({ kind: 'AIRPORT', airportId: 'x' }, new Set(['reports.airport']))).toBe('/reports/airport');
    expect(defaultRoute({ kind: 'ACO', acoId: 'a' }, new Set(['customers.view']))).toBe('/customers');
    expect(defaultRoute({ kind: 'ACO', acoId: 'a' }, new Set())).toBe('/no-access');
  });
});
