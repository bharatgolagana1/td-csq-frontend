import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { errorMessage, errorRequestId } from '@/api/client';
import { useCycle, usePublishCycle, useSendReminders } from '@/api/cycles';
import { type CycleDetail } from '@/api/cycles.types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Button, Card, KeyValue, type KeyValueItem, PageHeader, Pill, Skeleton, type TabItem, TabPanel, Tabs, statusVariant, useToast } from '@/design/primitives';
import { ConfirmDialog } from '@/design/primitives/ConfirmDialog/ConfirmDialog';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { describeTimeZone, formatCountdown, formatDateTime, formatInt } from '@/lib/format';
import { useShell } from '@/shell/ShellContext';

import { AuditTab } from './AuditTab';
import { allowedTransitions, CYCLE_STATUS_LABELS, CYCLE_TYPE_LABELS, DEADLINE_LABELS, formatWindowLong, nextCycleDeadline, SAMPLING_PHASE, TYPE_PILL } from './cycleLabels';
import styles from './cycles.module.css';
import { MonitoringTab } from './MonitoringTab';
import { NotificationsTab } from './NotificationsTab';
import { ParticipantsTab } from './ParticipantsTab';
import { PublishDialog } from './PublishDialog';
import { type PublishProblem, publishProblems } from './publishProblems';
import { TransitionDialog } from './TransitionDialog';

type TabId = 'participants' | 'monitoring' | 'notifications' | 'audit';

function Summary({ cycle }: { cycle: CycleDetail }) {
  const deadline = nextCycleDeadline(cycle);
  const items: KeyValueItem[] = [
    { key: 'Sampling window', value: formatWindowLong(cycle.sampling, cycle.tz), mono: true },
    { key: 'Assessment window', value: formatWindowLong(cycle.assessment, cycle.tz), mono: true },
    { key: 'Minimum sample', value: `${formatInt(cycle.minSampleSize)} per operator`, mono: true },
    {
      key: 'Reminders',
      value: `Sampling ${formatInt(cycle.reminders.sampling.count)} × every ${formatInt(cycle.reminders.sampling.everyDays)} d · Assessment ${formatInt(cycle.reminders.assessment.count)} × every ${formatInt(cycle.reminders.assessment.everyDays)} d`,
      mono: true,
    },
    { key: 'Participants', value: `${formatInt(cycle.participants.airports)} airports · ${formatInt(cycle.participants.operators)} operators`, mono: true },
    {
      key: 'Survey versions',
      value: cycle.surveyVersions.DOMESTIC || cycle.surveyVersions.INTERNATIONAL ? [cycle.surveyVersions.DOMESTIC && 'Domestic pinned', cycle.surveyVersions.INTERNATIONAL && 'International pinned'].filter(Boolean).join(' · ') : 'Pinned at publish',
    },
    { key: 'Market shares', value: cycle.marketShareFrozen ? 'Snapshot frozen for this cycle' : 'Not snapshotted yet' },
    { key: 'Published', value: cycle.publishedAt ? formatDateTime(cycle.publishedAt, cycle.tz) : '—', mono: true },
  ];
  return (
    <Card as="section" aria-label="Cycle summary" title={deadline ? `${DEADLINE_LABELS[deadline.kind]} in ${formatCountdown(deadline.at)}` : CYCLE_STATUS_LABELS[cycle.status]} subtitle={deadline ? `${formatDateTime(deadline.at, cycle.tz)} · ${describeTimeZone(cycle.tz)}` : undefined}>
      <KeyValue items={items} columns={2} />
    </Card>
  );
}

/** /cycles/:id — header with status, windows and actions; participants · monitoring · notifications · audit. */
export default function CycleDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { href } = useShell();
  const toast = useToast();
  const { hasTask } = useSession();
  const [params, setParams] = useSearchParams();
  const query = useCycle(id);
  const publish = usePublishCycle();
  const reminders = useSendReminders();
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [problems, setProblems] = useState<PublishProblem[]>([]);
  const [remindOpen, setRemindOpen] = useState(false);

  const crumbs = [{ label: 'Cycles', to: href('/cycles') }, { label: query.data?.code ?? 'Cycle' }];

  if (query.isPending) {
    return (
      <>
        <PageHeader eyebrow="Cycles" title="Cycle" breadcrumbs={crumbs} />
        <div className={styles.skeletonStack}>
          <Skeleton height={160} radius={10} />
          <Skeleton height={44} />
          <Skeleton height={240} radius={10} />
        </div>
      </>
    );
  }
  if (query.isError) {
    return (
      <>
        <PageHeader eyebrow="Cycles" title="Cycle" breadcrumbs={crumbs} />
        <QueryError error={query.error} title="Could not load the cycle" onRetry={() => void query.refetch()} />
      </>
    );
  }

  const cycle = query.data;
  const tabs: TabItem[] = [{ id: 'participants', label: 'Participants', count: cycle.status === 'DRAFT' ? undefined : cycle.participantList.length }];
  if (hasTask('monitoring.view')) tabs.push({ id: 'monitoring', label: 'Monitoring' });
  if (hasTask('notifications.view')) tabs.push({ id: 'notifications', label: 'Notifications' });
  if (hasTask('audit.view')) tabs.push({ id: 'audit', label: 'Audit' });
  const requested = params.get('tab') as TabId | null;
  const tab: TabId = requested && tabs.some((t) => t.id === requested) ? requested : 'participants';

  const canEdit = cycle.status === 'DRAFT' && hasTask('cycles.manage');
  const canPublish = cycle.status === 'DRAFT' && hasTask('cycles.publish');
  const canOperate = hasTask('cycles.operate');
  const transitions = allowedTransitions(cycle.status);
  const canRemind = canOperate && SAMPLING_PHASE.includes(cycle.status) && cycle.status !== 'SAMPLING_CLOSED';

  const confirmPublish = () => {
    publish.mutate(cycle.id, {
      onSuccess: (data) => {
        toast.success(`${data.code} published`);
        setPublishOpen(false);
      },
      onError: (e) => {
        const list = publishProblems(e);
        if (list.length > 0) setProblems(list);
        else {
          setPublishOpen(false);
          toast.error(errorMessage(e), { requestId: errorRequestId(e) });
        }
      },
    });
  };

  const sendReminders = () => {
    reminders.mutate(
      { id: cycle.id, kind: 'SAMPLING' },
      {
        onSuccess: (run) => {
          toast.success(run.sent === 0 ? 'Nobody to remind: every operator has locked' : `Sent ${formatInt(run.sent)} reminders to ${formatInt(run.recipients.length)} operators`);
          setRemindOpen(false);
        },
        onError: (e) => {
          toast.error(errorMessage(e), { requestId: errorRequestId(e) });
          setRemindOpen(false);
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Cycles"
        title={cycle.name}
        breadcrumbs={crumbs}
        meta={
          <span className={styles.pills}>
            <span className={styles.rowCode}>{cycle.code}</span>
            <Pill variant={TYPE_PILL[cycle.type]}>{CYCLE_TYPE_LABELS[cycle.type]}</Pill>
            <Pill variant={statusVariant(cycle.status)} dot>
              {CYCLE_STATUS_LABELS[cycle.status]}
            </Pill>
          </span>
        }
        context={`${formatInt(cycle.participants.airports)} airports · ${formatInt(cycle.participants.operators)} operators · ${describeTimeZone(cycle.tz)}`}
        actions={
          <span className={styles.headerActions}>
            {canEdit ? (
              <Button variant="secondary" icon={<Icon name="edit" size={18} />} onClick={() => navigate('edit')}>
                Edit draft
              </Button>
            ) : null}
            {canPublish ? (
              <Button
                variant="primary"
                icon={<Icon name="check" size={18} />}
                onClick={() => {
                  setProblems([]);
                  setPublishOpen(true);
                }}
              >
                Publish…
              </Button>
            ) : null}
            {canOperate && transitions.length > 0 ? (
              <Button variant="secondary" icon={<Icon name="cycles" size={18} />} onClick={() => setTransitionOpen(true)}>
                Transition…
              </Button>
            ) : null}
            {canRemind ? (
              <Button variant="secondary" icon={<Icon name="bell" size={18} />} onClick={() => setRemindOpen(true)}>
                Send sampling reminders
              </Button>
            ) : null}
          </span>
        }
      />

      <div className={styles.detail}>
        <Summary cycle={cycle} />
        <Tabs tabs={tabs} value={tab} onChange={(next) => setParams({ tab: next }, { replace: true })} aria-label="Cycle sections" />
        <TabPanel tabId={tab}>
          {tab === 'participants' ? <ParticipantsTab cycle={cycle} /> : null}
          {tab === 'monitoring' ? <MonitoringTab cycle={cycle} /> : null}
          {tab === 'notifications' ? <NotificationsTab cycleId={cycle.id} tz={cycle.tz} /> : null}
          {tab === 'audit' ? <AuditTab cycleId={cycle.id} tz={cycle.tz} /> : null}
        </TabPanel>
      </div>

      <TransitionDialog open={transitionOpen} onClose={() => setTransitionOpen(false)} cycle={cycle} />
      <PublishDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onConfirm={confirmPublish}
        loading={publish.isPending}
        code={cycle.code}
        name={cycle.name}
        airports={cycle.participants.airports}
        operators={cycle.participants.operators}
        problems={problems}
        onFixStep={() => navigate('edit')}
      />
      <ConfirmDialog
        open={remindOpen}
        onClose={() => setRemindOpen(false)}
        onConfirm={sendReminders}
        loading={reminders.isPending}
        title="Send sampling reminders now?"
        description="Every operator that has not locked its sample gets the reminder e-mail (“Sampling closes in N days. Required: X. Selected: Y.”). Scheduled reminders continue as configured."
        confirmLabel="Send reminders"
      />
    </>
  );
}
