import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { errorMessage, errorRequestId } from '@/api/client';
import { useAcoScope } from '@/api/customers';
import { useOperators } from '@/api/organisations';
import { eligibleEntries, useCurrentCycles, useEligibleCustomers, useLockSample, useSamplingState, useUnlockSample } from '@/api/sampling';
import { useSession } from '@/auth/session';
import { Banner, EmptyState, PageHeader, Select, Skeleton, type TabItem, TabPanel, Tabs, useToast } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { DEFAULT_TZ, formatDateTime } from '@/lib/format';

import { AuditTab } from './AuditTab';
import { buildRows, EligibleTable } from './EligibleTable';
import { InvitationsTab } from './InvitationsTab';
import { LockDialog, UnlockDialog } from './LockDialogs';
import { LockFooter } from './LockFooter';
import styles from './sampling.module.css';
import { SamplingHeader, SamplingHeaderSkeleton } from './SamplingHeader';
import { cycleOptions, pickCurrentCycle, windowPhase } from './samplingLabels';
import { useSelectionActions } from './useSelectionActions';

type TabId = 'selection' | 'audit' | 'invitations';

/** Operator → Sampling: pick participants for the current cycle, watch the counter, lock (REQUIREMENTS §12–14, §19). */
export default function SamplingPage() {
  const { hasTask, org } = useSession();
  const scope = useAcoScope();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<TabId>('selection');
  const [lockOpen, setLockOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  const canManage = hasTask('sampling.manage');
  const canLock = hasTask('sampling.lock');
  const canUnlock = scope.isPlatform && hasTask('sampling.unlock');

  const operators = useOperators({ pageSize: 200, status: 'ACTIVE', sort: 'name' }, scope.isPlatform);
  const current = useCurrentCycles(scope.acoId, scope.ready);
  const cycles = useMemo(() => current.data ?? [], [current.data]);
  const picked = useMemo(() => pickCurrentCycle(cycles, params.get('cycleId')), [cycles, params]);
  const cycleId = picked?.cycle.id ?? '';
  const tz = picked?.cycle.tz ?? DEFAULT_TZ;

  const state = useSamplingState(cycleId, scope.acoId, scope.ready && cycleId !== '');
  const eligible = useEligibleCustomers(scope.acoId, scope.ready && cycleId !== '');
  const lock = useLockSample();
  const unlock = useUnlockSample();

  const nameOf = useCallback((customerId: string) => eligible.data?.find((c) => c.id === customerId)?.name, [eligible.data]);
  const actions = useSelectionActions(cycleId, scope.acoId, nameOf);

  const rows = useMemo(() => {
    if (!state.data) return [];
    const entries = eligibleEntries(eligible.data ?? [], state.data.cycle.type, state.data.participant.surveyTypes);
    return buildRows(entries, state.data.selection);
  }, [state.data, eligible.data]);

  const setParam = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  const doLock = () =>
    lock.mutate(
      { cycleId, acoId: scope.acoId },
      {
        onSuccess: () => {
          setLockOpen(false);
          toast.success('Sample locked. Invitations go out when the assessment opens.');
          setTab('invitations');
        },
        onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
      },
    );
  const doUnlock = (reason: string) =>
    unlock.mutate(
      { cycleId, acoId: scope.acoId, reason },
      {
        onSuccess: () => {
          setUnlockOpen(false);
          toast.success('Sample unlocked. Pending invitations were revoked.');
          setTab('selection');
        },
        onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
      },
    );

  const data = state.data;
  const locked = data?.participant.sampling.status === 'LOCKED';
  const editable = Boolean(data?.editable) && canManage;
  const tabs: TabItem[] = [
    { id: 'selection', label: 'Selection', count: data?.selectedCount ?? 0 },
    { id: 'audit', label: 'Audit' },
    ...(locked ? [{ id: 'invitations', label: 'Invitations' }] : []),
  ];
  const activeTab: TabId = tab === 'invitations' && !locked ? 'selection' : tab;
  const phase = data ? windowPhase(data, picked) : 'open';

  return (
    <>
      <PageHeader
        eyebrow="Operator"
        title="Sampling"
        context={scope.isPlatform ? 'Each operator picks the freight forwarders and customs brokers who assess it this cycle.' : `Pick the freight forwarders and customs brokers who assess ${org.name} this cycle.`}
      />

      {scope.isPlatform || cycles.length > 1 ? (
        <div className={styles.pickers}>
          {scope.isPlatform ? (
            <Select
              label="Operator"
              wrapperClassName={styles.picker}
              options={(operators.data?.data ?? []).map((o) => ({ value: o.id, label: `${o.name} · ${o.airport.iata}` }))}
              value={scope.acoId}
              placeholder={operators.isPending ? 'Loading operators…' : 'Choose an operator'}
              disabled={operators.isPending}
              hint={operators.isError ? 'Could not load operators.' : undefined}
              onChange={(e) => {
                scope.setAcoId(e.target.value);
                setTab('selection');
              }}
            />
          ) : null}
          {cycles.length > 1 ? (
            <Select label="Cycle" wrapperClassName={styles.picker} options={cycleOptions(cycles)} value={cycleId} onChange={(e) => setParam('cycleId', e.target.value)} />
          ) : null}
        </div>
      ) : null}

      {!scope.ready ? (
        <EmptyState icon="building" title="Choose an operator" description="Sampling happens per operator. Pick one above to see its eligible customers and selection." />
      ) : current.isError ? (
        <QueryError error={current.error} title="Could not load the current cycle" onRetry={() => void current.refetch()} />
      ) : current.isPending ? (
        <div className={styles.layout}>
          <SamplingHeaderSkeleton />
          <Skeleton lines={6} />
        </div>
      ) : !picked ? (
        <EmptyState icon="cycles" title="No cycle to sample for" description="Sampling opens when ACFI publishes a cycle that includes this operator and the sampling window starts." />
      ) : state.isError ? (
        <QueryError error={state.error} title="Could not load the selection" onRetry={() => void state.refetch()} />
      ) : !data ? (
        <div className={styles.layout}>
          <SamplingHeaderSkeleton />
          <Skeleton lines={6} />
        </div>
      ) : (
        <div className={styles.layout}>
          <SamplingHeader state={data} current={picked} tz={tz} canManage={canManage} onSelectAll={actions.selectAllEligible} selectAllPending={actions.selectAllPending} />

          {locked ? (
            <Banner tone="success" icon="lock" title={`Sample locked ${data.participant.sampling.lockedAt ? `on ${formatDateTime(data.participant.sampling.lockedAt, tz)}` : ''}${data.participant.sampling.lockedBy ? ` by ${data.participant.sampling.lockedBy}` : ''}`}>
              {canUnlock ? 'The selection is read-only. Unlock it with a reason if the operator needs to change it.' : 'The selection is read-only. To change the sample, ask ACFI to unlock it.'}
            </Banner>
          ) : null}
          {!locked && data.participant.sampling.status === 'UNLOCKED' ? (
            <Banner tone="warn" icon="unlock" title={`Unlocked by ACFI${data.participant.sampling.unlockedAt ? ` on ${formatDateTime(data.participant.sampling.unlockedAt, tz)}` : ''}`}>
              {data.participant.sampling.unlockReason ? `Reason: ${data.participant.sampling.unlockReason}. ` : ''}
              Adjust the selection and lock it again.
            </Banner>
          ) : null}
          {!locked && !data.editable && phase === 'before' ? (
            <Banner tone="info" title="Sampling has not opened yet">
              The selection can be changed once the sampling window starts.
            </Banner>
          ) : null}
          {!locked && !data.editable && phase === 'after' ? (
            <Banner tone="warn" title="Sampling closed without a locked sample">
              ACFI can extend the window or unlock this participant so the selection can be completed.
            </Banner>
          ) : null}
          {eligible.isError ? <QueryError error={eligible.error} title="Could not load the customer directory" onRetry={() => void eligible.refetch()} size="sm" /> : null}

          <Tabs tabs={tabs} value={activeTab} onChange={(id) => setTab(id as TabId)} aria-label="Sampling" />

          {activeTab === 'selection' ? (
            <TabPanel tabId="selection">
              <EligibleTable key={locked ? 'locked' : 'open'} rows={rows} loading={eligible.isPending} editable={editable} surveyTypes={data.participant.surveyTypes} onChange={actions.change} tz={tz} defaultView={locked ? 'selected' : 'all'} />
            </TabPanel>
          ) : null}
          {activeTab === 'audit' ? (
            <TabPanel tabId="audit">
              <AuditTab cycleId={cycleId} acoId={scope.acoId} tz={tz} />
            </TabPanel>
          ) : null}
          {activeTab === 'invitations' ? (
            <TabPanel tabId="invitations">
              <InvitationsTab cycleId={cycleId} acoId={scope.acoId} tz={tz} canResend={hasTask('notifications.send')} canRevoke={canManage} />
            </TabPanel>
          ) : null}

          <LockFooter state={data} tz={tz} canLock={canLock} canUnlock={canUnlock} onLock={() => setLockOpen(true)} onUnlock={() => setUnlockOpen(true)} lockPending={lock.isPending} />

          <LockDialog open={lockOpen} onClose={() => (lock.isPending ? undefined : setLockOpen(false))} onConfirm={doLock} loading={lock.isPending} state={data} current={picked} tz={tz} />
          <UnlockDialog open={unlockOpen} onClose={() => setUnlockOpen(false)} onConfirm={doUnlock} loading={unlock.isPending} state={data} />
        </div>
      )}
    </>
  );
}
