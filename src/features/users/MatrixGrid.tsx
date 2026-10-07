import { Fragment, useMemo } from 'react';

import { type RoleMatrix, type TaskDefinition } from '@/api/types';
import { Icon } from '@/design/icons';
import { Checkbox, EmptyState, Tag } from '@/design/primitives';
import { cn } from '@/lib/cn';
import { humanise } from '@/lib/format';

import styles from './MatrixGrid.module.css';

export type MatrixGridProps = {
  tasks: TaskDefinition[];
  roles: RoleMatrix['roles'];
  isChecked: (roleId: string, task: string) => boolean;
  onToggle: (roleId: string, task: string) => void;
  readOnly?: boolean;
  search?: string;
};

/** SUPER_ADMIN is the seeded owner of every task; it stays locked. */
export function isLockedRole(role: RoleMatrix['roles'][number]): boolean {
  return role.system && role.code === 'SUPER_ADMIN';
}

export function groupByModule(tasks: TaskDefinition[]): { module: string; tasks: TaskDefinition[] }[] {
  const groups = new Map<string, TaskDefinition[]>();
  tasks.forEach((t) => {
    const list = groups.get(t.module) ?? [];
    list.push(t);
    groups.set(t.module, list);
  });
  return Array.from(groups, ([module, list]) => ({ module, tasks: list }));
}

/** Tasks grouped by module as rows; roles as columns; sticky header and first column. */
export function MatrixGrid({ tasks, roles, isChecked, onToggle, readOnly, search }: MatrixGridProps) {
  const groups = useMemo(() => groupByModule(tasks), [tasks]);

  if (tasks.length === 0) {
    return <EmptyState icon="search" size="sm" title="No tasks match" description={search ? `Nothing matches “${search}”.` : 'No tasks have been declared yet.'} />;
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className="visually-hidden">Role to task matrix</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(styles.th, styles.taskCol)}>
              Task
            </th>
            {roles.map((role) => {
              const locked = isLockedRole(role);
              return (
                <th key={role.id} scope="col" className={cn(styles.th, styles.roleCol)} title={role.description}>
                  <span className={styles.roleName}>
                    {role.name}
                    {locked ? <Icon name="lock" size={16} title="Locked: this role always holds every task" /> : null}
                  </span>
                  <span className={styles.roleMeta}>
                    <code className={styles.roleCode}>{role.code}</code>
                    <Tag tone="outline">{humanise(role.scope)}</Tag>
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.module}>
              <tr className={styles.moduleRow}>
                <th scope="rowgroup" colSpan={roles.length + 1} className={styles.moduleCell}>
                  {humanise(group.module)}
                </th>
              </tr>
              {group.tasks.map((task) => (
                <tr key={task.code} className={styles.row}>
                  <th scope="row" className={cn(styles.td, styles.taskCol)}>
                    <span className={styles.taskName}>{task.name}</span>
                    <code className={styles.taskCode}>{task.code}</code>
                  </th>
                  {roles.map((role) => {
                    const locked = isLockedRole(role);
                    const checked = locked ? true : isChecked(role.id, task.code);
                    return (
                      <td key={role.id} className={cn(styles.td, styles.cell, checked && styles.on)}>
                        <Checkbox
                          bare
                          aria-label={`${role.name}: ${task.name}`}
                          checked={checked}
                          disabled={locked || readOnly}
                          onChange={() => onToggle(role.id, task.code)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
