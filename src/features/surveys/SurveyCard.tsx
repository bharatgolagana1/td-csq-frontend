import { Link, useNavigate } from 'react-router-dom';

import { useSurveyTree } from '@/api/surveys';
import { type SurveyListEntry, type SurveyTree, type SurveyVersion } from '@/api/surveys.types';
import { Icon } from '@/design/icons';
import { Button, Card, Pill, Skeleton } from '@/design/primitives';

import { formatZoned, pluralQuestions, STATUS_LABEL, statusPillVariant, TYPE_LABEL, versionLabel } from './surveyFormat';
import { countByHead } from './surveyRules';
import styles from './surveys.module.css';
import { useNewDraft } from './useNewDraft';

export type SurveyCardProps = { entry: SurveyListEntry; canManage: boolean };

function VersionBox({ label, version, when }: { label: string; version: SurveyVersion | null; when: string }) {
  return (
    <div className={styles.versionBox}>
      <div className={styles.versionLabel}>
        <span>{label}</span>
        {version ? (
          <Pill size="sm" variant={statusPillVariant(version.status)}>
            {STATUS_LABEL[version.status]}
          </Pill>
        ) : null}
      </div>
      {version ? (
        <div className={styles.versionMeta}>
          {versionLabel(version.version)} · {pluralQuestions(version.questionCount)}
          <br />
          {when}
        </div>
      ) : (
        <p className={styles.versionEmpty}>{label === 'Published' ? 'Nothing published yet' : 'No draft'}</p>
      )}
    </div>
  );
}

/** Active-question counts per head, side by side for the published and draft trees. */
function HeadsTable({ published, draft }: { published: SurveyTree | undefined; draft: SurveyTree | undefined }) {
  const pub = published ? countByHead(published.categories) : new Map();
  const drf = draft ? countByHead(draft.categories) : new Map();
  const codes = Array.from(new Set([...pub.keys(), ...drf.keys()]));
  if (codes.length === 0) return null;
  const cell = (map: ReturnType<typeof countByHead>, code: string, present: boolean) => (present ? (map.get(code)?.count ?? 0) : '—');
  return (
    <table className={styles.heads}>
      <caption className="visually-hidden">Questions per head</caption>
      <thead>
        <tr>
          <th scope="col" className={styles.headCode}>
            Head
          </th>
          <th scope="col">Name</th>
          <th scope="col" className={styles.count}>
            Published
          </th>
          <th scope="col" className={styles.count}>
            Draft
          </th>
        </tr>
      </thead>
      <tbody>
        {codes.map((code) => (
          <tr key={code}>
            <td className={styles.headCode}>{code}</td>
            <td>{(drf.get(code) ?? pub.get(code))?.name}</td>
            <td className={styles.count}>{cell(pub, code, Boolean(published))}</td>
            <td className={styles.count}>{cell(drf, code, Boolean(draft))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** One survey type: its published and draft versions, question counts per head, open/edit/create actions, history. */
export function SurveyCard({ entry, canManage }: SurveyCardProps) {
  const navigate = useNavigate();
  const published = entry.versions.find((v) => v.id === entry.publishedVersionId) ?? null;
  const draft = entry.versions.find((v) => v.id === entry.draftVersionId) ?? null;
  const retired = entry.versions.filter((v) => v.status === 'RETIRED');
  const publishedTree = useSurveyTree(published?.id);
  const draftTree = useSurveyTree(draft?.id);
  const newDraft = useNewDraft((id) => navigate(id));
  const treesLoading = (published && publishedTree.isPending) || (draft && draftTree.isPending);

  return (
    <Card as="article" title={TYPE_LABEL[entry.code]} subtitle={entry.name} aria-label={`${TYPE_LABEL[entry.code]} survey`}>
      <div className={styles.versions}>
        <VersionBox label="Published" version={published} when={published ? `Published ${formatZoned(published.publishedAt)}` : ''} />
        <VersionBox label="Draft" version={draft} when={draft ? `Updated ${formatZoned(draft.updatedAt)}` : ''} />
      </div>
      {treesLoading ? <Skeleton lines={4} /> : <HeadsTable published={publishedTree.data} draft={draftTree.data} />}
      <div className={styles.cardActions}>
        {published ? (
          <Button variant="secondary" icon={<Icon name="eye" size={18} />} onClick={() => navigate(published.id)}>
            Open published
          </Button>
        ) : null}
        {draft ? (
          <Button variant={canManage ? 'primary' : 'secondary'} icon={<Icon name={canManage ? 'edit' : 'eye'} size={18} />} onClick={() => navigate(draft.id)}>
            {canManage ? 'Edit draft' : 'Open draft'}
          </Button>
        ) : canManage ? (
          <Button variant={published ? 'secondary' : 'primary'} icon={<Icon name="plus" size={18} />} loading={newDraft.pending} onClick={() => newDraft.start(published?.id ?? entry.code)}>
            Create draft
          </Button>
        ) : null}
        {!published && !draft && !canManage ? <p className={styles.versionEmpty}>No version exists yet.</p> : null}
      </div>
      {retired.length > 0 ? (
        <details className={styles.history}>
          <summary>
            Earlier versions ({retired.length})
          </summary>
          <ul className={styles.historyList}>
            {retired.map((v) => (
              <li key={v.id} className={styles.historyItem}>
                <Link to={v.id}>{versionLabel(v.version)}</Link>
                <span className={styles.muted}>
                  · {pluralQuestions(v.questionCount)} · published {formatZoned(v.publishedAt)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </Card>
  );
}
