import { type Answer, type AssessmentForm, type FormQuestion } from '@/api/assessments.types';

/* Test-only: a small two-category form exercising every comment mode and a follow-up. */

function q(id: string, overrides: Partial<FormQuestion> = {}): FormQuestion {
  return {
    id,
    code: id.toUpperCase(),
    text: `Question ${id}`,
    help: null,
    order: 1,
    mandatory: true,
    commentMode: 'OPTIONAL',
    followUp: null,
    ...overrides,
  };
}

export const Q1 = q('q1', { text: 'How would you rate shipment acceptance?', help: 'Think of the last three months.', commentMode: 'REQUIRED_ON_LOW', followUp: { prompt: 'What went wrong?', options: ['Queues', 'Paperwork', 'Staff'] } });
export const Q2 = q('q2', { text: 'How would you rate documentation handling?', commentMode: 'NONE', order: 2 });
export const Q3 = q('q3', { text: 'How would you rate security screening?', commentMode: 'REQUIRED' });
export const Q4 = q('q4', { text: 'How would you rate the overall experience?', commentMode: 'OPTIONAL' });

export const FORM: AssessmentForm = {
  survey: { id: 's1', code: 'DOMESTIC', name: 'Domestic survey', version: 3 },
  categories: [
    {
      id: 'c1',
      code: 'HANDLING',
      name: 'Cargo handling',
      order: 1,
      weightPct: null,
      subcategories: [{ id: 'sc1', code: 'ACCEPT', name: 'Shipment acceptance', order: 1, questions: [Q1, Q2] }],
      questions: [],
    },
    {
      id: 'c2',
      code: 'SECURITY',
      name: 'Security',
      order: 2,
      weightPct: null,
      subcategories: [],
      questions: [Q3, Q4],
    },
  ],
};

export function answer(questionId: string, overrides: Partial<Answer> = {}): Answer {
  return { questionId, rating: 4, na: false, comment: null, followUp: [], ...overrides };
}

/** Every question answered and valid. */
export const COMPLETE: Answer[] = [answer('q1'), answer('q2'), answer('q3', { comment: 'Fine' }), answer('q4', { na: true, rating: null })];
