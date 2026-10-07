import { type ReactNode } from 'react';

import styles from './register.module.css';

export type RegisterFrameProps = {
  /** "Step 2 of 4" in the top bar; omitted on the state screens. */
  status?: ReactNode;
  children: ReactNode;
};

/** Public page chrome: brand bar, a centred column, the ACFI footer. No shell, no sign-in. */
export function RegisterFrame({ status, children }: RegisterFrameProps) {
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            CSQ
          </span>
          <span>CSQ</span>
          <span className={styles.brandSub}>Cargo Service Quality · ACFI</span>
        </div>
        {status ? <span className={styles.stepCount}>{status}</span> : null}
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>Air Cargo Forum India · Registration details are reviewed by ACFI before access is granted</footer>
    </div>
  );
}
