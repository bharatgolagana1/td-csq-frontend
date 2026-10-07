import { useCallback, useMemo, useState } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';
import { useRoleMatrix, useSaveRoleMatrix } from '@/api/identity';
import { type RoleMatrix } from '@/api/types';
import { useSession } from '@/auth/session';
import { Button, EmptyState, PageHeader, SearchInput, Skeleton, Toolbar, ToolbarCount, useToast } from '@/design/primitives';

import { MatrixGrid } from './MatrixGrid';
import styles from './MatrixGrid.module.css';
import { usersTabs } from './usersTabs';

/** Edits are overrides keyed by roleId → the full task set for that role. */
type Edits = Map<string, Set<string>>;

export function serverTasks(matrix: RoleMatrix, roleId: string): Set<string> {
  return new Set(matrix.roles.find((r) => r.id === roleId)?.tasks ?? []);
}

export function countChanges(matrix: RoleMatrix, edits: Edits): number {
  let n = 0;
  edits.forEach((tasks, roleId) => {
    const base = serverTasks(matrix, roleId);
    tasks.forEach((t) => {
      if (!base.has(t)) n += 1;
    });
    base.forEach((t) => {
      if (!tasks.has(t)) n += 1;
    });
  });
  return n;
}

/** Role → Task matrix: tasks grouped by module as rows, roles as columns, whole-matrix save (§6). */
export default function RoleMatrixPage() {
  const { hasTask } = useSession();
  const canManage = hasTask('roles.manage');
  const toast = useToast();
  const query = useRoleMatrix();
  const save = useSaveRoleMatrix();
  const [edits, setEdits] = useState<Edits>(new Map());
  const [search, setSearch] = useState('');

  const matrix = query.data;
  const changes = matrix ? countChanges(matrix, edits) : 0;

  const isChecked = useCallback(
    (roleId: string, task: string) => {
      const override = edits.get(roleId);
      if (override) return override.has(task);
      return matrix ? serverTasks(matrix, roleId).has(task) : false;
    },
    [edits, matrix],
  );

  const toggle = useCallback(
    (roleId: string, task: string) => {
      if (!matrix || !canManage) return;
      setEdits((prev) => {
        const next = new Map(prev);
        const current = new Set(next.get(roleId) ?? serverTasks(matrix, roleId));
        if (current.has(task)) current.delete(task);
        else current.add(task);
        // Drop the override when it equals the server state again.
        const base = serverTasks(matrix, roleId);
        const same = current.size === base.size && Array.from(current).every((t) => base.has(t));
        if (same) next.delete(roleId);
        else next.set(roleId, current);
        return next;
      });
    },
    [matrix, canManage],
  );

  const discard = () => setEdits(new Map());

  const onSave = () => {
    if (!matrix || changes === 0) return;
    const payload = { roles: matrix.roles.map((r) => ({ roleId: r.id, tasks: Array.from(edits.get(r.id) ?? r.tasks) })) };
    save.mutate(payload, {
      onSuccess: () => {
        setEdits(new Map());
        toast.success(`Matrix saved · ${changes} ${changes === 1 ? 'change' : 'changes'}`);
      },
      onError: (e) => toast.error(`Could not save the matrix: ${errorMessage(e)}`, { requestId: errorRequestId(e) }),
    });
  };

  const filteredTasks = useMemo(() => {
    if (!matrix) return [];
    const q = search.trim().toLowerCase();
    if (!q) return matrix.tasks;
    return matrix.tasks.filter((t) => `${t.code} ${t.name} ${t.module} ${t.description ?? ''}`.toLowerCase().includes(q));
  }, [matrix, search]);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Role → Task matrix"
        context="Which tasks each role may perform. Saving the whole matrix bumps the RBAC version; sessions pick it up on their next request."
        tabs={{ tabs: usersTabs('roles', true), 'aria-label': 'Users and roles' }}
      />

      <Toolbar end={<ToolbarCount>{matrix ? `${matrix.tasks.length} tasks · ${matrix.roles.length} roles` : '…'}</ToolbarCount>}>
        <SearchInput value={search} onChange={setSearch} placeholder="Filter tasks" label="Filter tasks" />
      </Toolbar>

      {query.isPending ? (
        <Skeleton height={420} radius={10} />
      ) : query.isError || !matrix ? (
        <EmptyState
          icon="warning"
          title="Could not load the matrix"
          description={errorMessage(query.error)}
          action={
            <Button variant="primary" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <MatrixGrid tasks={filteredTasks} roles={matrix.roles} isChecked={isChecked} onToggle={toggle} readOnly={!canManage} search={search} />
      )}

      {canManage && matrix ? (
        <div className={styles.saveBar} role="region" aria-label="Unsaved changes" data-dirty={changes > 0 || undefined}>
          <span className={styles.saveCount} aria-live="polite">
            {changes === 0 ? 'No unsaved changes' : `${changes} unsaved ${changes === 1 ? 'change' : 'changes'}`}
          </span>
          <div className={styles.saveActions}>
            <Button variant="ghost" onClick={discard} disabled={changes === 0 || save.isPending}>
              Discard
            </Button>
            <Button variant="primary" onClick={onSave} disabled={changes === 0} loading={save.isPending}>
              Save matrix
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
