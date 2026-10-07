/* Hand-written mirrors of the surveys contract (td-csq-backend/docs/ARCHITECTURE.md
   §5 surveys/categories/subcategories/questions, §6 surveys) and of the landed
   backend schemas (src/modules/surveys/surveys.schemas.ts). */

export type SurveyType = 'DOMESTIC' | 'INTERNATIONAL';
export type SurveyStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED';
export type StakeholderType = 'FF' | 'CB';
export type CommentMode = 'OPTIONAL' | 'REQUIRED' | 'REQUIRED_ON_LOW' | 'NONE';

export const SURVEY_TYPES: readonly SurveyType[] = ['DOMESTIC', 'INTERNATIONAL'];
export const STAKEHOLDER_TYPES: readonly StakeholderType[] = ['FF', 'CB'];
export const COMMENT_MODES: readonly CommentMode[] = ['OPTIONAL', 'REQUIRED', 'REQUIRED_ON_LOW', 'NONE'];

/** Asked on a Fair or Poor rating; the assessor picks any of the options. */
export type FollowUp = { prompt: string; options: string[] };

/** One version of a survey type. PUBLISHED is immutable; publishing retires the previous one. */
export type Survey = {
  id: string;
  code: SurveyType;
  name: string;
  version: number;
  status: SurveyStatus;
  publishedAt: string | null;
  publishedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SurveyVersion = Survey & { questionCount: number };

/** GET /surveys: one entry per survey type, versions newest first. */
export type SurveyListEntry = {
  code: SurveyType;
  name: string;
  publishedVersionId: string | null;
  draftVersionId: string | null;
  versions: SurveyVersion[];
};

export type Question = {
  id: string;
  categoryId: string;
  /** Null when the question sits directly under its category. */
  subcategoryId: string | null;
  code: string;
  text: string;
  help: string | null;
  order: number;
  weightPct: number | null;
  mandatory: boolean;
  commentMode: CommentMode;
  stakeholderTypes: StakeholderType[];
  followUp: FollowUp | null;
  active: boolean;
};

export type SubcategoryNode = { id: string; categoryId: string; code: string; name: string; order: number };
export type Subcategory = SubcategoryNode & { questions: Question[] };

export type CategoryNode = { id: string; code: string; name: string; order: number; weightPct: number | null };
export type Category = CategoryNode & {
  subcategories: Subcategory[];
  /** Questions directly under the category (no subcategory). */
  questions: Question[];
};

/** What would stop a DRAFT from publishing (`path` names the level, e.g. `categories.INFRA.questions`). */
export type SurveyIssue = { path: string; message: string };

/** GET /surveys/:id */
export type SurveyTree = { survey: Survey; categories: Category[]; issues: SurveyIssue[] };

/* GET /surveys/:id/preview?stakeholderType= — the form as one assessor sees it:
   active questions only, ordered, empty groups dropped. */

export type FormQuestion = Omit<Question, 'stakeholderTypes' | 'active'>;
export type FormSubcategory = { id: string; code: string; name: string; order: number; questions: FormQuestion[] };
export type FormCategory = {
  id: string;
  code: string;
  name: string;
  order: number;
  weightPct: number | null;
  questions: FormQuestion[];
  subcategories: FormSubcategory[];
};
export type SurveyForm = {
  survey: Pick<Survey, 'id' | 'code' | 'name' | 'version' | 'status'>;
  stakeholderType: StakeholderType;
  /** The rating scale every question uses; NA is always offered alongside. */
  scale: { value: number; label: string }[];
  questionCount: number;
  categories: FormCategory[];
};

/* Requests */

export type CreateVersionInput = { name?: string };

export type CreateCategoryInput = { code: string; name: string; order?: number; weightPct?: number | null };
export type PatchCategoryInput = Partial<{ code: string; name: string; order: number; weightPct: number | null }>;

export type CreateSubcategoryInput = { categoryId: string; code: string; name: string; order?: number };
export type PatchSubcategoryInput = Partial<{ categoryId: string; code: string; name: string; order: number }>;

export type CreateQuestionInput = {
  categoryId: string;
  subcategoryId?: string | null;
  code: string;
  text: string;
  help?: string | null;
  order?: number;
  weightPct?: number | null;
  mandatory?: boolean;
  commentMode?: CommentMode;
  stakeholderTypes?: StakeholderType[];
  followUp?: FollowUp | null;
  active?: boolean;
};
export type PatchQuestionInput = Partial<{
  categoryId: string;
  subcategoryId: string | null;
  code: string;
  text: string;
  help: string | null;
  order: number;
  weightPct: number | null;
  mandatory: boolean;
  commentMode: CommentMode;
  stakeholderTypes: StakeholderType[];
  followUp: FollowUp | null;
  active: boolean;
}>;

export type OrderEntry = { id: string; order: number };
/** PUT /surveys/:id/order: nodes not listed keep their order. */
export type OrderInput = {
  categories: {
    id: string;
    order: number;
    questions?: OrderEntry[];
    subcategories?: { id: string; order: number; questions?: OrderEntry[] }[];
  }[];
};
