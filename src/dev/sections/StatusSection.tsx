import { Avatar, Badge, IllustrativeTag, Pill, type PillVariant, RatingPill, statusVariant, Tag } from '@/design/primitives';
import { humanise } from '@/lib/format';

import { Row, Section, Sub } from '../Section';

const VARIANTS: PillVariant[] = ['neutral', 'info', 'success', 'warn', 'danger'];
const STATUSES = ['DRAFT', 'PUBLISHED', 'SAMPLING_OPEN', 'SAMPLING_CLOSED', 'ASSESSMENT_OPEN', 'ASSESSMENT_CLOSED', 'SCORED', 'ARCHIVED', 'INVITED', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'UNLOCKED', 'SUBMITTED', 'EXPIRED', 'REVOKED'];

export function StatusSection() {
  return (
    <Section id="status" title="Status" note="Pills carry text, never colour alone. The six rating pills use the ramp tokens; semantic pills never read as a traffic light.">
      <Sub>Pill variants</Sub>
      <Row>
        {VARIANTS.map((v) => (
          <Pill key={v} variant={v}>
            {humanise(v)}
          </Pill>
        ))}
        <Pill variant="info" dot={false}>
          No dot
        </Pill>
        <Pill variant="success" size="sm">
          Small
        </Pill>
      </Row>
      <Sub>Rating pills</Sub>
      <Row>
        {[5, 4, 3, 2, 1, null].map((r) => (
          <RatingPill key={String(r)} rating={r} />
        ))}
        <RatingPill rating={4.15} size="sm" />
        <RatingPill rating={2.4} size="sm" />
      </Row>
      <Sub>Wire statuses → statusVariant()</Sub>
      <Row>
        {STATUSES.map((s) => (
          <Pill key={s} variant={statusVariant(s)} size="sm">
            {humanise(s)}
          </Pill>
        ))}
      </Row>
      <Sub>Tags, badges, avatars</Sub>
      <Row>
        <Tag>Freight forwarder</Tag>
        <Tag tone="accent">Domestic</Tag>
        <Tag onRemove={() => undefined}>Mumbai</Tag>
        <IllustrativeTag />
        <Badge count={3} />
        <Badge count={12} tone="accent" />
        <Badge count={140} tone="danger" />
        <Badge count={0} hideZero={false} />
        <Avatar name="Anita Desai" size="sm" />
        <Avatar name="Priya Natarajan" />
        <Avatar name="Rohan Mehta" size="lg" />
      </Row>
    </Section>
  );
}
