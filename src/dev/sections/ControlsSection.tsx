import { useState } from 'react';

import { Icon } from '@/design/icons';
import { Button, Checkbox, DateTimeInput, FileDrop, IconButton, Input, Radio, RadioGroup, SearchInput, Select, Switch, Textarea } from '@/design/primitives';

import styles from '../gallery.module.css';
import { Row, Section, Sub } from '../Section';

const AIRPORTS = [
  { value: 'DEL', label: 'Delhi (DEL)' },
  { value: 'BOM', label: 'Mumbai (BOM)' },
  { value: 'BLR', label: 'Bengaluru (BLR)' },
];

export function ControlsSection() {
  const [on, setOn] = useState(true);
  const [search, setSearch] = useState('');
  const [wall, setWall] = useState<string | null>('2026-11-03T09:30');
  const [files, setFiles] = useState<File[]>([]);

  return (
    <Section id="controls" title="Form controls" note="Buttons, inputs, selects, checks, switches, zoned date-time and file drop. Every target ≥ 40px; focus rings always visible (Tab through).">
      <Sub>Buttons</Sub>
      <Row>
        <Button variant="primary">Primary</Button>
        <Button>Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="primary" icon={<Icon name="plus" size={18} />}>
          With icon
        </Button>
        <Button iconRight={<Icon name="chevron-down" size={16} />}>Menu</Button>
        <Button variant="primary" loading>
          Saving
        </Button>
        <Button disabled>Disabled</Button>
      </Row>
      <Row>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large (public)</Button>
        <IconButton label="More" icon={<Icon name="more" />} />
        <IconButton label="Edit" icon={<Icon name="edit" />} variant="secondary" />
        <IconButton label="Add" icon={<Icon name="plus" />} variant="primary" />
        <IconButton label="Filter active" icon={<Icon name="filter" />} active />
      </Row>

      <Sub>Inputs</Sub>
      <div className={styles.grid}>
        <Input label="Organisation name" placeholder="e.g. Cargo Service Center" hint="As registered with ACFI" />
        <Input label="Market share" suffix="%" mono defaultValue="55.0" />
        <Input label="E-mail" type="email" defaultValue="priya@csc" error="Enter a valid e-mail address" />
        <Input label="Code" prefix={<Icon name="lock" size={16} />} defaultValue="CSC-DEL" disabled />
        <Input label="Minimum sample" type="number" mono defaultValue="50" required />
        <Input label="Small" size="sm" placeholder="Filter" />
      </div>
      <div className={styles.grid}>
        <Select label="Airport" options={AIRPORTS} placeholder="Choose an airport" />
        <Select label="Airport" options={AIRPORTS} defaultValue="BOM" error="Required" />
        <Select label="Airport" options={AIRPORTS} defaultValue="DEL" disabled />
        <Textarea label="Reason for unlock" placeholder="Why is the sample being unlocked?" hint="Recorded in the audit log" />
        <Textarea label="Note" defaultValue="Too short" error="At least 20 characters" />
        <SearchInput value={search} onChange={setSearch} placeholder="Search customers" />
      </div>

      <Sub>Checks and switches</Sub>
      <Row>
        <Checkbox label="Domestic" defaultChecked />
        <Checkbox label="International" />
        <Checkbox label="All airports" indeterminate />
        <Checkbox label="Locked" disabled defaultChecked />
        <Checkbox label="Send reminders" description="Up to three, every three days" />
      </Row>
      <Row>
        <RadioGroup label="Survey type" inline>
          <Radio name="st" label="Domestic" defaultChecked />
          <Radio name="st" label="International" />
          <Radio name="st" label="Both" />
          <Radio name="st" label="Retired" disabled />
        </RadioGroup>
      </Row>
      <Row>
        <Switch checked={on} onChange={setOn} label="Reveal assessor identity" description="Operators see who answered" />
        <Switch checked={!on} onChange={(v) => setOn(!v)} label="Small" size="sm" />
        <Switch checked disabled onChange={() => undefined} label="Locked on" />
      </Row>

      <Sub>Zoned date-time and files</Sub>
      <div className={styles.grid2}>
        <DateTimeInput label="Sampling opens" value={wall} onChange={setWall} tz="Asia/Kolkata" hint="Wall-clock in the cycle time zone" />
        <DateTimeInput label="Assessment closes" value={null} onChange={() => undefined} tz="Asia/Kolkata" error="Must be after the sampling window" required />
        <FileDrop accept=".csv,.xlsx" onFiles={setFiles} files={files} onClear={() => setFiles([])} hint="Up to 5 MB. Use the template for the right columns." />
        <FileDrop accept=".csv" onFiles={() => undefined} disabled label="Imports are closed while sampling is locked" />
      </div>
    </Section>
  );
}
