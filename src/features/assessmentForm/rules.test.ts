import { describe, expect, it } from 'vitest';

import { type DetailAnswer } from '@/api/assessments.types';

import { answerIssues, answersToMap, formSteps, groupsFromDetail, groupsFromForm, missingRemarks, ownScore, readinessOf, remarkReviewItems, remarksToMap, reviewItems, stepQuestions, toAnswerInput } from './rules';
import { answer, COMPLETE, FORM, Q1, Q2, Q3, REMARKS } from './testFixtures';

describe('form rules', () => {
  it('numbers questions across steps in display order', () => {
    const steps = formSteps(FORM);
    expect(steps.map((s) => s.label)).toEqual(['Cargo handling', 'Security']);
    expect(stepQuestions(steps).map((q) => [q.question.id, q.index, q.subcategory?.name ?? null])).toEqual([
      ['q1', 1, 'Shipment acceptance'],
      ['q2', 2, 'Shipment acceptance'],
      ['q3', 3, null],
      ['q4', 4, null],
    ]);
  });

  it('applies the comment modes', () => {
    expect(answerIssues(Q1, undefined)).toEqual([{ field: 'rating', message: 'Choose a rating or NA' }]);
    expect(answerIssues(Q1, { questionId: 'q1', rating: 2, na: false, comment: '', followUp: [] })).toEqual([{ field: 'comment', message: 'A comment is required for a Fair or Poor rating' }]);
    expect(answerIssues(Q1, { questionId: 'q1', rating: 3, na: false, comment: '', followUp: [] })).toEqual([]);
    expect(answerIssues(Q3, { questionId: 'q3', rating: 5, na: false, comment: '  ', followUp: [] })).toEqual([{ field: 'comment', message: 'A comment is required for this question' }]);
    expect(answerIssues(Q2, { questionId: 'q2', rating: null, na: true, comment: '', followUp: [] })).toEqual([]);
  });

  it('sends only what the server accepts: no comment on NONE, follow-up only on Fair/Poor from the list', () => {
    expect(toAnswerInput(Q2, { questionId: 'q2', rating: 4, na: false, comment: 'ignored', followUp: ['x'] })).toEqual({ questionId: 'q2', rating: 4, na: false, comment: null, followUp: [] });
    expect(toAnswerInput(Q1, { questionId: 'q1', rating: 1, na: false, comment: ' bad ', followUp: ['Staff', 'Nope', 'Staff'] })).toEqual({ questionId: 'q1', rating: 1, na: false, comment: 'bad', followUp: ['Staff'] });
    expect(toAnswerInput(Q1, { questionId: 'q1', rating: 5, na: true, comment: '', followUp: ['Staff'] })).toEqual({ questionId: 'q1', rating: null, na: true, comment: null, followUp: [] });
  });

  it('computes readiness and the review list', () => {
    const steps = formSteps(FORM);
    const answers = answersToMap([answer('q1', { rating: 1 }), answer('q2')]);
    expect(readinessOf(stepQuestions(steps), answers)).toEqual({ answered: 2, total: 4, missing: ['q3', 'q4'], invalid: ['q1'], complete: false });
    expect(reviewItems(steps, answers).map((i) => [i.questionId, i.reason, i.stepIndex])).toEqual([
      ['q1', 'comment', 0],
      ['q3', 'missing', 1],
      ['q4', 'missing', 1],
    ]);
    expect(reviewItems(steps, answersToMap(COMPLETE))).toEqual([]);
  });

  it('IMPORT_EXPORT: every question counts twice, keyed and reviewed per direction, and sends its direction', () => {
    const steps = formSteps(FORM);
    const answers = answersToMap([...COMPLETE.map((a) => ({ ...a, direction: 'IMPORT' as const })), answer('q1', { direction: 'EXPORT', rating: 2 }), answer('q2', { direction: 'EXPORT' })]);
    expect(readinessOf(stepQuestions(steps), answers, 'IMPORT_EXPORT')).toEqual({ answered: 6, total: 8, missing: ['q3:EXPORT', 'q4:EXPORT'], invalid: ['q1:EXPORT'], complete: false });
    expect(reviewItems(steps, answers, 'IMPORT_EXPORT').map((i) => [i.questionId, i.direction, i.reason])).toEqual([
      ['q1', 'EXPORT', 'comment'],
      ['q3', 'EXPORT', 'missing'],
      ['q4', 'EXPORT', 'missing'],
    ]);
    // A SINGLE reading of the same answers finds none of them.
    expect(readinessOf(stepQuestions(steps), answers).answered).toBe(0);
    expect(toAnswerInput(Q2, { questionId: 'q2', direction: 'EXPORT', rating: 4, na: false, comment: '', followUp: [] })).toEqual({ questionId: 'q2', direction: 'EXPORT', rating: 4, na: false, comment: null, followUp: [] });
  });

  it('scores the NA-excluding mean to 1 dp', () => {
    expect(ownScore(COMPLETE)).toBe(4);
    expect(ownScore([answer('a', { rating: 5 }), answer('b', { rating: 4 }), answer('c', { rating: null, na: true }), answer('d', { rating: 3 })])).toBe(4);
    expect(ownScore([answer('a', { rating: 5 }), answer('b', { rating: 4 })])).toBe(4.5);
    expect(ownScore([])).toBeNull();
  });

  it('groups answers by category for the read-only views', () => {
    const fromForm = groupsFromForm(FORM, COMPLETE);
    expect(fromForm.map((g) => [g.name, g.items.length])).toEqual([
      ['Cargo handling', 2],
      ['Security', 2],
    ]);
    expect(fromForm[1]?.items[1]?.answer).toEqual({ rating: null, na: true, comment: null, followUp: [] });

    const detail: DetailAnswer[] = [
      { ...answer('q1', { rating: 2, comment: 'Slow', followUp: ['Queues'] }), code: 'Q1', text: 'One', category: { id: 'c1', code: 'H', name: 'Handling' }, subcategory: { id: 's', code: 'S', name: 'Acceptance' } },
      { ...answer('q3', { rating: null }), code: 'Q3', text: 'Three', category: { id: 'c2', code: 'S', name: 'Security' }, subcategory: null },
    ];
    const fromDetail = groupsFromDetail(detail);
    expect(fromDetail.map((g) => g.name)).toEqual(['Handling', 'Security']);
    expect(fromDetail[0]?.items[0]).toMatchObject({ subcategory: 'Acceptance', answer: { rating: 2, comment: 'Slow', followUp: ['Queues'] } });
    expect(fromDetail[1]?.items[0]?.answer).toBeNull();
  });

  it('needs one remark per section, whitespace not counting', () => {
    const steps = formSteps(FORM);
    expect(missingRemarks(steps, remarksToMap(REMARKS))).toEqual([]);
    const partial = remarksToMap([{ categoryId: 'c1', remark: '   ' }, { categoryId: 'c2', remark: 'Fine' }]);
    expect(missingRemarks(steps, partial)).toEqual(['c1']);
    expect(remarkReviewItems(steps, new Map())).toEqual([
      { stepId: 'c1', stepIndex: 0, stepLabel: 'Cargo handling' },
      { stepId: 'c2', stepIndex: 1, stepLabel: 'Security' },
    ]);
  });

  it('carries each section’s remark into the read-only groups', () => {
    expect(groupsFromForm(FORM, COMPLETE, 'SINGLE', REMARKS).map((g) => [g.name, g.remark])).toEqual([
      ['Cargo handling', 'Acceptance is quick; paperwork could be lighter.'],
      ['Security', 'Screening is thorough.'],
    ]);
    expect(groupsFromForm(FORM, COMPLETE).every((g) => g.remark === null)).toBe(true);
    const row = { code: 'Q1', text: 'One', subcategory: null };
    const fromDetail = groupsFromDetail(
      [
        { ...answer('q1'), ...row, category: { id: 'c1', code: 'H', name: 'Handling' } },
        { ...answer('q3'), ...row, questionId: 'q3', category: { id: 'c2', code: 'S', name: 'Security' } },
      ],
      [{ categoryId: 'c2', remark: 'Screening is thorough.' }],
    );
    expect(fromDetail.map((g) => g.remark)).toEqual([null, 'Screening is thorough.']);
  });

  it('groups import and export answers under one item per question', () => {
    const fromForm = groupsFromForm(FORM, [answer('q1', { direction: 'IMPORT', rating: 5 }), answer('q1', { direction: 'EXPORT', rating: 2, comment: 'Slow' })], 'IMPORT_EXPORT');
    expect(fromForm[0]?.items[0]).toMatchObject({ answer: null, importAnswer: { rating: 5 }, exportAnswer: { rating: 2, comment: 'Slow' } });
    expect(fromForm[0]?.items[1]).toMatchObject({ importAnswer: null, exportAnswer: null });

    const row = { code: 'Q1', text: 'One', category: { id: 'c1', code: 'H', name: 'Handling' }, subcategory: null };
    const fromDetail = groupsFromDetail([
      { ...answer('q1', { direction: 'IMPORT', rating: 4 }), ...row },
      { ...answer('q1', { direction: 'EXPORT', rating: null }), ...row },
    ]);
    expect(fromDetail[0]?.items).toHaveLength(1);
    expect(fromDetail[0]?.items[0]).toMatchObject({ answer: null, importAnswer: { rating: 4 }, exportAnswer: null });
  });
});
