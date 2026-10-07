import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { errorMessage, errorRequestId } from '@/api/client';
import { fetchImportTemplate, useAcoScope, useCommitImport, useValidateImport } from '@/api/customers';
import { type ImportCommit, type ImportError, type ImportPreviewRow, type ImportValidation } from '@/api/customers.types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Banner, Button, Card, type Column, EmptyState, FileDrop, PageHeader, Pill, type PillVariant, Progress, Stat, type Step, Stepper, Table, Tag, useToast } from '@/design/primitives';
import { formatInt } from '@/lib/format';

import styles from './customers.module.css';
import { errorsToCsv, formatBytes, isCsvFile, saveTextFile, TEMPLATE_COLUMNS, TEMPLATE_FILE_NAME } from './importCsv';
import { OperatorPicker } from './OperatorPicker';

/* Bulk import (REQUIREMENTS §7; §6 "customers" import routes): template →
   upload → validate → commit → done, one Stepper, nothing committed until the
   operator has seen the row counts and every error. */

const STEPS: Step[] = [
  { id: 'template', label: 'Template', description: 'Download the CSV layout' },
  { id: 'upload', label: 'Upload', description: 'Drop your file' },
  { id: 'validate', label: 'Validate', description: 'Rows, errors, preview' },
  { id: 'commit', label: 'Import', description: 'Create and update' },
  { id: 'done', label: 'Done' },
];

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ERROR_ROWS_SHOWN = 100;

const ACTION_VARIANT: Record<ImportPreviewRow['action'], PillVariant> = { CREATE: 'success', UPDATE: 'info', REJECT: 'danger' };
const ACTION_LABEL: Record<ImportPreviewRow['action'], string> = { CREATE: 'Create', UPDATE: 'Update', REJECT: 'Rejected' };

function cell(value: string | string[] | undefined): string {
  if (value === undefined) return '';
  return Array.isArray(value) ? value.join(', ') : value;
}

function requestIdSuffix(e: unknown) {
  const id = errorRequestId(e);
  return id ? (
    <>
      {' '}
      · Request <code>{id}</code>
    </>
  ) : null;
}

type Flow = { step: number; file: File | null; fileError: string | null; validation: ImportValidation | null; result: ImportCommit | null };
const START: Flow = { step: 0, file: null, fileError: null, validation: null, result: null };

/** Operator → Customers → Import CSV. */
export default function CustomerImportPage() {
  const { org } = useSession();
  const scope = useAcoScope();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const validate = useValidateImport();
  const commit = useCommitImport();
  const [flow, setFlow] = useState<Flow>(START);
  const [templatePending, setTemplatePending] = useState(false);
  const acoId = scope.isPlatform ? scope.acoId : undefined;

  const backToDirectory = () => navigate({ pathname: '..', search: location.search }, { relative: 'path' });

  const downloadTemplate = async () => {
    setTemplatePending(true);
    try {
      const csv = await fetchImportTemplate(acoId);
      saveTextFile(TEMPLATE_FILE_NAME, csv);
      toast.success('Template downloaded');
    } catch (e) {
      toast.error(errorMessage(e), { requestId: errorRequestId(e) });
    } finally {
      setTemplatePending(false);
    }
  };

  const chooseFile = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!isCsvFile(file)) {
      setFlow((f) => ({ ...f, file: null, fileError: `${file.name} is not a CSV file. Save the sheet as CSV and try again.` }));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFlow((f) => ({ ...f, file: null, fileError: `${file.name} is ${formatBytes(file.size)}; the limit is 5 MB.` }));
      return;
    }
    setFlow((f) => ({ ...f, file, fileError: null }));
  };

  const runValidation = () => {
    if (!flow.file) return;
    validate.mutate(
      { file: flow.file, ...(acoId ? { acoId } : {}) },
      {
        // Errors stay inline next to the action (validate.error); no toast needed.
        onSuccess: (validation) => setFlow((f) => ({ ...f, validation, step: 2 })),
      },
    );
  };

  const runCommit = () => {
    const validation = flow.validation;
    if (!validation) return;
    setFlow((f) => ({ ...f, step: 3 }));
    commit.mutate(
      { importId: validation.importId, ...(acoId ? { acoId } : {}) },
      {
        onSuccess: (result) => {
          setFlow((f) => ({ ...f, result, step: 4 }));
          toast.success(`${formatInt(result.created + result.updated)} customers imported`);
        },
      },
    );
  };

  const jumpBack = (index: number) => {
    if (flow.step >= 3) return; // nothing to go back to once committed
    setFlow((f) => ({ ...f, step: index, ...(index <= 1 ? { validation: null } : {}) }));
    validate.reset();
  };

  return (
    <>
      <PageHeader
        eyebrow="Operator"
        title="Import customers"
        breadcrumbs={[{ label: 'Customers', to: `..${location.search}` }, { label: 'Import CSV' }]}
        context={scope.isPlatform ? 'Add or update an operator’s freight forwarders and customs brokers from a CSV file.' : `Add or update ${org.name}’s freight forwarders and customs brokers from a CSV file.`}
        actions={
          <Button variant="ghost" onClick={backToDirectory}>
            Back to customers
          </Button>
        }
      />

      {scope.isPlatform ? <OperatorPicker value={scope.acoId} onChange={(id) => scope.setAcoId(id)} /> : null}

      {!scope.ready ? (
        <EmptyState icon="building" title="Choose an operator" description="Imports go into one operator’s directory. Pick the operator above first." />
      ) : (
        <div className={styles.importLayout}>
          <Stepper steps={STEPS} current={flow.step} onStepClick={flow.step < 3 ? jumpBack : undefined} />

          {flow.step === 0 ? (
            <Card title="1 · Download the template" subtitle="One row per customer. Existing customers are matched on e-mail and updated; the rest are created.">
              <div className={styles.stepCard}>
                <Table
                  caption="Template columns"
                  dense
                  stickyHeader={false}
                  columns={[
                    { id: 'header', header: 'Column', cell: (c) => <strong>{c.header}</strong>, width: 160 },
                    { id: 'required', header: 'Required', width: 110, cell: (c) => (c.required ? <Pill variant="info" dot={false} size="sm">Required</Pill> : <span className={styles.muted}>Optional</span>) },
                    { id: 'help', header: 'What goes in it', cell: (c) => c.help },
                  ]}
                  rows={TEMPLATE_COLUMNS}
                  rowKey={(c) => c.key}
                />
                <p className={styles.templateHelp}>Column names are matched loosely (“Mobile”, “Organisation” and similar spellings work); extra columns are ignored. Up to 5 000 rows per file.</p>
                <div className={styles.stepActions}>
                  <Button variant="secondary" icon={<Icon name="download" size={18} />} onClick={() => void downloadTemplate()} loading={templatePending}>
                    Download template
                  </Button>
                  <span className={styles.spacer} />
                  <Button variant="primary" iconRight={<Icon name="chevron-right" size={18} />} onClick={() => setFlow((f) => ({ ...f, step: 1 }))}>
                    I have a file
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          {flow.step === 1 ? (
            <Card title="2 · Upload the file" subtitle="Nothing is saved yet — the file is checked first.">
              <div className={styles.stepCard}>
                <FileDrop
                  accept=".csv,text/csv"
                  label="Drop the CSV here, or browse"
                  hint="UTF-8 CSV, up to 5 MB."
                  files={flow.file ? [flow.file] : undefined}
                  onFiles={chooseFile}
                  onClear={() => setFlow((f) => ({ ...f, file: null, fileError: null }))}
                  error={flow.fileError}
                  disabled={validate.isPending}
                />
                {validate.isError ? (
                  <p className={styles.errorBox} role="alert">
                    {errorMessage(validate.error)}
                    {requestIdSuffix(validate.error)}
                  </p>
                ) : null}
                <div className={styles.stepActions}>
                  <Button variant="ghost" onClick={() => jumpBack(0)} disabled={validate.isPending}>
                    Back
                  </Button>
                  <span className={styles.spacer} />
                  <Button variant="primary" onClick={runValidation} disabled={!flow.file} loading={validate.isPending} iconRight={<Icon name="chevron-right" size={18} />}>
                    Validate file
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          {flow.step === 2 && flow.validation ? (
            <ValidationStep validation={flow.validation} file={flow.file} onBack={() => jumpBack(1)} onCommit={runCommit} />
          ) : null}

          {flow.step === 3 && flow.validation ? (
            <Card title="4 · Importing" subtitle={flow.validation.fileName}>
              <div className={styles.stepCard}>
                <Progress
                  value={commit.isPending ? 45 : commit.isError ? 0 : 100}
                  label={commit.isPending ? `Importing ${formatInt(flow.validation.accepted)} customers…` : commit.isError ? 'Import failed' : 'Imported'}
                  caption={commit.isPending ? 'Working' : commit.isError ? 'Stopped' : 'Done'}
                  tone={commit.isError ? 'danger' : 'accent'}
                />
                {commit.isError ? (
                  <>
                    <p className={styles.errorBox} role="alert">
                      {errorMessage(commit.error)}
                      {requestIdSuffix(commit.error)}
                    </p>
                    <div className={styles.stepActions}>
                      <Button variant="ghost" onClick={() => setFlow((f) => ({ ...f, step: 2 }))}>
                        Back to review
                      </Button>
                      <span className={styles.spacer} />
                      <Button variant="primary" onClick={runCommit} icon={<Icon name="refresh" size={18} />}>
                        Try again
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className={styles.templateHelp}>The import runs as one transaction: either every accepted row is saved or none is.</p>
                )}
              </div>
            </Card>
          ) : null}

          {flow.step === 4 && flow.result ? (
            <Card>
              <div className={styles.done}>
                <span className={styles.doneIcon} aria-hidden="true">
                  <Icon name="check" size={24} />
                </span>
                <h3 className={styles.sectionTitle}>Import complete</h3>
                <p className={styles.templateHelp}>
                  {flow.result.fileName} · {formatInt(flow.result.rows)} {flow.result.rows === 1 ? 'row' : 'rows'}
                </p>
                <div className={styles.doneNumbers}>
                  <Stat label="Created" value={formatInt(flow.result.created)} size="lg" />
                  <Stat label="Updated" value={formatInt(flow.result.updated)} size="lg" />
                  <Stat label="Rejected" value={formatInt(flow.result.rejected)} size="lg" hint={flow.result.rejected > 0 ? 'Fix the errors and import those rows again' : undefined} />
                </div>
                <div className={styles.stepActions}>
                  <Button variant="secondary" onClick={() => setFlow({ ...START, step: 1 })}>
                    Import another file
                  </Button>
                  <Button variant="primary" onClick={backToDirectory} iconRight={<Icon name="chevron-right" size={18} />}>
                    View customers
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </>
  );
}

// --- step 3: the review ---------------------------------------------------------

type ValidationStepProps = { validation: ImportValidation; file: File | null; onBack: () => void; onCommit: () => void };

export function ValidationStep({ validation, file, onBack, onCommit }: ValidationStepProps) {
  const creates = validation.preview.filter((r) => r.action === 'CREATE').length;
  const updates = validation.preview.filter((r) => r.action === 'UPDATE').length;
  const previewPartial = validation.preview.length < validation.rows;
  const nothingToImport = validation.accepted === 0;
  const fileErrors = validation.errors.filter((e) => e.field === 'file' || e.field === 'header');

  const errorColumns: Column<ImportError & { i: number }>[] = [
    { id: 'row', header: 'Row', width: 80, mono: true, align: 'right', cell: (e) => (e.row === 0 ? '—' : formatInt(e.row)) },
    { id: 'field', header: 'Column', width: 140, cell: (e) => <code className="mono">{e.field}</code> },
    { id: 'message', header: 'Problem', cell: (e) => e.message },
  ];
  const previewColumns: Column<ImportPreviewRow>[] = [
    { id: 'row', header: 'Row', width: 70, mono: true, align: 'right', cell: (r) => formatInt(r.row) },
    {
      id: 'action',
      header: 'Action',
      width: 110,
      cell: (r) => (
        <Pill variant={ACTION_VARIANT[r.action]} size="sm">
          {ACTION_LABEL[r.action]}
        </Pill>
      ),
    },
    { id: 'name', header: 'Name', cell: (r) => <span className={styles.cell}>{cell(r.data.name)}</span> },
    { id: 'email', header: 'E-mail', hideBelow: 'md', cell: (r) => <span className={`${styles.cell} mono`}>{cell(r.data.email)}</span> },
    { id: 'phone', header: 'Phone', width: 140, mono: true, hideBelow: 'md', cell: (r) => cell(r.data.phone) },
    { id: 'type', header: 'Type', width: 70, hideBelow: 'sm', cell: (r) => cell(r.data.type) },
    { id: 'surveyType', header: 'Survey', width: 120, hideBelow: 'sm', cell: (r) => cell(r.data.surveyType) },
    { id: 'tags', header: 'Tags', hideBelow: 'md', cell: (r) => cell(r.data.tags) },
  ];

  return (
    <Card title="3 · Review before importing" subtitle={`${validation.fileName}${file ? ` · ${formatBytes(file.size)}` : ''}`}>
      <div className={styles.stepCard}>
        <div className={styles.tiles}>
          <Stat className={styles.tile} label="Rows" value={formatInt(validation.rows)} />
          <Stat className={styles.tile} label="Accepted" value={formatInt(validation.accepted)} hint={previewPartial ? `${formatInt(creates)} create · ${formatInt(updates)} update in the preview` : `${formatInt(creates)} create · ${formatInt(updates)} update`} />
          <Stat className={styles.tile} label="Rejected" value={formatInt(validation.rejected)} hint={validation.rejected > 0 ? 'Not imported' : undefined} />
          <Stat className={styles.tile} label="Errors" value={formatInt(validation.errors.length)} />
        </div>

        {validation.headers.missing.length > 0 ? (
          <Banner tone="danger" title="Required columns are missing">
            {validation.headers.missing.join(', ')} — add them to the file and upload it again.
          </Banner>
        ) : null}
        {validation.headers.ignored.length > 0 ? (
          <Banner tone="warn" title="Some columns were ignored">
            <span className={styles.columns}>
              {validation.headers.ignored.map((h) => (
                <Tag key={h} tone="outline">
                  {h}
                </Tag>
              ))}
            </span>
          </Banner>
        ) : null}
        {fileErrors.length > 0 ? (
          <Banner tone="danger" title="The file could not be read">
            {fileErrors.map((e) => e.message).join(' · ')}
          </Banner>
        ) : null}
        {nothingToImport && fileErrors.length === 0 && validation.headers.missing.length === 0 ? (
          <Banner tone="warn" title="Nothing to import">
            Every row was rejected. Fix the errors below and upload the file again.
          </Banner>
        ) : null}

        {validation.errors.length > 0 ? (
          <section aria-label="Errors">
            <h3 className={styles.sectionTitle}>
              Errors
              <span className={styles.spacer} />
              <Button size="sm" variant="secondary" icon={<Icon name="download" size={16} />} onClick={() => saveTextFile(`${validation.fileName.replace(/\.csv$/i, '')}-errors.csv`, errorsToCsv(validation.errors))}>
                Download errors
              </Button>
            </h3>
            <Table
              caption="Validation errors"
              dense
              stickyHeader={false}
              columns={errorColumns}
              rows={validation.errors.slice(0, ERROR_ROWS_SHOWN).map((e, i) => ({ ...e, i }))}
              rowKey={(e) => `${e.row}-${e.field}-${e.i}`}
            />
            {validation.errors.length > ERROR_ROWS_SHOWN ? (
              <p className={styles.templateHelp}>
                Showing the first {ERROR_ROWS_SHOWN} of {formatInt(validation.errors.length)} errors — download the full list.
              </p>
            ) : null}
          </section>
        ) : null}

        {validation.preview.length > 0 ? (
          <section aria-label="Preview">
            <h3 className={styles.sectionTitle}>
              Preview
              {previewPartial ? <span className={styles.muted}>first {formatInt(validation.preview.length)} of {formatInt(validation.rows)} rows</span> : null}
            </h3>
            <Table caption="Preview rows" dense stickyHeader={false} columns={previewColumns} rows={validation.preview} rowKey={(r) => String(r.row)} />
          </section>
        ) : null}

        <div className={styles.stepActions}>
          <Button variant="ghost" onClick={onBack} icon={<Icon name="chevron-left" size={18} />}>
            Choose another file
          </Button>
          <span className={styles.spacer} />
          <Button variant="primary" onClick={onCommit} disabled={nothingToImport} icon={<Icon name="upload" size={18} />}>
            Import {formatInt(validation.accepted)} {validation.accepted === 1 ? 'customer' : 'customers'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
