import { Link } from 'react-router-dom';

import { useSession } from '@/auth/session';
import { Icon, type IconName } from '@/design/icons';
import { Button, EmptyState, PageHeader, Skeleton } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { useShell } from '@/shell/ShellContext';
import { formatInt } from '@/lib/format';

import { ActiveCycleCard } from './ActiveCycleCard';
import { NeedsAttention } from './NeedsAttention';
import styles from './overview.module.css';
import { useOverviewData } from './useOverviewData';

const QUICK_LINKS: { label: string; to: string; icon: IconName; task: string }[] = [
  { label: 'New cycle', to: '/cycles/new', icon: 'plus', task: 'cycles.manage' },
  { label: 'Operators', to: '/operators', icon: 'building', task: 'operators.view' },
  { label: 'Onboarding', to: '/onboarding', icon: 'link', task: 'onboarding.review' },
  { label: 'Surveys', to: '/surveys', icon: 'list-check', task: 'surveys.view' },
  { label: 'Market share', to: '/market-share', icon: 'pie', task: 'marketshare.view' },
  { label: 'National report', to: '/reports/national', icon: 'chart', task: 'reports.national' },
  { label: 'Notifications', to: '/notifications', icon: 'bell', task: 'notifications.view' },
];

/** Super Admin landing: active cycles with their funnel, what needs attention, quick links. */
export default function OverviewPage() {
  const { hasTask, user } = useSession();
  const { href } = useShell();
  const data = useOverviewData();
  const links = QUICK_LINKS.filter((l) => hasTask(l.task as Parameters<typeof hasTask>[0]));

  return (
    <>
      <PageHeader eyebrow="Platform" title="Overview" context={`Welcome back, ${user.name.split(' ')[0] ?? user.name}. Where every running cycle stands and what needs a decision.`} />
      <div className={styles.page}>
        <section aria-label="Active cycles">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Active cycles{data.cycles.isSuccess ? ` · ${formatInt(data.active.length)}` : ''}</h2>
            <Link to={href('/cycles')} className={styles.sectionLink}>
              All cycles
            </Link>
          </div>
          {data.cycles.isError ? (
            <QueryError error={data.cycles.error} title="Could not load cycles" onRetry={() => void data.cycles.refetch()} />
          ) : data.cycles.isPending ? (
            <div className={styles.skeletons}>
              <Skeleton height={200} radius={10} />
              <Skeleton height={200} radius={10} />
            </div>
          ) : data.active.length === 0 ? (
            <EmptyState
              icon="cycles"
              title="No active cycle"
              description="Nothing is sampling or assessing right now. Draft the next cycle so operators can start selecting their customers."
              action={
                hasTask('cycles.manage') ? (
                  <Link to={href('/cycles/new')}>
                    <Button variant="primary" tabIndex={-1}>
                      New cycle
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className={styles.cards}>
              {data.active.map((c) => (
                <ActiveCycleCard key={c.id} cycle={c} />
              ))}
            </div>
          )}
        </section>

        <section aria-label="Needs attention">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Needs attention</h2>
          </div>
          <NeedsAttention
            unlocked={data.unlocked}
            unlockedLoading={data.unlockedLoading}
            shares={data.shares}
            sharesEnabled={data.sharesEnabled}
            sharesLoading={data.sharesLoading}
            pending={data.pending}
            pendingTotal={data.pendingTotal}
            pendingEnabled={data.pendingEnabled}
            pendingLoading={data.pendingLoading}
          />
        </section>

        {links.length > 0 ? (
          <section aria-label="Quick links">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Quick links</h2>
            </div>
            <nav className={styles.links}>
              {links.map((l) => (
                <Link key={l.to} to={href(l.to)} className={styles.link}>
                  <Icon name={l.icon} size={18} />
                  {l.label}
                </Link>
              ))}
            </nav>
          </section>
        ) : null}
      </div>
    </>
  );
}
