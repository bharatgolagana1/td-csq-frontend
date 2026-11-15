import { Link } from 'react-router-dom';

import { readyToSendHint } from '@/api/invitations.types';
import { type OperatorReport } from '@/api/reports.types';
import { useSession } from '@/auth/session';
import { Card, Progress, Stat } from '@/design/primitives';
import { formatInt } from '@/lib/format';
import { useShell } from '@/shell/ShellContext';

import styles from './dashboard.module.css';

/** Assessor funnel: invited (e-mails sent; until the assessment opens, how many are ready to send), completed, in progress, yet to start; click-through to sampling (§7). */
export function AssessorCard({ report }: { report: OperatorReport }) {
  const { hasTask } = useSession();
  const { href } = useShell();
  const { total, completed, inProgress, yetToStart, readyToSend } = report.assessorStats;
  const pct = total > 0 ? (completed / total) * 100 : 0;
  return (
    <Card className={styles.assessors} title="Assessors" subtitle={`Invited customers in ${report.cycle.name}`}>
      <div className={styles.assessorRow}>
        <div className={styles.tiles4}>
          <Stat label="Invited" value={formatInt(total)} hint={readyToSendHint(readyToSend)} />
          <Stat label="Completed" value={formatInt(completed)} />
          <Stat label="In progress" value={formatInt(inProgress)} />
          <Stat label="Yet to start" value={formatInt(yetToStart)} />
        </div>
        <Progress value={pct} label="Completion" caption={`${formatInt(completed)} of ${formatInt(total)}`} size="sm" />
      </div>
      {hasTask('sampling.view') ? (
        <div className={styles.cardFoot}>
          <span>Reminders go to assessors who have not submitted.</span>
          <Link className={styles.link} to={href('/sampling')}>
            Open sampling →
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
