import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';

import { categories } from './fixtures';
import { applyQuestionServerErrors, questionFormField, questionSchema, questionValues } from './nodeForms';
import { countActiveQuestions, countByHead, emptyGroupWarnings, mergeIssues, publishIssues, summariseWeights, weightIssues } from './surveyRules';

describe('surveyRules', () => {
  it('summariseWeights: all-or-none, totalling 100 within tolerance', () => {
    expect(summariseWeights([])).toEqual({ state: 'unweighted', total: 0, count: 0 });
    expect(summariseWeights([{ code: 'A', weightPct: null }, { code: 'B', weightPct: null }])).toMatchObject({ state: 'unweighted' });
    expect(summariseWeights([{ code: 'A', weightPct: 60 }, { code: 'B', weightPct: null }])).toEqual({ state: 'partial', total: 60, count: 2, missing: ['B'] });
    expect(summariseWeights([{ code: 'A', weightPct: 60 }, { code: 'B', weightPct: 30 }])).toEqual({ state: 'off', total: 90, count: 2 });
    expect(summariseWeights([{ code: 'A', weightPct: 33.333 }, { code: 'B', weightPct: 33.333 }, { code: 'C', weightPct: 33.334 }])).toMatchObject({ state: 'ok' });
  });

  it('publishIssues mirrors the API: empty survey, no active question, weight rules with the same paths', () => {
    expect(publishIssues([])).toEqual([{ path: 'categories', message: 'A survey needs at least one category' }]);
    const tree = categories();
    expect(publishIssues(tree)).toEqual([]);
    const c1 = tree[0];
    if (!c1) throw new Error('fixture');
    c1.questions.forEach((q) => (q.active = false));
    tree[1]?.subcategories[0]?.questions.forEach((q) => (q.active = false));
    expect(publishIssues(tree)).toEqual([{ path: 'questions', message: 'A survey needs at least one active question' }]);

    const weighted = categories();
    const w1 = weighted[0];
    if (!w1) throw new Error('fixture');
    w1.weightPct = 70;
    const q = w1.questions[0];
    if (q) q.weightPct = 50;
    expect(weightIssues(weighted)).toEqual([
      { path: 'categories', message: 'weightPct is set on some categories but not on SEC' },
      { path: 'categories.INFRA.questions', message: 'weightPct is set on some questions but not on ACFI.INFRA.USER_AMENITIES' },
    ]);
  });

  it('emptyGroupWarnings flags groups an assessor would never see; inactive questions do not count', () => {
    const tree = categories();
    expect(emptyGroupWarnings(tree)).toEqual([]);
    const sub = tree[1]?.subcategories[0];
    if (!sub) throw new Error('fixture');
    sub.questions.forEach((q) => (q.active = false));
    expect(emptyGroupWarnings(tree)).toEqual([
      { path: 'categories.SEC', message: 'Category SEC (Security and safety) has no active question' },
      { path: 'categories.SEC.subcategories.SCREEN', message: 'Subcategory SCREEN (Screening) has no active question' },
    ]);
  });

  it('counts and merges', () => {
    const tree = categories();
    expect(countActiveQuestions(tree)).toBe(3);
    expect(Array.from(countByHead(tree).values())).toEqual([
      { code: 'INFRA', name: 'Infrastructure and facilities', count: 2 },
      { code: 'SEC', name: 'Security and safety', count: 1 },
    ]);
    const a = { path: 'x', message: 'same' };
    expect(mergeIssues([a], [{ ...a }, { path: 'y', message: 'other' }])).toHaveLength(2);
  });
});

describe('nodeForms', () => {
  it('questionSchema needs a prompt and an option when the follow-up is on, and maps weights', () => {
    const base = questionValues(undefined, 'cat:c1');
    const off = questionSchema.safeParse({ ...base, code: 'acfi.x', text: 'Q?', weightPct: ' 12.5 ' });
    expect(off.success).toBe(true);
    if (off.success) expect(off.data).toMatchObject({ code: 'ACFI.X', weightPct: 12.5 });

    const on = questionSchema.safeParse({ ...base, code: 'A', text: 'Q?', followUpEnabled: true, followUpPrompt: '', followUpOptions: [''] });
    expect(on.success).toBe(false);
    if (!on.success) expect(on.error.issues.map((i) => i.path.join('.'))).toEqual(['followUpPrompt', 'followUpOptions']);

    expect(questionSchema.safeParse({ ...base, code: 'A', text: 'Q?', weightPct: '120' }).success).toBe(false);
  });

  it('maps server field paths onto form fields', () => {
    expect(questionFormField('subcategoryId')).toBe('placement');
    expect(questionFormField('followUp.options.3')).toBe('followUpOptions');
    expect(questionFormField('order')).toBeNull();
    const calls: unknown[] = [];
    const setError = (name: unknown, err: unknown) => calls.push([name, err]);
    const error = new ApiError(400, 'VALIDATION', 'Invalid body', { issues: [{ path: 'followUp.prompt', message: 'too long' }, { path: 'order', message: 'ignored' }] });
    expect(applyQuestionServerErrors(error, setError as never)).toBe(true);
    expect(calls).toEqual([['followUpPrompt', { type: 'server', message: 'too long' }]]);
  });
});
