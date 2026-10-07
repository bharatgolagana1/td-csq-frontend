import { useState } from 'react';

import { useRegistrations } from '@/api/onboarding';
import { type LinkOrgType, type Registration, type RegistrationStatus } from '@/api/onboarding.types';
import { Pagination, SearchInput, Select, type SortState, Toolbar, ToolbarCount } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatInt } from '@/lib/format';

import { ORG_TYPE_FILTER_OPTIONS, REGISTRATION_STATUS_OPTIONS } from './onboardingLabels';
import { RegistrationDrawer } from './RegistrationDrawer';
import { RequestsTable } from './RequestsTable';

export type RequestsTabProps = {
  /** Opens this request on mount (the reviewer URL from the e-mail). */
  openId: string | null;
  onOpenChange: (id: string | null) => void;
};

/** Requests tab: the registration list with status / type filters and the review drawer. */
export function RequestsTab({ openId, onOpenChange }: RequestsTabProps) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<RegistrationStatus | ''>('');
  const [orgType, setOrgType] = useState<LinkOrgType | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortState>({ id: 'createdAt', dir: 'desc' });

  const query = useRegistrations({
    q: q || undefined,
    status: status || undefined,
    orgType: orgType || undefined,
    page,
    pageSize,
    sort: `${sort.dir === 'desc' ? '-' : ''}${sort.id}`,
  });
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const selected: Registration | undefined = rows.find((r) => r.id === openId);

  return (
    <>
      <Toolbar end={<ToolbarCount>{query.isPending ? '…' : `${formatInt(total)} ${total === 1 ? 'request' : 'requests'}`}</ToolbarCount>}>
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          debounce={300}
          placeholder="Search organisation or administrator"
          label="Search requests"
        />
        <Select
          aria-label="Request status"
          options={REGISTRATION_STATUS_OPTIONS}
          value={status}
          size="sm"
          onChange={(e) => {
            setStatus(e.target.value as RegistrationStatus | '');
            setPage(1);
          }}
        />
        <Select
          aria-label="Organisation type"
          options={ORG_TYPE_FILTER_OPTIONS}
          value={orgType}
          size="sm"
          onChange={(e) => {
            setOrgType(e.target.value as LinkOrgType | '');
            setPage(1);
          }}
        />
      </Toolbar>

      {query.isError ? (
        <QueryError error={query.error} title="Could not load requests" onRetry={() => void query.refetch()} />
      ) : (
        <>
          <RequestsTable rows={rows} loading={query.isPending} sort={sort} onSortChange={setSort} onOpen={(r) => onOpenChange(r.id)} filtered={Boolean(q || status || orgType)} />
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
        </>
      )}

      <RegistrationDrawer id={openId} placeholder={selected} onClose={() => onOpenChange(null)} />
    </>
  );
}
