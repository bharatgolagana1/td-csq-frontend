import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { errorMessage, errorRequestId, isApiError } from '@/api/client';
import { useSaveOrder, useSurveyTree } from '@/api/surveys';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Banner, Button, PageHeader, Pill, Skeleton, Tag, useToast } from '@/design/primitives';
import { ConfirmDialog } from '@/design/primitives/ConfirmDialog/ConfirmDialog';
import { QueryError } from '@/design/primitives/QueryError/QueryError';

import { type EditorContextValue, EditorProvider } from './editorContext';
import { NodeEditor } from './NodeEditor';
import { serverIssues } from './nodeForms';
import { OrderSaveBar } from './OrderSaveBar';
import { PreviewDrawer } from './PreviewDrawer';
import { PublishDialog } from './PublishDialog';
import { describePublished, STATUS_LABEL, statusPillVariant, TYPE_LABEL, versionLabel } from './surveyFormat';
import { countActiveQuestions, countQuestions } from './surveyRules';
import styles from './surveys.module.css';
import { SurveyTree } from './SurveyTree';
import { selectionExists } from './treeFind';
import { applyOrder, buildOrderInput, changedGroups } from './treeOrder';
import { useEditorState } from './useEditorState';
import { useNewDraft } from './useNewDraft';

/* `surveys/:id` is a flat route beside `surveys` (not nested), so a relative `..`
   would resolve to the parent route; the index path comes from the URL instead,
   which also holds under the dev shell mount. */
function indexPathOf(pathname: string): string {
  return pathname.replace(/\/[^/]*$/, '') || '/';
}

function EditorSkeleton() {
  return (
    <div className={styles.editor} aria-busy="true" aria-label="Loading survey">
      <Skeleton height={520} radius={10} />
      <Skeleton height={360} radius={10} />
    </div>
  );
}

/** Surveys → one version: the tree on the left, the selected node's form on the right, publish and preview in the header. */
export default function SurveyEditorPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const indexPath = indexPathOf(useLocation().pathname);
  const crumbs = [{ label: 'Surveys', to: indexPath }];
  const toast = useToast();
  const { hasTask } = useSession();
  const canManage = hasTask('surveys.manage');
  const tree = useSurveyTree(id);
  const editor = useEditorState();
  const saveOrder = useSaveOrder();
  const newDraft = useNewDraft((draftId) => navigate(`${indexPath}/${draftId}`));
  const [publishOpen, setPublishOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const editorCol = useRef<HTMLElement>(null);

  const categories = tree.data?.categories;
  const displayed = useMemo(() => (categories ? applyOrder(categories, editor.spec) : []), [categories, editor.spec]);
  const pendingGroups = categories ? changedGroups(categories, editor.spec) : 0;

  // A selection that no longer names a node (deleted, stale deep link) is dropped.
  const { selected, clearSelection } = editor;
  useEffect(() => {
    if (categories && selected && !selectionExists(categories, selected)) clearSelection();
  }, [categories, selected, clearSelection]);

  // On one-column layouts the form sits below the tree: bring it into view when a node is picked.
  useEffect(() => {
    if (selected && window.matchMedia('(max-width: 1000px)').matches) editorCol.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selected]);

  if (tree.isPending) {
    return (
      <>
        <PageHeader eyebrow="Configuration" title="Survey" breadcrumbs={crumbs} />
        <EditorSkeleton />
      </>
    );
  }
  if (tree.isError) {
    return (
      <>
        <PageHeader eyebrow="Configuration" title="Survey" breadcrumbs={crumbs} />
        <QueryError error={tree.error} title={isApiError(tree.error, 'NOT_FOUND') ? 'Survey version not found' : 'Could not load this survey'} onRetry={() => void tree.refetch()} />
      </>
    );
  }

  const { survey, issues } = tree.data;
  const readOnly = survey.status !== 'DRAFT' || !canManage;
  const label = `${TYPE_LABEL[survey.code]} ${versionLabel(survey.version)}`;
  const active = countActiveQuestions(displayed);
  const total = countQuestions(displayed);
  const ctx: EditorContextValue = { surveyId: id, survey, categories: displayed, readOnly, selected: editor.selected, select: editor.select, setDirty: editor.setDirty, reorder: editor.reorder };

  const onSaveOrder = () => {
    saveOrder.mutate(
      { surveyId: id, ...buildOrderInput(displayed) },
      {
        onSuccess: () => {
          editor.resetOrder();
          toast.success('Order saved');
        },
        onError: (e) => toast.error(serverIssues(e)[0]?.message ?? errorMessage(e), { requestId: errorRequestId(e) }),
      },
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title={`${TYPE_LABEL[survey.code]} survey`}
        breadcrumbs={[...crumbs, { label }]}
        meta={
          <>
            <Pill variant={statusPillVariant(survey.status)}>{STATUS_LABEL[survey.status]}</Pill>
            <Tag tone="outline">
              <span className={styles.headerVersion}>{versionLabel(survey.version)}</span>
            </Tag>
          </>
        }
        context={`${survey.name} · ${describePublished(survey.publishedAt)} · ${active} of ${total} questions active`}
        actions={
          <>
            <Button variant="secondary" icon={<Icon name="eye" size={18} />} onClick={() => setPreviewOpen(true)}>
              Preview
            </Button>
            {survey.status === 'DRAFT' && canManage ? (
              <Button variant="primary" icon={<Icon name="check" size={18} />} onClick={() => setPublishOpen(true)}>
                Publish
              </Button>
            ) : null}
          </>
        }
      />

      {survey.status !== 'DRAFT' ? (
        <Banner
          tone="info"
          title={`${label} is ${STATUS_LABEL[survey.status].toLowerCase()} and read-only.`}
          action={
            canManage ? (
              <Button variant="secondary" icon={<Icon name="edit" size={18} />} loading={newDraft.pending} onClick={() => newDraft.start(survey.id)}>
                Edit as new draft
              </Button>
            ) : undefined
          }
        >
          {survey.status === 'PUBLISHED' ? 'Changes go into the next draft version; publishing that retires this one.' : 'A later version has been published since. Cycles that pinned this version still read it.'}
        </Banner>
      ) : !canManage ? (
        <Banner tone="info" title="You can view this draft but not change it.">
          Editing needs the “Manage surveys” task.
        </Banner>
      ) : null}

      <EditorProvider value={ctx}>
        <div className={styles.editor}>
          <section className={styles.col} aria-label="Survey structure">
            <div className={styles.colHead}>
              <h2 className={styles.colTitle}>Structure</h2>
              <span className={styles.colMeta}>
                {displayed.length} {displayed.length === 1 ? 'category' : 'categories'} · {total} q
              </span>
            </div>
            <div className={styles.colBody}>
              <SurveyTree />
            </div>
            {pendingGroups > 0 ? <OrderSaveBar groups={pendingGroups} saving={saveOrder.isPending} onSave={onSaveOrder} onDiscard={editor.resetOrder} /> : null}
          </section>
          <section className={styles.col} aria-label="Selected node" ref={editorCol}>
            <NodeEditor />
          </section>
        </div>
      </EditorProvider>

      <PublishDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        survey={survey}
        categories={displayed}
        serverIssues={issues}
        orderPending={pendingGroups > 0}
        onPublished={(published) => toast.success(`${TYPE_LABEL[published.code]} ${versionLabel(published.version)} published`)}
      />
      <PreviewDrawer open={previewOpen} onClose={() => setPreviewOpen(false)} surveyId={id} surveyLabel={label} />
      <ConfirmDialog
        open={editor.pending !== undefined}
        onClose={editor.keepEditing}
        onConfirm={editor.discardAndSelect}
        title="Discard unsaved changes?"
        description="The changes to this node have not been saved."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        danger
      />
    </>
  );
}
