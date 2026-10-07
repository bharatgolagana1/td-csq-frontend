import { useEffect, useState } from 'react';

import { useImportAirports } from '@/api/airports';
import { type AirportImportError, type AirportImportResult } from '@/api/airports.types';
import { errorMessage, errorRequestId } from '@/api/client';
import { Button, type Column, Drawer, FileDrop, Pill, type Step, Stepper, Table, useToast } from '@/design/primitives';
import { cn } from '@/lib/cn';
import { formatInt } from '@/lib/format';

import { type AirportCsvRow, CSV_COLUMNS, isCsvFile, parseAirportsCsv, type ParsedAirportsCsv, saveTextFile, TEMPLATE_CSV, TEMPLATE_FILE_NAME } from './airportCsv';
import styles from './airports.module.css';

const STEPS: Step[] = [
  { id: 'file', label: 'Choose file', description: 'CSV with the template columns' },
  { id: 'preview', label: 'Preview', description: 'Rows that will be imported' },
  { id: 'done', label: 'Result', description: 'Inserted, updated, rejected' },
];

const PREVIEW_LIMIT = 50;

const ERROR_COLUMNS: Column<AirportImportError>[] = [
  { id: 'row', header: 'Row', width: 72, mono: true, align: 'right', cell: (e) => formatInt(e.row) },
  { id: 'field', header: 'Field', width: 110, mono: true, cell: (e) => e.field },
  { id: 'message', header: 'Problem', cell: (e) => e.message },
];

const ROW_COLUMNS: Column<AirportCsvRow>[] = [
  { id: 'iata', header: 'IATA', width: 72, mono: true, cell: (r) => r.iata },
  { id: 'name', header: 'Airport', cell: (r) => r.name },
  { id: 'city', header: 'City', hideBelow: 'sm', cell: (r) => r.city },
  { id: 'region', header: 'Region', width: 110, hideBelow: 'md', cell: (r) => r.region },
  { id: 'active', header: 'Active', width: 90, cell: (r) => <Pill variant={r.active ? 'success' : 'neutral'} size="sm">{r.active ? 'Yes' : 'No'}</Pill> },
];

function Summary({ items }: { items: { label: string; value: number; bad?: boolean }[] }) {
  return (
    <div className={styles.summary}>
      {items.map((it) => (
        <div key={it.label} className={cn(styles.summaryItem, it.bad && it.value > 0 && styles.summaryBad)}>
          <span className={styles.summaryLabel}>{it.label}</span>
          <span className={styles.summaryValue}>{formatInt(it.value)}</span>
        </div>
      ))}
    </div>
  );
}

function ErrorsTable({ errors }: { errors: AirportImportError[] }) {
  if (errors.length === 0) return null;
  return (
    <section>
      <h3 className={styles.sectionTitle}>Problems ({formatInt(errors.length)})</h3>
      <Table caption="Import problems" columns={ERROR_COLUMNS} rows={errors.slice(0, PREVIEW_LIMIT)} rowKey={(e) => `${e.row}-${e.field}-${e.message}`} dense stickyHeader={false} />
      {errors.length > PREVIEW_LIMIT ? <p className={styles.more}>Showing the first {PREVIEW_LIMIT} of {formatInt(errors.length)} problems.</p> : null}
    </section>
  );
}

export type AirportImportDrawerProps = { open: boolean; onClose: () => void };

/** Drop → validate preview → commit (`POST /airports/import`, text/csv body). Existing IATA codes are updated. */
export function AirportImportDrawer({ open, onClose }: AirportImportDrawerProps) {
  const toast = useToast();
  const importCsv = useImportAirports();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedAirportsCsv | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<AirportImportResult | null>(null);

  const step = result ? 2 : parsed ? 1 : 0;

  useEffect(() => {
    if (!open) {
      setFile(null);
      setText('');
      setParsed(null);
      setFileError(null);
      setResult(null);
      importCsv.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the drawer closes
  }, [open]);

  const choose = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (!isCsvFile(f)) {
      setFileError('Choose a .csv file.');
      return;
    }
    setFileError(null);
    setFile(f);
    const content = await f.text();
    setText(content);
    setParsed(parseAirportsCsv(content));
  };

  const commit = () => {
    importCsv.mutate(text, {
      onSuccess: (r) => {
        setResult(r);
        toast.success(`${formatInt(r.inserted + r.updated)} airports imported`);
      },
      onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
    });
  };

  const back = () => {
    setParsed(null);
    setFile(null);
    setText('');
  };

  const footer =
    step === 0 ? (
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
    ) : step === 1 ? (
      <>
        <Button variant="ghost" onClick={back} disabled={importCsv.isPending}>
          Choose another file
        </Button>
        <Button variant="primary" onClick={commit} loading={importCsv.isPending} disabled={!parsed || parsed.rows.length === 0}>
          Import {parsed ? formatInt(parsed.rows.length) : ''} {parsed?.rows.length === 1 ? 'airport' : 'airports'}
        </Button>
      </>
    ) : (
      <Button variant="primary" onClick={onClose}>
        Done
      </Button>
    );

  return (
    <Drawer open={open} onClose={onClose} title="Import airports" description="Rows with a known IATA code are updated; new codes are inserted." width={640} dismissible={!importCsv.isPending} footer={footer}>
      <div className={styles.importBody}>
        <Stepper steps={STEPS} current={step} />

        {step === 0 ? (
          <>
            <FileDrop accept=".csv" label="Drop a CSV here, or browse" hint="Up to 5 MB. Lines starting with # are ignored." onFiles={(f) => void choose(f)} files={file ? [file] : undefined} error={fileError} />
            <section>
              <h3 className={styles.sectionTitle}>Columns</h3>
              <ul className={styles.columns}>
                {CSV_COLUMNS.map((c) => (
                  <li key={c.key} className={cn(styles.column, !c.required && styles.columnOptional)} title={c.help}>
                    {c.key}
                    {c.required ? '' : '?'}
                  </li>
                ))}
              </ul>
              <p className={styles.more}>
                Optional columns are marked with ?.{' '}
                <button type="button" className={styles.linkButton} onClick={() => saveTextFile(TEMPLATE_FILE_NAME, TEMPLATE_CSV)}>
                  Download the template
                </button>
              </p>
            </section>
          </>
        ) : null}

        {step === 1 && parsed ? (
          <>
            <Summary items={[{ label: 'Rows in file', value: parsed.total }, { label: 'Ready to import', value: parsed.rows.length }, { label: 'Rejected', value: parsed.errors.length, bad: true }]} />
            <section>
              <h3 className={styles.sectionTitle}>Rows ({formatInt(parsed.rows.length)})</h3>
              <Table caption="Rows to import" columns={ROW_COLUMNS} rows={parsed.rows.slice(0, PREVIEW_LIMIT)} rowKey={(r) => r.iata} dense stickyHeader={false} empty={<p className={styles.more}>No valid rows. Fix the problems below and choose the file again.</p>} />
              {parsed.rows.length > PREVIEW_LIMIT ? <p className={styles.more}>Showing the first {PREVIEW_LIMIT} of {formatInt(parsed.rows.length)} rows.</p> : null}
            </section>
            <ErrorsTable errors={parsed.errors} />
          </>
        ) : null}

        {step === 2 && result ? (
          <>
            <Summary items={[{ label: 'Inserted', value: result.inserted }, { label: 'Updated', value: result.updated }, { label: 'Rejected', value: result.rejected, bad: true }]} />
            <ErrorsTable errors={result.errors} />
          </>
        ) : null}
      </div>
    </Drawer>
  );
}
