import { useState, type ChangeEvent, type DragEvent, type FC } from 'react';
import type { CommitResult, Customer, ImportField, ImportRow } from '../api/sampling.types';
import {
  CUSTOMER_TYPES,
  FIELD_LABEL,
  FORM_SCOPES,
  SAMPLE_IMPORT_CSV,
  SCOPE_LABEL,
  TEMPLATE_CSV,
  TEMPLATE_HEADERS,
  TYPE_LABEL,
  coerceScope,
  coerceType,
  downloadCsv,
  plural,
  readRows,
  validateImportRows,
} from '../api/sampling.logic';
import Dialog from './Dialog';

interface Props {
  open: boolean;
  existing: Customer[];
  onClose: () => void;
  onCommit: (rows: ImportRow[]) => Promise<CommitResult>;
  onImported: (imported: Customer[]) => void;
}

type Phase = 'UPLOAD' | 'REVIEW' | 'RESULT';

const MAX_BYTES = 1_000_000;
const TEXT_FIELDS: ImportField[] = ['name', 'company', 'email', 'phone'];

function errorFor(row: ImportRow, field: ImportField): string | undefined {
  return row.errors.find((error) => error.field === field)?.message;
}

export const ImportDialog: FC<Props> = ({ open, existing, onClose, onCommit, onImported }) => {
  const [phase, setPhase] = useState<Phase>('UPLOAD');
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<{ attempted: number; imported: number; rejected: CommitResult['rejected'] } | null>(null);

  const reset = () => {
    setPhase('UPLOAD');
    setFileName('');
    setFileError(null);
    setRows([]);
    setResult(null);
    setCommitting(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const load = (name: string, text: string) => {
    const read = readRows(text);
    setFileName(name);
    if (read.fileError) {
      setFileError(read.fileError);
      setRows([]);
      setPhase('UPLOAD');
      return;
    }
    setFileError(null);
    setRows(validateImportRows(read.rows, existing));
    setPhase('REVIEW');
  };

  const takeFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setFileError('That file is larger than 1 MB. Export just the contact columns and try again.');
      return;
    }
    try {
      load(file.name, await file.text());
    } catch {
      setFileError('That file could not be read. Save it as CSV and try again.');
    }
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragOver(false);
    void takeFile(event.dataTransfer.files[0]);
  };

  const edit = (lineNumber: number, field: ImportField, value: string) => {
    setRows((current) =>
      validateImportRows(
        current.map((row) =>
          row.lineNumber === lineNumber ? { lineNumber: row.lineNumber, values: { ...row.values, [field]: value } } : { lineNumber: row.lineNumber, values: row.values },
        ),
        existing,
      ),
    );
  };

  const dropRow = (lineNumber: number) => {
    setRows((current) =>
      validateImportRows(
        current.filter((row) => row.lineNumber !== lineNumber).map((row) => ({ lineNumber: row.lineNumber, values: row.values })),
        existing,
      ),
    );
  };

  const ready = rows.filter((row) => row.errors.length === 0);
  const broken = rows.filter((row) => row.errors.length > 0);

  const commit = async () => {
    if (ready.length === 0) return;
    setCommitting(true);
    try {
      const outcome = await onCommit(ready);
      onImported(outcome.imported);

      const rejectedLines = new Set(outcome.rejected.map((entry) => entry.lineNumber));
      const remaining = [...broken, ...rows.filter((row) => rejectedLines.has(row.lineNumber))].sort(
        (a, b) => a.lineNumber - b.lineNumber,
      );
      setRows(
        validateImportRows(
          remaining.map((row) => ({ lineNumber: row.lineNumber, values: row.values })),
          [...existing, ...outcome.imported],
        ),
      );
      setResult({ attempted: ready.length + broken.length, imported: outcome.imported.length, rejected: outcome.rejected });
      setPhase('RESULT');
    } catch {
      setFileError('The import could not be sent. Nothing was saved. Try again.');
    } finally {
      setCommitting(false);
    }
  };

  const footer = () => {
    if (phase === 'UPLOAD') {
      return (
        <>
          <span className="spacer">Columns: {TEMPLATE_HEADERS.join(', ')}</span>
          <button type="button" className="smp-btn" onClick={close}>
            Cancel
          </button>
        </>
      );
    }

    if (phase === 'REVIEW') {
      return (
        <>
          <span className="spacer">
            {ready.length} of {rows.length} {plural(rows.length, 'row is', 'rows are')} ready
          </span>
          <button type="button" className="smp-btn" onClick={reset} disabled={committing}>
            Choose another file
          </button>
          <button
            type="button"
            className="smp-btn smp-btn--primary"
            onClick={() => void commit()}
            disabled={ready.length === 0 || committing}
          >
            {committing ? 'Importing...' : `Import ${ready.length} ${plural(ready.length, 'row', 'rows')}`}
          </button>
        </>
      );
    }

    return (
      <>
        {rows.length > 0 ? (
          <button type="button" className="smp-btn" onClick={() => setPhase('REVIEW')}>
            Correct the remaining {rows.length}
          </button>
        ) : null}
        <button type="button" className="smp-btn smp-btn--primary" onClick={close}>
          Done
        </button>
      </>
    );
  };

  return (
    <Dialog
      open={open}
      wide={phase !== 'UPLOAD'}
      title="Import customers"
      subtitle={
        phase === 'UPLOAD'
          ? 'Upload your list, check the validation report, then commit. Nothing is saved until you commit.'
          : fileName
      }
      onClose={close}
      footer={footer()}
    >
      {phase === 'UPLOAD' ? (
        <>
          <label
            className={dragOver ? 'smp-drop is-over' : 'smp-drop'}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                void takeFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <span className="big">Choose a CSV file or drop it here</span>
            <span className="small">
              One contact a row, up to 1 MB. Headings can be in any order as long as the six columns are named.
            </span>
          </label>

          {fileError ? (
            <p className="smp-note smp-note--bad" role="alert" style={{ marginTop: 16, marginBottom: 0 }}>
              {fileError}
            </p>
          ) : null}

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="smp-btn"
              onClick={() => downloadCsv('csq-customer-template.csv', TEMPLATE_CSV)}
            >
              Download the template
            </button>
            <button type="button" className="smp-btn smp-btn--ghost" onClick={() => load('sample-customers.csv', SAMPLE_IMPORT_CSV)}>
              Try a sample file
            </button>
          </div>
          <p className="smp-field" style={{ marginTop: 14 }}>
            <span className="hint">
              The sample file is illustrative and carries deliberate mistakes, so the validation report can be
              seen working.
            </span>
          </p>
        </>
      ) : null}

      {phase === 'REVIEW' ? (
        <>
          <div className="smp-summary">
            <div className="smp-stat smp-stat--ok">
              <div className="n">{ready.length}</div>
              <div className="k">Ready to import</div>
            </div>
            <div className={broken.length > 0 ? 'smp-stat smp-stat--bad' : 'smp-stat'}>
              <div className="n">{broken.length}</div>
              <div className="k">Need a correction</div>
            </div>
            <div className="smp-stat">
              <div className="n">{rows.length}</div>
              <div className="k">Rows in the file</div>
            </div>
          </div>

          <p className="smp-note" style={{ marginBottom: 14 }}>
            Correct anything below in place. Line numbers match the file you uploaded. Rows you cannot fix
            can be left as they are: they simply will not be imported.
          </p>

          <div className="smp-imp-wrap">
            <table className="smp-imp">
              <caption className="smp-sr">Validation report, one row a line in the uploaded file</caption>
              <thead>
                <tr>
                  <th scope="col">Line</th>
                  {TEXT_FIELDS.map((field) => (
                    <th scope="col" key={field}>
                      {FIELD_LABEL[field]}
                    </th>
                  ))}
                  <th scope="col">{FIELD_LABEL.type}</th>
                  <th scope="col">{FIELD_LABEL.scope}</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const typeValue = coerceType(row.values.type);
                  const scopeValue = coerceScope(row.values.scope);
                  const typeError = errorFor(row, 'type');
                  const scopeError = errorFor(row, 'scope');
                  return (
                    <tr key={row.lineNumber} className={row.errors.length > 0 ? 'is-bad' : 'is-fixed'}>
                      <td className="ln">{row.lineNumber}</td>

                      {TEXT_FIELDS.map((field) => {
                        const message = errorFor(row, field);
                        return (
                          <td key={field}>
                            <input
                              className="smp-input"
                              value={row.values[field]}
                              aria-label={`${FIELD_LABEL[field]}, line ${row.lineNumber}`}
                              aria-invalid={message ? 'true' : undefined}
                              onChange={(event) => edit(row.lineNumber, field, event.target.value)}
                            />
                            {message ? <span className="cellerr">{message}</span> : null}
                          </td>
                        );
                      })}

                      <td>
                        <select
                          value={typeValue ?? ''}
                          aria-label={`Customer type, line ${row.lineNumber}`}
                          aria-invalid={typeError ? 'true' : undefined}
                          onChange={(event) => edit(row.lineNumber, 'type', event.target.value)}
                        >
                          {!typeValue ? (
                            <option value="">{row.values.type ? `"${row.values.type}"` : 'Choose one'}</option>
                          ) : null}
                          {CUSTOMER_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {TYPE_LABEL[type]}
                            </option>
                          ))}
                        </select>
                        {typeError ? <span className="cellerr">{typeError}</span> : null}
                      </td>

                      <td>
                        <select
                          value={scopeValue ?? ''}
                          aria-label={`Form scope, line ${row.lineNumber}`}
                          aria-invalid={scopeError ? 'true' : undefined}
                          onChange={(event) => edit(row.lineNumber, 'scope', event.target.value)}
                        >
                          {!scopeValue ? (
                            <option value="">{row.values.scope ? `"${row.values.scope}"` : 'Choose one'}</option>
                          ) : null}
                          {FORM_SCOPES.map((scope) => (
                            <option key={scope} value={scope}>
                              {SCOPE_LABEL[scope]}
                            </option>
                          ))}
                        </select>
                        {scopeError ? <span className="cellerr">{scopeError}</span> : null}
                      </td>

                      <td>
                        {row.errors.length === 0 ? (
                          <span className="ok" aria-label="Ready to import">
                            Ready
                          </span>
                        ) : (
                          <span>
                            {row.errors.length} {plural(row.errors.length, 'problem', 'problems')}
                          </span>
                        )}
                        <br />
                        <button
                          type="button"
                          className="smp-btn smp-btn--ghost"
                          style={{ minHeight: 28, padding: '2px 4px', fontSize: 11.5 }}
                          onClick={() => dropRow(row.lineNumber)}
                        >
                          Skip row
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {phase === 'RESULT' && result ? (
        <>
          <div className="smp-summary">
            <div className="smp-stat smp-stat--ok">
              <div className="n">{result.imported}</div>
              <div className="k">Imported</div>
            </div>
            <div className={rows.length > 0 ? 'smp-stat smp-stat--bad' : 'smp-stat'}>
              <div className="n">{rows.length}</div>
              <div className="k">Not imported</div>
            </div>
            <div className="smp-stat">
              <div className="n">{result.attempted}</div>
              <div className="k">Rows in the file</div>
            </div>
          </div>

          <p className="smp-note smp-note--ok" role="status">
            {result.imported} of {result.attempted} {plural(result.attempted, 'row was', 'rows were')} added to
            your directory.
            {rows.length > 0
              ? ` ${rows.length} ${plural(rows.length, 'row was', 'rows were')} left out and nothing about them was saved.`
              : ''}
          </p>

          {result.rejected.length > 0 ? (
            <>
              <h3 style={{ fontSize: 13, fontWeight: 800, margin: '18px 0 6px' }}>
                Turned down by the server
              </h3>
              <ul className="smp-rejects">
                {result.rejected.map((entry) => (
                  <li key={entry.lineNumber}>
                    <b>Line {entry.lineNumber}</b>: {entry.reason}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : null}
    </Dialog>
  );
};

export default ImportDialog;
