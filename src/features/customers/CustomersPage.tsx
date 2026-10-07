import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { errorMessage, errorRequestId } from '@/api/client';
import { useAcoScope, useCustomers, useSetCustomerStatus } from '@/api/customers';
import { type Customer, type CustomerStatus, type CustomerSurveyType, type CustomerType } from '@/api/customers.types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Button, EmptyState, PageHeader, Pagination, SearchInput, Select, type SortState, Tag, Toolbar, ToolbarCount, useToast } from '@/design/primitives';
import { formatInt } from '@/lib/format';

import { CustomerDetailDrawer } from './CustomerDetailDrawer';
import { CustomerFormDrawer } from './CustomerFormDrawer';
import { STATUS_FILTER_OPTIONS, SURVEY_FILTER_OPTIONS, TYPE_FILTER_OPTIONS } from './customerLabels';
import styles from './customers.module.css';
import { CustomersTable } from './CustomersTable';
import { OperatorPicker } from './OperatorPicker';

type FormState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; customer: Customer };

/** Operator → Customers: the FF / CB directory with filters, bulk actions and drawers (REQUIREMENTS §6–7). */
export default function CustomersPage() {
  const { hasTask, org } = useSession();
  const canManage = hasTask('customers.manage');
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const scope = useAcoScope();

  const [q, setQ] = useState('');
  const [type, setType] = useState<CustomerType | ''>('');
  const [surveyType, setSurveyType] = useState<CustomerSurveyType | ''>('');
  const [status, setStatus] = useState<CustomerStatus | ''>('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortState>({ id: 'name', dir: 'asc' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<FormState>({ mode: 'closed' });
  const [detail, setDetail] = useState<Customer | null>(null);
  const setStatusMutation = useSetCustomerStatus();
  const [bulkPending, setBulkPending] = useState(false);

  const filtered = Boolean(q || type || surveyType || status || tag);
  const query = useCustomers(
    {
      acoId: scope.isPlatform ? scope.acoId : undefined,
      q: q || undefined,
      type: type || undefined,
      surveyType: surveyType || undefined,
      status: status || undefined,
      tag: tag || undefined,
      page,
      pageSize,
      sort: `${sort.dir === 'desc' ? '-' : ''}${sort.id}`,
    },
    scope.ready,
  );
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const resetPage = () => {
    setPage(1);
    setSelected(new Set());
  };

  const setOne = (customer: Customer, next: 'ACTIVE' | 'INACTIVE') => {
    setStatusMutation.mutate(
      { id: customer.id, status: next },
      {
        onSuccess: () => toast.success(next === 'INACTIVE' ? `${customer.name} deactivated` : `${customer.name} reactivated`),
        onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
      },
    );
  };

  const bulk = async (next: 'ACTIVE' | 'INACTIVE') => {
    const targets = rows.filter((c) => selected.has(c.id) && c.status !== next);
    if (targets.length === 0) {
      toast.info(next === 'INACTIVE' ? 'The selected customers are already inactive' : 'The selected customers are already active');
      return;
    }
    setBulkPending(true);
    const results = await Promise.allSettled(targets.map((c) => setStatusMutation.mutateAsync({ id: c.id, status: next })));
    setBulkPending(false);
    const failed = results.filter((r) => r.status === 'rejected').length;
    const done = results.length - failed;
    const verb = next === 'INACTIVE' ? 'deactivated' : 'reactivated';
    if (failed === 0) toast.success(`${formatInt(done)} ${done === 1 ? 'customer' : 'customers'} ${verb}`);
    else toast.error(`${formatInt(done)} ${verb}, ${formatInt(failed)} failed`);
    setSelected(new Set());
  };

  const selectedCount = rows.filter((c) => selected.has(c.id)).length;

  return (
    <>
      <PageHeader
        eyebrow="Operator"
        title="Customers"
        context={scope.isPlatform ? 'Freight forwarders and customs brokers in an operator’s directory.' : `Freight forwarders and customs brokers in ${org.name}’s directory.`}
        actions={
          canManage ? (
            <>
              <Button variant="secondary" icon={<Icon name="upload" size={18} />} onClick={() => navigate({ pathname: 'import', search: location.search })} disabled={!scope.ready}>
                Import CSV
              </Button>
              <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={() => setForm({ mode: 'add' })} disabled={!scope.ready}>
                Add customer
              </Button>
            </>
          ) : undefined
        }
      />

      {scope.isPlatform ? (
        <OperatorPicker
          value={scope.acoId}
          onChange={(id) => {
            scope.setAcoId(id);
            resetPage();
          }}
        />
      ) : null}

      {!scope.ready ? (
        <EmptyState icon="building" title="Choose an operator" description="Customer directories belong to operators. Pick one above to see its freight forwarders and customs brokers." />
      ) : (
        <>
          <Toolbar end={<ToolbarCount>{query.isPending ? '…' : `${formatInt(total)} ${total === 1 ? 'customer' : 'customers'}`}</ToolbarCount>}>
            <SearchInput
              value={q}
              onChange={(v) => {
                setQ(v);
                resetPage();
              }}
              debounce={300}
              placeholder="Search name, contact or e-mail"
              label="Search customers"
            />
            <Select
              aria-label="Type"
              options={TYPE_FILTER_OPTIONS}
              value={type}
              size="sm"
              onChange={(e) => {
                setType(e.target.value as CustomerType | '');
                resetPage();
              }}
            />
            <Select
              aria-label="Survey type"
              options={SURVEY_FILTER_OPTIONS}
              value={surveyType}
              size="sm"
              onChange={(e) => {
                setSurveyType(e.target.value as CustomerSurveyType | '');
                resetPage();
              }}
            />
            <Select
              aria-label="Status"
              options={STATUS_FILTER_OPTIONS}
              value={status}
              size="sm"
              onChange={(e) => {
                setStatus(e.target.value as CustomerStatus | '');
                resetPage();
              }}
            />
            {tag ? (
              <Tag
                tone="accent"
                onRemove={() => {
                  setTag('');
                  resetPage();
                }}
                removeLabel="Clear tag filter"
              >
                Tag: {tag}
              </Tag>
            ) : null}
          </Toolbar>

          {canManage && selectedCount > 0 ? (
            <div className={styles.bulkBar} role="region" aria-label="Bulk actions">
              <span className={styles.bulkCount}>{formatInt(selectedCount)} selected</span>
              <div className={styles.bulkActions}>
                <Button size="sm" variant="secondary" onClick={() => void bulk('ACTIVE')} loading={bulkPending}>
                  Reactivate
                </Button>
                <Button size="sm" variant="danger" onClick={() => void bulk('INACTIVE')} loading={bulkPending}>
                  Deactivate
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} disabled={bulkPending}>
                  Clear
                </Button>
              </div>
            </div>
          ) : null}

          {query.isError ? (
            <EmptyState
              icon="warning"
              title="Could not load customers"
              description={
                <>
                  {errorMessage(query.error)}
                  {errorRequestId(query.error) ? (
                    <>
                      {' '}
                      · Request <code>{errorRequestId(query.error)}</code>
                    </>
                  ) : null}
                </>
              }
              action={
                <Button variant="primary" onClick={() => void query.refetch()}>
                  Try again
                </Button>
              }
            />
          ) : (
            <>
              <CustomersTable
                rows={rows}
                loading={query.isPending}
                sort={sort}
                onSortChange={setSort}
                canManage={canManage}
                selected={selected}
                onSelectedChange={setSelected}
                onOpen={setDetail}
                onEdit={(c) => {
                  setDetail(null);
                  setForm({ mode: 'edit', customer: c });
                }}
                onSetStatus={setOne}
                onTagClick={(t) => {
                  setTag(t);
                  resetPage();
                }}
                filtered={filtered}
                emptyAction={
                  canManage && !filtered ? (
                    <Button variant="primary" onClick={() => setForm({ mode: 'add' })}>
                      Add the first customer
                    </Button>
                  ) : undefined
                }
              />
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(p) => {
                  setPage(p);
                  setSelected(new Set());
                }}
                onPageSizeChange={(n) => {
                  setPageSize(n);
                  resetPage();
                }}
              />
            </>
          )}
        </>
      )}

      {form.mode !== 'closed' ? (
        <CustomerFormDrawer open onClose={() => setForm({ mode: 'closed' })} customer={form.mode === 'edit' ? form.customer : null} acoId={scope.acoId} isPlatform={scope.isPlatform} />
      ) : null}
      {detail ? (
        <CustomerDetailDrawer
          customer={rows.find((c) => c.id === detail.id) ?? detail}
          onClose={() => setDetail(null)}
          canManage={canManage}
          onEdit={(c) => {
            setDetail(null);
            setForm({ mode: 'edit', customer: c });
          }}
        />
      ) : null}
    </>
  );
}
