import { useState } from 'react';

import { Icon } from '@/design/icons';
import { Button, Card, PageHeader, Pagination, Pill, SearchInput, Select, Stepper, TabPanel, Toolbar, ToolbarCount } from '@/design/primitives';

import { Row, Section, Sub } from '../Section';

const STEPS = [
  { id: 'basics', label: 'Basics', description: 'Name, type, time zone' },
  { id: 'windows', label: 'Windows', description: 'Sampling and assessment' },
  { id: 'participants', label: 'Participants', description: 'Airports and operators' },
  { id: 'review', label: 'Review', description: 'Publish' },
];

export function NavigationSection() {
  const [tab, setTab] = useState('participants');
  const [step, setStep] = useState(2);
  const [page, setPage] = useState(3);
  const [pageSize, setPageSize] = useState(25);
  const [q, setQ] = useState('');

  return (
    <Section id="navigation" title="Navigation" note="PageHeader (eyebrow · title · context · actions · tabs), Tabs with a roving tabindex, Stepper, Toolbar and Pagination.">
      <Sub>PageHeader with tabs and actions</Sub>
      <Card padding="sm">
        <PageHeader
          eyebrow="Cycles"
          title="CSQ 2026 H2"
          context="Domestic and international · 12 airports · 31 operators · sampling closes in 3 days."
          meta={<Pill variant="info">Sampling open</Pill>}
          breadcrumbs={[{ label: 'Cycles', to: '#' }, { label: 'CSQ 2026 H2' }]}
          actions={
            <>
              <Button icon={<Icon name="mail" size={18} />}>Send reminder</Button>
              <Button variant="primary" icon={<Icon name="check" size={18} />}>
                Close sampling
              </Button>
            </>
          }
          tabs={{
            tabs: [
              { id: 'participants', label: 'Participants', count: 31 },
              { id: 'monitoring', label: 'Monitoring' },
              { id: 'notifications', label: 'Notifications', count: 140 },
              { id: 'actions', label: 'Actions', disabled: true },
            ],
            value: tab,
            onChange: setTab,
            'aria-label': 'Cycle sections',
          }}
        />
        <TabPanel tabId={tab}>
          <p style={{ color: 'var(--muted)' }}>Panel for “{tab}”. Use ← → Home End on the tabs.</p>
        </TabPanel>
      </Card>

      <Sub>Stepper</Sub>
      <Card>
        <Stepper steps={STEPS} current={step} onStepClick={setStep} />
        <Row>
          <Button size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </Button>
          <Button size="sm" variant="primary" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={step === STEPS.length - 1}>
            Continue
          </Button>
        </Row>
      </Card>

      <Sub>Toolbar and pagination</Sub>
      <Card padding="sm">
        <Toolbar end={<ToolbarCount>132 customers</ToolbarCount>}>
          <SearchInput value={q} onChange={setQ} placeholder="Search customers" />
          <Select aria-label="Type" size="sm" options={[{ value: '', label: 'All types' }, { value: 'FF', label: 'Freight forwarders' }, { value: 'CB', label: 'Customs brokers' }]} />
          <Select aria-label="Survey" size="sm" options={[{ value: '', label: 'Any survey' }, { value: 'DOMESTIC', label: 'Domestic' }, { value: 'INTERNATIONAL', label: 'International' }]} />
        </Toolbar>
        <Pagination page={page} pageSize={pageSize} total={132} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </Card>
    </Section>
  );
}
