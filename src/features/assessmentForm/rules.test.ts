import { describe, expect, it } from 'vitest';

import { type DetailAnswer } from '@/api/assessments.types';

import { answerIssues, answersToMap, formSteps, groupsFromDetail, groupsFromForm, ownScore, readinessOf, reviewItems, stepQuestions, toAnswerInput } from './rules';
import { answer, COMPLETE, FORM, Q1, Q2, Q3 } from './testFixtures';

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
});
