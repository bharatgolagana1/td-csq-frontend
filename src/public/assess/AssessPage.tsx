import { useParams } from 'react-router-dom';

import styles from '../public.module.css';

/** Placeholder for /assess/:token — replaced by the public-flow agent (landing → OTP → form → review → done). */
export default function AssessPage() {
  const { token } = useParams<{ token: string }>();
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Air Cargo Forum India · CSQ</p>
        <h1 className={styles.title}>Cargo Service Quality assessment</h1>
        <p className={styles.text}>The assessment form is being built. Your invitation link is valid; you will be able to rate your operator here shortly.</p>
        <code className={styles.token}>{token}</code>
        <p className={styles.footer}>Your responses are confidential and reported only in aggregate.</p>
      </div>
    </div>
  );
}
