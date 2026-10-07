import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { isApiError } from '@/api/client';
import { type Operator } from '@/api/operators.types';
import { useOperator } from '@/api/organisations';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Button, Card, EmptyState, PageHeader, Pill, Skeleton, statusVariant, type TabItem, TabPanel } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { humanise } from '@/lib/format';

import { DeactivateOperatorDialog } from './DeactivateOperatorDialog';
import { OperationsTags } from './OperationsTags';
import { OperatorCustomers } from './OperatorCustomers';
import { OperatorEditDrawer } from './OperatorEditDrawer';
import { type DetailTab, isDetailTab } from './operatorLabels';
import { OperatorMembers } from './OperatorMembers';
import { OperatorOverview } from './OperatorOverview';
import styles from './operators.module.css';
import { OperatorShareHistory } from './OperatorShareHistory';

const CRUMBS = [{ label: 'Operators', to: '..' }];

function tabsFor(o: Operator | undefined, canSeeMembers: boolean): TabItem[] {
  const tabs: TabItem[] = [{ id: 'overview', label: 'Overview' }];
  if (canSeeMembers) tabs.push({ id: 'members', label: 'Members', ...(o ? { count: o.memberCount } : {}) });
  tabs.push({ id: 'shares', label: 'Market share history' });
  tabs.push({ id: 'customers', label: 'Customers', ...(o ? { count: o.customerCount } : {}) });
  return tabs;
}

/** Organisations → Operators → one operator: overview, members, market share history, customers. */
export default function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasTask } = useSession();
  const canManage = hasTask('operators.manage');
  const canSeeMembers = hasTask('users.view');
  const query = useOperator(id);
  const operator = query.data;
  const [editing, setEditing] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const requested = params.get('tab');
  const tab: DetailTab = isDetailTab(requested) && (requested !== 'members' || canSeeMembers) ? requested : 'overview';
  const setTab = (next: string) => {
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        if (next === 'overview') n.delete('tab');
        else n.set('tab', next);
        return n;
      },
      { replace: true },
    );
  };

  if (query.isError && isApiError(query.error, 'NOT_FOUND')) {
    return (
      <>
        <PageHeader eyebrow="Organisations" title="Operator" breadcrumbs={CRUMBS} />
        <EmptyState
          icon="building"
          size="lg"
          title="Operator not found"
          description="It may belong to another organisation, or the link is wrong."
          action={
            <Button variant="primary" onClick={() => navigate('..')}>
              Back to operators
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Organisations"
        title={operator?.name ?? 'Operator'}
        breadcrumbs={[...CRUMBS, { label: operator?.code ?? '…' }]}
        meta={
          operator ? (
            <>
              <Pill variant={statusVariant(operator.status)}>{humanise(operator.status)}</Pill>
              <OperationsTags operations={operator.operations} />
            </>
          ) : undefined
        }
        context={operator ? `${operator.code} · ${operator.airport.iata} ${operator.airport.name}` : undefined}
        actions={
          canManage && operator ? (
            <>
              {operator.status !== 'INACTIVE' ? (
                <Button variant="danger" icon={<Icon name="lock" size={18} />} onClick={() => setDeactivating(true)}>
                  Deactivate
                </Button>
              ) : null}
              <Button variant="primary" icon={<Icon name="edit" size={18} />} onClick={() => setEditing(true)}>
                Edit
              </Button>
            </>
          ) : undefined
        }
        tabs={{ tabs: tabsFor(operator, canSeeMembers), value: tab, onChange: setTab, 'aria-label': 'Operator sections' }}
      />

      {query.isError ? (
        <QueryError error={query.error} title="Could not load this operator" onRetry={() => void query.refetch()} />
      ) : !operator ? (
        <div className={styles.detailGrid} aria-busy="true">
          <Card title="Details">
            <Skeleton lines={5} />
          </Card>
          <Card title="Organisation contact">
            <Skeleton lines={3} />
          </Card>
        </div>
      ) : (
        <TabPanel tabId={tab} className={styles.panel}>
          {tab === 'overview' ? <OperatorOverview operator={operator} canSeeAirport={hasTask('airports.view')} /> : null}
          {tab === 'members' ? <OperatorMembers operator={operator} /> : null}
          {tab === 'shares' ? <OperatorShareHistory operator={operator} /> : null}
          {tab === 'customers' ? <OperatorCustomers operator={operator} /> : null}
        </TabPanel>
      )}

      <OperatorEditDrawer open={editing} onClose={() => setEditing(false)} operator={operator ?? null} />
      <DeactivateOperatorDialog operator={deactivating && operator ? operator : null} onClose={() => setDeactivating(false)} />
    </>
  );
}
