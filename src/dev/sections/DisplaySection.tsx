import { Icon } from '@/design/icons';
import { Breadcrumbs, Button, Card, EmptyState, IconButton, KeyValue, Progress, Skeleton, Stat, Tooltip } from '@/design/primitives';

import styles from '../gallery.module.css';
import { Row, Section, Sub } from '../Section';

export function DisplaySection() {
  return (
    <Section id="display" title="Display" note="Stat tiles with mono numbers and delta chips, progress with label, key–value, cards, skeletons, empty states, breadcrumbs and tooltips.">
      <Sub>Stat</Sub>
      <Card>
        <div className={styles.grid}>
          <Stat label="Overall rating" value="4.15" unit="/ 5" delta={{ value: 0.3 }} hint="vs CSQ 2026 H1" size="lg" />
          <Stat label="Rank" value="3" unit="of 12" delta={{ value: -1, label: '−1', invert: true }} />
          <Stat label="Assessments" value="128" delta={{ value: 0, label: 'no change' }} />
          <Stat label="Pending" value="23" delta={{ value: 4, invert: true }} />
          <Stat label="Completion" value="81 %" loading />
        </div>
      </Card>
      <Sub>Progress</Sub>
      <div className={styles.grid}>
        <Progress value={61} label="Assessment progress" caption="14 of 23" />
        <Progress value={86} label="Sample selected" caption="43 / 50" tone="warn" />
        <Progress value={100} label="Locked" tone="success" size="sm" />
        <Progress value={12} label="Invitations opened" tone="danger" />
      </div>
      <Sub>Key–value and cards</Sub>
      <div className={styles.grid2}>
        <Card title="Operator" subtitle="Cargo Service Center · DEL" actions={<IconButton label="Edit" icon={<Icon name="edit" />} size="sm" />}>
          <KeyValue
            items={[
              { key: 'Code', value: 'CSC-DEL', mono: true },
              { key: 'Operations', value: 'Domestic · International' },
              { key: 'Market share', value: '55.0 %', mono: true },
              { key: 'Members', value: '6', mono: true },
            ]}
          />
        </Card>
        <Card title="Cycle windows" padding="sm" footer="Times are in Asia/Kolkata (IST)">
          <KeyValue
            layout="rows"
            columns={1}
            items={[
              { key: 'Sampling', value: '3 Nov 2026, 09:30 → 13 Nov 2026, 18:00', mono: true },
              { key: 'Assessment', value: '14 Nov 2026, 00:00 → 14 Dec 2026, 23:59', mono: true },
              { key: 'Minimum sample', value: '50', mono: true },
            ]}
          />
        </Card>
      </div>
      <Sub>Skeleton and empty states</Sub>
      <div className={styles.grid2}>
        <Card>
          <Row>
            <Skeleton circle height={40} />
            <div style={{ flex: 1 }}>
              <Skeleton lines={3} />
            </div>
          </Row>
          <Skeleton height={120} radius={8} />
        </Card>
        <Card padding="none">
          <EmptyState icon="users" title="No customers yet" description="Add freight forwarders and customs brokers, or import a CSV." action={<Button variant="primary">Add customer</Button>} />
        </Card>
      </div>
      <Sub>Breadcrumbs and tooltips</Sub>
      <Row>
        <Breadcrumbs items={[{ label: 'Cycles', to: '#' }, { label: 'CSQ 2026 H2', to: '#' }, { label: 'Participants' }]} />
      </Row>
      <Row>
        <Tooltip content="Lock the sample for this cycle">
          <IconButton label="Lock" icon={<Icon name="lock" />} variant="secondary" />
        </Tooltip>
        <Tooltip content="Shown below" side="bottom">
          <Button>Hover or focus me</Button>
        </Tooltip>
      </Row>
    </Section>
  );
}
