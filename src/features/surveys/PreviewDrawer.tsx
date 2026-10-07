import { useState } from 'react';

import { useSurveyPreview } from '@/api/surveys';
import { type FormQuestion, type StakeholderType, type SurveyForm } from '@/api/surveys.types';
import { Drawer, EmptyState, Skeleton, TabPanel, Tabs, Tag } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';

import { COMMENT_MODE_LABEL, pluralQuestions, STAKEHOLDER_PLURAL } from './surveyFormat';
import styles from './surveys.module.css';

export type PreviewDrawerProps = {
  open: boolean;
  onClose: () => void;
  surveyId: string;
  /** "Domestic v3" */
  surveyLabel: string;
};

function PreviewQuestion({ question, index, scale }: { question: FormQuestion; index: number; scale: SurveyForm['scale'] }) {
  return (
    <li className={styles.pq}>
      <div className={styles.pqHead}>
        <span>{index}.</span>
        <span>{question.code}</span>
      </div>
      <p className={styles.pqText}>
        {question.text}
        {question.mandatory ? (
          <span className={styles.pqReq} aria-label="required">
            {' '}
            *
          </span>
        ) : null}
      </p>
      {question.help ? <p className={styles.pqHelp}>{question.help}</p> : null}
      <div className={styles.scale} aria-hidden="true">
        {scale.map((step) => (
          <span key={step.value} className={styles.scaleOpt}>
            {step.label}
          </span>
        ))}
        <span className={styles.scaleOpt} data-na>
          NA
        </span>
      </div>
      <div className={styles.pqMeta}>
        <span>Comment: {COMMENT_MODE_LABEL[question.commentMode]}</span>
        {question.weightPct !== null ? <span>Weight {question.weightPct} %</span> : null}
      </div>
      {question.followUp ? (
        <div className={styles.pqFollow}>
          On Fair or Poor: {question.followUp.prompt}
          <div className={styles.chips}>
            {question.followUp.options.map((option) => (
              <Tag key={option}>{option}</Tag>
            ))}
          </div>
        </div>
      ) : null}
    </li>
  );
}

function PreviewList({ form }: { form: SurveyForm }) {
  let n = 0;
  const list = (questions: FormQuestion[]) => (
    <ul className={styles.pList}>
      {questions.map((q) => {
        n += 1;
        return <PreviewQuestion key={q.id} question={q} index={n} scale={form.scale} />;
      })}
    </ul>
  );
  return (
    <>
      {form.categories.map((category) => {
        const count = category.questions.length + category.subcategories.reduce((m, s) => m + s.questions.length, 0);
        return (
          <section key={category.id} className={styles.pCat} aria-label={category.name}>
            <h3 className={styles.pCatTitle}>
              {category.name}
              <span className={styles.pCatCount}>{pluralQuestions(count)}</span>
            </h3>
            {category.questions.length > 0 ? list(category.questions) : null}
            {category.subcategories.map((sub) => (
              <div key={sub.id}>
                <h4 className={styles.pSub}>{sub.name}</h4>
                {list(sub.questions)}
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}

/** GET /surveys/:id/preview?stakeholderType= — the form as one stakeholder type sees it, read-only. */
export function PreviewDrawer({ open, onClose, surveyId, surveyLabel }: PreviewDrawerProps) {
  const [type, setType] = useState<StakeholderType>('FF');
  const query = useSurveyPreview(surveyId, type, open);

  return (
    <Drawer open={open} onClose={onClose} title="Preview" description={`${surveyLabel} as an assessor sees it: active questions only, empty groups dropped.`} width={640}>
      <div className={styles.previewTop}>
        <Tabs
          tabs={[
            { id: 'FF', label: STAKEHOLDER_PLURAL.FF },
            { id: 'CB', label: STAKEHOLDER_PLURAL.CB },
          ]}
          value={type}
          onChange={(id) => setType(id === 'CB' ? 'CB' : 'FF')}
          aria-label="Stakeholder type"
          size="sm"
        />
        {query.data ? (
          <p className={styles.previewMeta}>
            {pluralQuestions(query.data.questionCount)} · scale {query.data.scale.map((s) => s.label).join(' / ')} + NA
          </p>
        ) : null}
      </div>
      <TabPanel tabId={type}>
        {query.isPending ? (
          <div className={styles.skelStack} aria-busy="true" aria-label="Loading preview">
            <Skeleton height={20} width="40%" />
            <Skeleton height={120} radius={10} />
            <Skeleton height={120} radius={10} />
            <Skeleton height={120} radius={10} />
          </div>
        ) : query.isError ? (
          <QueryError error={query.error} title="Could not load the preview" size="sm" onRetry={() => void query.refetch()} />
        ) : query.data.categories.length === 0 ? (
          <EmptyState size="sm" icon="list-check" className={styles.previewEmpty} title={`Nothing to ask ${STAKEHOLDER_PLURAL[type].toLowerCase()}`} description="No active question targets this stakeholder type." />
        ) : (
          <PreviewList form={query.data} />
        )}
      </TabPanel>
    </Drawer>
  );
}
