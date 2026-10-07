import { type ReactNode } from 'react';

import { IllustrativeTag } from '@/design/primitives/Tag/Tag';

import styles from './gallery.module.css';

export type SectionProps = { id: string; title: string; note?: ReactNode; children: ReactNode };

export function Section({ id, title, note, children }: SectionProps) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <div className={styles.sectionHead}>
        <h2 id={`${id}-title`} className={styles.sectionTitle}>
          {title}
        </h2>
        <IllustrativeTag />
      </div>
      {note ? <p className={styles.sectionNote}>{note}</p> : null}
      {children}
    </section>
  );
}

export function Sub({ children }: { children: ReactNode }) {
  return <p className={styles.sub}>{children}</p>;
}

export function Row({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
