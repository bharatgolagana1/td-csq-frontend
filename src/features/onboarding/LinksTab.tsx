import { useState } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';
import { useDeleteOnboardingLink, useOnboardingLinks } from '@/api/onboarding';
import { type LinkOrgType, type LinkStatus, type OnboardingLink } from '@/api/onboarding.types';
import { Button, Pagination, Select, type SortState, Toolbar, ToolbarCount, useToast } from '@/design/primitives';
import { ConfirmDialog } from '@/design/primitives/ConfirmDialog/ConfirmDialog';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatInt } from '@/lib/format';

import { LinksTable } from './LinksTable';
import { LINK_STATUS_OPTIONS, ORG_TYPE_FILTER_OPTIONS } from './onboardingLabels';

export type LinksTabProps = {
  canManage: boolean;
  onCreate: () => void;
  onViewRequest: (registrationId: string) => void;
};

/** Links tab: the list with status / type filters, pagination and revocation. */
export function LinksTab({ canManage, onCreate, onViewRequest }: LinksTabProps) {
  const toast = useToast();
  const [status, setStatus] = useState<LinkStatus | ''>('');
  const [orgType, setOrgType] = useState<LinkOrgType | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortState>({ id: 'createdAt', dir: 'desc' });
  const [revoking, setRevoking] = useState<OnboardingLink | null>(null);
  const remove = useDeleteOnboardingLink();

  const query = useOnboardingLinks({
    status: status || undefined,
    orgType: orgType || undefined,
    page,
    pageSize,
    sort: `${sort.dir === 'desc' ? '-' : ''}${sort.id}`,
  });
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  const confirmRevoke = () => {
    if (!revoking) return;
    remove.mutate(revoking.id, {
      onSuccess: () => {
        toast.success('Link revoked');
        setRevoking(null);
      },
      onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
    });
  };

  return (
    <>
      <Toolbar end={<ToolbarCount>{query.isPending ? '…' : `${formatInt(total)} ${total === 1 ? 'link' : 'links'}`}</ToolbarCount>}>
        <Select
          aria-label="Link status"
          options={LINK_STATUS_OPTIONS}
          value={status}
          size="sm"
          onChange={(e) => {
            setStatus(e.target.value as LinkStatus | '');
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
        <QueryError error={query.error} title="Could not load links" onRetry={() => void query.refetch()} />
      ) : (
        <>
          <LinksTable
            rows={rows}
            loading={query.isPending}
            sort={sort}
            onSortChange={setSort}
            canManage={canManage}
            onRevoke={setRevoking}
            onViewRequest={onViewRequest}
            emptyAction={
              canManage && !status && !orgType ? (
                <Button variant="primary" onClick={onCreate}>
                  Create a link
                </Button>
              ) : undefined
            }
          />
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

      <ConfirmDialog
        open={revoking !== null}
        onClose={() => setRevoking(null)}
        onConfirm={confirmRevoke}
        danger
        loading={remove.isPending}
        title="Revoke this link?"
        description={revoking ? `Anyone holding the link for ${revoking.airport?.iata ?? 'this airport'} can no longer register with it.` : undefined}
        confirmLabel="Revoke"
      />
    </>
  );
}
