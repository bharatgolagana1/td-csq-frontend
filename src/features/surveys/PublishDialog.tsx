import { useMemo, useState } from 'react';

import { errorMessage, errorRequestId, isApiError } from '@/api/client';
import { usePublishSurvey } from '@/api/surveys';
import { type Category, type Survey, type SurveyIssue } from '@/api/surveys.types';
import { Icon } from '@/design/icons';
import { Button, Dialog, KeyValue, useToast } from '@/design/primitives';

import { TYPE_LABEL } from './surveyFormat';
import { countActiveQuestions, countByHead, countQuestions, emptyGroupWarnings, mergeIssues, publishIssues } from './surveyRules';
import styles from './surveys.module.css';

export type PublishDialogProps = {
  open: boolean;
  onClose: () => void;
  survey: Survey;
  categories: Category[];
  /** `issues` from GET /surveys/:id. */
  serverIssues: SurveyIssue[];
  orderPending: boolean;
  onPublished: (published: Survey) => void;
};

const ORDER_ISSUE: SurveyIssue = { path: 'order', message: 'Save or discard the pending reorder first' };

/** PRECONDITION_FAILED from POST /publish carries `details.issues`; anything else is a toast. */
function preconditionIssues(error: unknown): SurveyIssue[] {
  if (!isApiError(error, 'PRECONDITION_FAILED')) return [];
  const details = error.details as { issues?: unknown } | undefined;
  if (!Array.isArray(details?.issues)) return [];
  return details.issues.flatMap((i: unknown) => {
    const issue = i as Partial<SurveyIssue>;
    return typeof issue.message === 'string' ? [{ path: issue.path ?? '', message: issue.message }] : [];
  });
}

function IssueList({ issues, level }: { issues: SurveyIssue[]; level: 'block' | 'warn' }) {
  return (
    <ul className={styles.issueList}>
      {issues.map((issue) => (
        <li key={`${issue.path}|${issue.message}`} className={styles.issue} data-level={level}>
          <Icon name="warning" size={16} className={styles.issueIcon} aria-hidden="true" />
          <span>
            {issue.message}
            {issue.path ? <span className={styles.issuePath}>{issue.path}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Publish confirmation: what goes out, what blocks it (client rules + server issues), what is merely odd. */
export function PublishDialog({ open, onClose, survey, categories, serverIssues, orderPending, onPublished }: PublishDialogProps) {
  const toast = useToast();
  const publish = usePublishSurvey();
  const [failed, setFailed] = useState<SurveyIssue[]>([]);

  const blocking = useMemo(() => mergeIssues(orderPending ? [ORDER_ISSUE] : [], serverIssues, publishIssues(categories), failed), [orderPending, serverIssues, categories, failed]);
  const warnings = useMemo(() => emptyGroupWarnings(categories), [categories]);
  const heads = Array.from(countByHead(categories).values());
  const active = countActiveQuestions(categories);
  const total = countQuestions(categories);

  const confirm = () => {
    publish.mutate(
      { id: survey.id },
      {
        onSuccess: (published) => {
          setFailed([]);
          onPublished(published);
          onClose();
        },
        onError: (e) => {
          const issues = preconditionIssues(e);
          if (issues.length > 0) setFailed(issues);
          else toast.error(errorMessage(e), { requestId: errorRequestId(e) });
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Publish v${survey.version}?`}
      description="Publishing is final: the version becomes read-only and the one currently published is retired."
      dismissible={!publish.isPending}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={publish.isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirm} loading={publish.isPending} disabled={blocking.length > 0} icon={<Icon name="check" size={18} />}>
            Publish
          </Button>
        </>
      }
    >
      <section className={styles.dialogSection}>
        <h3 className={styles.dialogSectionTitle}>What will be published</h3>
        <KeyValue
          columns={2}
          items={[
            { key: 'Survey', value: `${TYPE_LABEL[survey.code]} · ${survey.name}` },
            { key: 'Version', value: `v${survey.version}`, mono: true },
            { key: 'Active questions', value: `${active} of ${total}`, mono: true },
            { key: 'Per head', value: heads.length > 0 ? heads.map((h) => `${h.code} ${h.count}`).join(' · ') : '—', mono: true },
          ]}
        />
      </section>
      <section className={styles.dialogSection}>
        <h3 className={styles.dialogSectionTitle}>{blocking.length > 0 ? `Blocked by ${blocking.length} ${blocking.length === 1 ? 'issue' : 'issues'}` : 'Checks'}</h3>
        {blocking.length === 0 ? (
          <p className={styles.summaryOk}>
            <Icon name="check" size={18} aria-hidden="true" />
            <span>Ready to publish. Cycles published from now on pin v{survey.version}; cycles already published keep the version they pinned.</span>
          </p>
        ) : (
          <IssueList issues={blocking} level="block" />
        )}
      </section>
      {warnings.length > 0 ? (
        <section className={styles.dialogSection}>
          <h3 className={styles.dialogSectionTitle}>Worth a look</h3>
          <IssueList issues={warnings} level="warn" />
        </section>
      ) : null}
    </Dialog>
  );
}
