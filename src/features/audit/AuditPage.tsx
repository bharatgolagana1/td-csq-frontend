import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { AUDIT_EXPORT_LIMIT, fetchAuditForExport, useAudit } from '@/api/audit';
import { AUDIT_ACTIONS, AUDIT_ENTITIES, type AuditEntry } from '@/api/audit.types';
import { errorMessage, errorRequestId } from '@/api/client';
import { Icon } from '@/design/icons';
import { Button, Input, PageHeader, Pagination, SearchInput, Select, Toolbar, ToolbarCount, useToast } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatInt, humanise } from '@/lib/format';

import styles from './audit.module.css';
import { auditCsv, auditCsvFilename, downloadText } from './auditCsv';
import { AuditDrawer } from './AuditDrawer';
import { AuditTable } from './AuditTable';
import { useAuditFilters } from './useAuditFilters';
import { useOrgNames } from './useOrgNames';

const ENTITY_OPTIONS = [{ value: '', label: 'All entities' }, ...AUDIT_ENTITIES.map((e) => ({ value: e, label: humanise(e.replace(/[._]/g, ' ')) }))];
const ACTION_OPTIONS = [{ value: '', label: 'All actions' }, ...AUDIT_ACTIONS.map((a) => ({ value: a, label: humanise(a.replace(/\./g, ' ')) }))];

/** Audit: every state change with actor, organisation, before/after; filters and a CSV export of the filtered view (§6 audit, REQUIREMENTS §26). */
export default function AuditPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const list = useAuditFilters();
  const orgs = useOrgNames();
  const query = useAudit(list.query);
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [exporting, setExporting] = useState(false);

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { rows: entries, total: all, truncated } = await fetchAuditForExport(qc, list.filterQuery);
      if (entries.length === 0) {
        toast.info('Nothing to export for these filters');
        return;
      }
      downloadText(auditCsvFilename(), auditCsv(entries, (id) => orgs.name(id)));
      if (truncated) toast.warn(`Exported the first ${formatInt(entries.length)} of ${formatInt(all)} entries`, { description: `The export stops at ${formatInt(AUDIT_EXPORT_LIMIT)} rows — narrow the filters or the date range for the rest.` });
      else toast.success(`Exported ${formatInt(entries.length)} ${entries.length === 1 ? 'entry' : 'entries'}`);
    } catch (e) {
      toast.error(`Could not export: ${errorMessage(e)}`, { requestId: errorRequestId(e) });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Audit"
        context="Every state change that matters — who did it, from which organisation, and what changed. Entries are written by the server and cannot be edited."
        actions={
          <Button variant="secondary" icon={<Icon name="download" size={18} />} onClick={() => void exportCsv()} loading={exporting} disabled={query.isPending || total === 0}>
            Export CSV
          </Button>
        }
      />

      <Toolbar end={<ToolbarCount>{query.isPending ? '…' : `${formatInt(total)} ${total === 1 ? 'entry' : 'entries'}`}</ToolbarCount>}>
        <SearchInput value={list.filters.q} onChange={(v) => list.set('q', v)} debounce={300} placeholder="Search action, entity, id or actor" label="Search audit log" />
        <Select aria-label="Entity" size="sm" options={ENTITY_OPTIONS} value={list.filters.entity} onChange={(e) => list.set('entity', e.target.value)} />
        <Select aria-label="Action" size="sm" options={ACTION_OPTIONS} value={list.filters.action} onChange={(e) => list.set('action', e.target.value)} />
        {orgs.canFilter ? <Select aria-label="Organisation" size="sm" options={[{ value: '', label: 'All organisations' }, ...orgs.options]} value={list.filters.orgId} onChange={(e) => list.set('orgId', e.target.value)} /> : null}
        <SearchInput value={list.filters.actor} onChange={(v) => list.set('actor', v)} debounce={300} size="sm" placeholder="Actor e-mail or id" label="Actor" className={styles.actorFilter} />
        <span className={styles.range} role="group" aria-label="Date range">
          <Input type="date" size="sm" aria-label="From date" value={list.filters.from} max={list.filters.to || undefined} onChange={(e) => list.set('from', e.target.value)} wrapperClassName={styles.dateField} />
          <span className={styles.rangeSep} aria-hidden="true">
            –
          </span>
          <Input type="date" size="sm" aria-label="To date" value={list.filters.to} min={list.filters.from || undefined} onChange={(e) => list.set('to', e.target.value)} wrapperClassName={styles.dateField} />
        </span>
        {list.hasFilters ? (
          <Button variant="ghost" size="sm" onClick={list.reset}>
            Clear filters
          </Button>
        ) : null}
      </Toolbar>

      {query.isError ? (
        <QueryError error={query.error} title="Could not load the audit log" onRetry={() => void query.refetch()} />
      ) : (
        <>
          <AuditTable
            rows={rows}
            loading={query.isPending}
            sort={list.sort}
            onSortChange={list.setSort}
            onOpen={setSelected}
            orgName={orgs.name}
            emptyTitle={list.hasFilters ? 'No audit entries match' : 'No audit entries yet'}
            emptyDescription={list.hasFilters ? 'Try another entity, action, organisation, actor or date range.' : 'Entries appear as soon as something changes — a registration, a lock, a publish, a setting.'}
            emptyAction={
              list.hasFilters ? (
                <Button variant="primary" onClick={list.reset}>
                  Clear filters
                </Button>
              ) : (
                <Button variant="primary" onClick={() => void query.refetch()}>
                  Refresh
                </Button>
              )
            }
          />
          <Pagination page={list.page} pageSize={list.pageSize} total={total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} />
        </>
      )}

      <AuditDrawer entry={selected} open={selected !== null} onClose={() => setSelected(null)} orgName={orgs.name} />
    </>
  );
}
