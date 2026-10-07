import { type Category, type Question, type Survey, type SurveyForm, type SurveyListEntry, type SurveyTree } from '@/api/surveys.types';

/* Test data shaped like the seed: DOMESTIC with INFRA (direct questions) and
   SEC (one subcategory). Small enough to assert on, real enough to exercise
   every tree level. */

export function question(partial: Partial<Question> & Pick<Question, 'id' | 'categoryId' | 'code' | 'text' | 'order'>): Question {
  return {
    subcategoryId: null,
    help: null,
    weightPct: null,
    mandatory: true,
    commentMode: 'OPTIONAL',
    stakeholderTypes: ['FF', 'CB'],
    followUp: null,
    active: true,
    ...partial,
  };
}

export function categories(): Category[] {
  return [
    {
      id: 'c1',
      code: 'INFRA',
      name: 'Infrastructure and facilities',
      order: 1,
      weightPct: null,
      subcategories: [],
      questions: [
        question({ id: 'q1', categoryId: 'c1', code: 'ACFI.INFRA.CARGO_STORAGE_CAPACITY', text: 'Availability of adequate cargo infrastructure', order: 1, help: 'Storage areas and warehouses.' }),
        question({ id: 'q2', categoryId: 'c1', code: 'ACFI.INFRA.USER_AMENITIES', text: 'User amenities at the terminal', order: 2, stakeholderTypes: ['FF'] }),
      ],
    },
    {
      id: 'c2',
      code: 'SEC',
      name: 'Security and safety',
      order: 2,
      weightPct: null,
      questions: [],
      subcategories: [
        {
          id: 'sub1',
          categoryId: 'c2',
          code: 'SCREEN',
          name: 'Screening',
          order: 1,
          questions: [
            question({ id: 'q3', categoryId: 'c2', subcategoryId: 'sub1', code: 'ACFI.SEC.SCREENING_TIME', text: 'Time taken for security screening', order: 1, commentMode: 'REQUIRED_ON_LOW', followUp: { prompt: 'What slowed it down?', options: ['Queue', 'Equipment'] } }),
            question({ id: 'q4', categoryId: 'c2', subcategoryId: 'sub1', code: 'ACFI.SEC.MANPOWER', text: 'Security manpower on duty', order: 2, active: false }),
          ],
        },
      ],
    },
  ];
}

export const DRAFT: Survey = {
  id: 's3',
  code: 'DOMESTIC',
  name: 'Domestic Cargo Service Quality Survey',
  version: 3,
  status: 'DRAFT',
  publishedAt: null,
  publishedBy: null,
  createdAt: '2026-10-01T06:00:00.000Z',
  updatedAt: '2026-10-05T09:30:00.000Z',
};

export const PUBLISHED: Survey = {
  ...DRAFT,
  id: 's2',
  version: 2,
  status: 'PUBLISHED',
  publishedAt: '2026-10-02T09:00:00.000Z',
  publishedBy: 'u1',
};

export function draftTree(over: Partial<SurveyTree> = {}): SurveyTree {
  return { survey: DRAFT, categories: categories(), issues: [], ...over };
}

export function publishedTree(): SurveyTree {
  return { survey: PUBLISHED, categories: categories(), issues: [] };
}

export function surveyList(): SurveyListEntry[] {
  return [
    {
      code: 'DOMESTIC',
      name: DRAFT.name,
      publishedVersionId: 's2',
      draftVersionId: 's3',
      versions: [
        { ...DRAFT, questionCount: 4 },
        { ...PUBLISHED, questionCount: 23 },
        { ...PUBLISHED, id: 's1', version: 1, status: 'RETIRED', publishedAt: '2026-03-01T09:00:00.000Z', questionCount: 21 },
      ],
    },
    { code: 'INTERNATIONAL', name: 'International Cargo Service Quality Survey', publishedVersionId: null, draftVersionId: null, versions: [] },
  ];
}

export function previewForm(): SurveyForm {
  const cats = categories();
  return {
    survey: { id: DRAFT.id, code: DRAFT.code, name: DRAFT.name, version: DRAFT.version, status: DRAFT.status },
    stakeholderType: 'FF',
    scale: [
      { value: 1, label: 'Poor' },
      { value: 2, label: 'Fair' },
      { value: 3, label: 'Good' },
      { value: 4, label: 'Very Good' },
      { value: 5, label: 'Excellent' },
    ],
    questionCount: 3,
    categories: [
      { id: 'c1', code: 'INFRA', name: 'Infrastructure and facilities', order: 1, weightPct: null, questions: cats[0]?.questions ?? [], subcategories: [] },
      { id: 'c2', code: 'SEC', name: 'Security and safety', order: 2, weightPct: null, questions: [], subcategories: [{ id: 'sub1', code: 'SCREEN', name: 'Screening', order: 1, questions: (cats[1]?.subcategories[0]?.questions ?? []).filter((q) => q.active) }] },
    ],
  };
}
