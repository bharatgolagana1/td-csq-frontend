import { useParams } from 'react-router-dom';

import styles from '../public.module.css';

/** Placeholder for /register/:token — replaced by the public-flow agent (onboarding form). */
export default function RegisterPage() {
  const { token } = useParams<{ token: string }>();
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Air Cargo Forum India · CSQ</p>
        <h1 className={styles.title}>Register your organisation</h1>
        <p className={styles.text}>The registration form is being built. Your onboarding link is valid; come back shortly.</p>
        <code className={styles.token}>{token}</code>
        <p className={styles.footer}>Links expire 14 days after they are issued.</p>
      </div>
    </div>
  );
}
