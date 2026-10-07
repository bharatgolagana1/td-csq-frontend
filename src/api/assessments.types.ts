/* Hand-written mirrors of the assessments contract
   (td-csq-backend/docs/ARCHITECTURE.md §5 `assessments`, `questions`; §6 "assessments"
   and the form/draft/answers/readiness/submit calls of the public participant flow;
   src/modules/assessments/assessments.schemas.ts). Shared by the operator's
   self-assessment, the history grid and the public assess flow. */

export type SurveyType = 'DOMESTIC' | 'INTERNATIONAL';
export type AssessmentKind = 'CUSTOMER' | 'SELF';
export type AssessmentStatus = 'DRAFT' | 'SUBMITTED';
export type CustomerType = 'FF' | 'CB';

/** Poor = 1 … Excellent = 5. */
export type Rating = 1 | 2 | 3 | 4 | 5;

export type CommentMode = 'OPTIONAL' | 'REQUIRED' | 'REQUIRED_ON_LOW' | 'NONE';

export type Progress = { answered: number; total: number; pct: number };

/** A saved answer as the API returns it. */
export type Answer = {
  questionId: string;
  rating: Rating | null;
  na: boolean;
  comment: string | null;
  followUp: string[];
};

/** One entry of a merge `PATCH …/answers`; it replaces the stored answer for its question. */
export type AnswerInput = {
  questionId: string;
  rating?: Rating | null;
  na?: boolean;
  comment?: string | null;
  followUp?: string[];
};

export type FormFollowUp = { prompt: string; options: string[] };

export type FormQuestion = {
  id: string;
  code: string;
  text: string;
  help: string | null;
  order: number;
  mandatory: boolean;
  commentMode: CommentMode;
  /** Asked on Fair / Poor. */
  followUp: FormFollowUp | null;
};

export type FormSubcategory = {
  id: string;
  code: string;
  name: string;
  order: number;
  questions: FormQuestion[];
};

export type FormCategory = {
  id: string;
  code: string;
  name: string;
  order: number;
  weightPct: number | null;
  subcategories: FormSubcategory[];
  /** Questions directly under the category (no subcategory). */
  questions: FormQuestion[];
};

export type FormSurvey = { id: string; code: SurveyType; name: string; version: number };

/** Exactly what the form renders: categories → subcategories → questions. */
export type AssessmentForm = { survey: FormSurvey; categories: FormCategory[] };

/** What every assessment path returns about an assessment (no answers, no identity). */
export type AssessmentSummary = {
  id: string;
  cycleId: string;
  acoId: string;
  airportId: string;
  surveyId: string;
  surveyType: SurveyType;
  kind: AssessmentKind;
  customerType: CustomerType | null;
  invitationId: string | null;
  userId: string | null;
  status: AssessmentStatus;
  progress: Progress;
  startedAt: string;
  lastSavedAt: string | null;
  submittedAt: string | null;
};

/** `GET …/form` (public flow). */
export type AssessmentFormResponse = AssessmentForm & { assessment: AssessmentSummary; progress: Progress };

/** `GET …/draft` (public flow). */
export type Draft = {
  id: string;
  status: AssessmentStatus;
  answers: Answer[];
  progress: Progress;
  lastSavedAt: string | null;
  submittedAt: string | null;
};

export type PatchAnswersInput = { answers: AnswerInput[] };

/** `PATCH …/answers` → progress plus the save instant. */
export type PatchAnswersResult = Progress & { lastSavedAt: string | null };

/** `GET …/readiness`. */
export type Readiness = { answered: number; total: number; missing: string[]; complete: boolean };

/** `GET /assessments/self/:cycleId/:surveyType`: the form and the saved answers in one payload. */
export type SelfAssessment = AssessmentFormResponse & { answers: Answer[] };

export type AssessorView = { name: string | null; email: string | null; revealed: boolean };

/** `GET /assessments` rows. */
export type HistoryRow = {
  id: string;
  cycle: { id: string; code: string; name: string };
  operator: { id: string; code: string; name: string };
  kind: AssessmentKind;
  surveyType: SurveyType;
  customerType: CustomerType | null;
  customerId: string | null;
  assessorName: string | null;
  assessorEmailMasked: string | null;
  assessor: AssessorView;
  status: AssessmentStatus;
  progress: Progress;
  startedAt: string;
  submittedAt: string | null;
  /** The assessment's own NA-excluding mean rating, 1 dp; null until something is rated. */
  score: number | null;
};

export type DetailAnswer = Answer & {
  code: string;
  text: string;
  category: { id: string; code: string; name: string };
  subcategory: { id: string; code: string; name: string } | null;
};

/** `GET /assessments/:id`: the read-only return. */
export type AssessmentDetail = HistoryRow & { survey: FormSurvey; answers: DetailAnswer[] };

export type AssessmentListQuery = {
  page?: number;
  pageSize?: number;
  sort?: string;
  q?: string;
  cycleId?: string;
  acoId?: string;
  kind?: AssessmentKind;
  status?: AssessmentStatus;
  customerType?: CustomerType;
  surveyType?: SurveyType;
};

export type AssessmentExportQuery = { cycleId: string; acoId?: string; kind?: AssessmentKind; status?: AssessmentStatus };

/* The self-assessment page reads the current cycle through `useCurrentCycle` in
   api/cycles (the cycles module owns `GET /cycles/current` and its types). */
