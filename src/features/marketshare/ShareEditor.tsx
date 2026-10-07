import { type MarketShare } from '@/api/marketshare.types';
import { type Operator } from '@/api/operators.types';
import { Button, Card, type Column, EmptyState, Input, Pill, Stat, Table, Tag } from '@/design/primitives';

import styles from './marketshare.module.css';
import { describeTotal, formatShare } from './shareMath';
import { type ShareRow, useShareEditor } from './useShareEditor';

export type ShareEditorProps = {
  share: MarketShare;
  operators: Operator[] | undefined;
  canEdit: boolean;
  saving: boolean;
  onSave: (entries: { acoId: string; sharePct: number }[]) => void;
};

/** The editable % table with the live total; Save is held until the set totals 100 ± 0.01. */
export function ShareEditor({ share, operators, canEdit, saving, onSave }: ShareEditorProps) {
  const editor = useShareEditor(share, operators);
  const editable = canEdit && !share.frozen;

  const columns: Column<ShareRow>[] = [
    { id: 'code', header: 'Code', width: 120, mono: true, hideBelow: 'sm', cell: (r) => <span className={styles.code}>{r.code}</span> },
    {
      id: 'name',
      header: 'Operator',
      cell: (r) => (
        <span className={styles.nameCell}>
          <span className={styles.nameMain}>{r.name}</span>
          {r.added ? <span className={styles.nameSub}>Not in this set yet</span> : null}
        </span>
      ),
    },
    {
      id: 'share',
      header: 'Share',
      width: 160,
      align: 'right',
      cell: (r) =>
        editable ? (
          <Input
            aria-label={`Share for ${r.name}`}
            size="sm"
            mono
            inputMode="decimal"
            suffix="%"
            value={r.input}
            placeholder="0"
            error={r.value === null ? 'Enter 0–100' : undefined}
            wrapperClassName={styles.shareInput}
            onChange={(e) => editor.setShare(r.acoId, e.target.value)}
          />
        ) : (
          <span className={styles.readPct}>{formatShare(r.value)}</span>
        ),
    },
  ];

  return (
    <div className={styles.layout}>
      <Table
        caption="Market shares"
        columns={columns}
        rows={editor.rows}
        rowKey={(r) => r.acoId}
        stickyHeader={false}
        empty={<EmptyState icon="building" title="No operators at this airport" description="Add operators to the airport first; each active operator gets a row here." />}
      />
      <Card className={styles.summary} title="Total">
        <div className={styles.totalRow}>
          <Stat label="All operators" value={formatShare(editor.total)} size="lg" />
          <Pill variant={editor.fit.ok ? 'success' : 'warn'}>{describeTotal(editor.total)}</Pill>
        </div>
        {share.frozen ? (
          <Tag>Frozen snapshot</Tag>
        ) : editable ? (
          <div className={styles.actions}>
            <Button variant="primary" full loading={saving} disabled={!editor.canSave} onClick={() => onSave(editor.entries)}>
              Save shares
            </Button>
            <Button variant="ghost" full disabled={!editor.dirty || saving} onClick={editor.reset}>
              Discard changes
            </Button>
            <p className={styles.hint}>{editor.fit.ok ? 'Saving replaces the whole set for this airport and cycle.' : 'Shares must total exactly 100 % before they can be saved.'}</p>
          </div>
        ) : (
          <p className={styles.hint}>You can view this set but not change it.</p>
        )}
      </Card>
    </div>
  );
}
