import { type FormEventHandler, type ReactNode } from 'react';

import { Button, Card } from '@/design/primitives';

import styles from './settings.module.css';

export type SectionCardProps = {
  id: string;
  title: string;
  subtitle?: ReactNode;
  /** Form state from `useSectionForm`; omit for read-only cards. */
  state?: { isDirty: boolean; saving: boolean; readOnly: boolean; save: FormEventHandler<HTMLFormElement>; discard: () => void };
  className?: string;
  children: ReactNode;
};

/** One settings section: a card with its own form, dirty label and save/discard footer. */
export function SectionCard({ id, title, subtitle, state, className, children }: SectionCardProps) {
  const formId = `settings-${id}`;
  const editable = state && !state.readOnly;
  return (
    <Card
      as="section"
      aria-label={title}
      title={title}
      subtitle={subtitle}
      className={className}
      footer={
        editable ? (
          <div className={styles.footer}>
            <span className={styles.dirty} data-dirty={state.isDirty || undefined} aria-live="polite">
              {state.isDirty ? 'Unsaved changes' : 'Saved'}
            </span>
            <span className={styles.footerActions}>
              <Button variant="ghost" size="sm" onClick={state.discard} disabled={!state.isDirty || state.saving}>
                Discard
              </Button>
              <Button variant="primary" size="sm" type="submit" form={formId} disabled={!state.isDirty} loading={state.saving}>
                Save
              </Button>
            </span>
          </div>
        ) : undefined
      }
    >
      {state ? (
        <form id={formId} className={styles.form} onSubmit={state.save} noValidate aria-label={title}>
          {children}
        </form>
      ) : (
        children
      )}
    </Card>
  );
}
