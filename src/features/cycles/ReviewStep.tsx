import { useMemo } from 'react';

import { type Operator } from '@/api/operators.types';
import { Icon } from '@/design/icons';
import { Button, KeyValue, type KeyValueItem, Pill } from '@/design/primitives';
import { describeTimeZone, formatInt } from '@/lib/format';

import { useBuilder } from './builderContext';
import { CYCLE_TYPE_LABELS, TYPE_PILL } from './cycleLabels';
import styles from './cycles.module.css';
import { airportShareTotal } from './ParticipantsStep';
import { formatWall } from './SamplingStep';
import { WindowTimeline } from './WindowTimeline';

export type ReviewStepProps = {
  onSaveDraft: () => void;
  onPublish: () => void;
  saving: boolean;
  publishing: boolean;
  canPublish: boolean;
};

/** Step 5 — everything on one screen, the warnings publish would hit, Save as draft / Publish. */
export function ReviewStep({ onSaveDraft, onPublish, saving, publishing, canPublish }: ReviewStepProps) {
  const { form, goTo, airports, operators } = useBuilder();
  const v = form.watch();

  const shareWarnings = useMemo(() => {
    const byAirport = new Map<string, Operator[]>();
    operators.forEach((o) => byAirport.set(o.airport.id, [...(byAirport.get(o.airport.id) ?? []), o]));
    return airports
      .filter((a) => v.participatingAirportIds.includes(a.id))
      .map((a) => ({ airport: a, ...airportShareTotal(byAirport.get(a.id) ?? []) }))
      .filter((s) => !s.ok);
  }, [airports, operators, v.participatingAirportIds]);

  const noParticipants = v.participatingAirportIds.length === 0 || v.participatingAcoIds.length === 0;

  const basics: KeyValueItem[] = [
    { key: 'Name', value: v.name || '—' },
    { key: 'Code', value: v.code || '—', mono: true },
    { key: 'Type', value: <Pill variant={TYPE_PILL[v.type]}>{CYCLE_TYPE_LABELS[v.type]}</Pill> },
    { key: 'Time zone', value: `${v.tz} · ${describeTimeZone(v.tz)}` },
  ];
  const windows: KeyValueItem[] = [
    { key: 'Sampling', value: v.sampling.start && v.sampling.end ? `${formatWall(v.sampling.start)} → ${formatWall(v.sampling.end)}` : '—', mono: true },
    { key: 'Assessment', value: v.assessment.start && v.assessment.end ? `${formatWall(v.assessment.start)} → ${formatWall(v.assessment.end)}` : '—', mono: true },
  ];
  const sampling: KeyValueItem[] = [
    { key: 'Minimum sample', value: formatInt(v.minSampleSize), mono: true },
    { key: 'Sampling reminders', value: `${formatInt(v.reminders.sampling.count)} × every ${formatInt(v.reminders.sampling.everyDays)} days`, mono: true },
    { key: 'Assessment reminders', value: `${formatInt(v.reminders.assessment.count)} × every ${formatInt(v.reminders.assessment.everyDays)} days`, mono: true },
  ];
  const participants: KeyValueItem[] = [
    { key: 'Airports', value: formatInt(v.participatingAirportIds.length), mono: true },
    { key: 'Operators', value: formatInt(v.participatingAcoIds.length), mono: true },
  ];

  return (
    <div className={styles.form}>
      <div className={styles.reviewGrid}>
        <Block title="Basics" onEdit={() => goTo('basics')}>
          <KeyValue items={basics} layout="rows" />
        </Block>
        <Block title="Sampling & reminders" onEdit={() => goTo('sampling')}>
          <KeyValue items={sampling} layout="rows" />
        </Block>
        <Block title="Windows" onEdit={() => goTo('windows')}>
          <KeyValue items={windows} layout="rows" />
          <WindowTimeline windows={{ sampling: v.sampling, assessment: v.assessment }} tz={v.tz} />
        </Block>
        <Block title="Participants" onEdit={() => goTo('participants')}>
          <KeyValue items={participants} layout="rows" />
        </Block>
      </div>

      {noParticipants || shareWarnings.length > 0 ? (
        <ul className={styles.problemList} aria-label="Before publishing">
          {noParticipants ? (
            <li className={styles.problemItem}>
              <span className={styles.problemText}>
                <Icon name="warning" size={16} />
                <span>Publishing needs at least one participating airport and operator. You can still save the draft.</span>
              </span>
              <Button size="sm" variant="secondary" onClick={() => goTo('participants')}>
                Edit participants
              </Button>
            </li>
          ) : null}
          {shareWarnings.map((s) => (
            <li key={s.airport.id} className={styles.problemItem}>
              <span className={styles.problemText}>
                <Icon name="warning" size={16} />
                <span>
                  Market shares at {s.airport.iata} · {s.airport.name} total {s.total} %, not 100. Publishing will be refused until they are fixed.
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={styles.stepNav}>
        <Button variant="secondary" onClick={onSaveDraft} loading={saving} disabled={publishing}>
          Save as draft
        </Button>
        {canPublish ? (
          <Button variant="primary" icon={<Icon name="check" size={18} />} onClick={onPublish} loading={publishing} disabled={saving || noParticipants}>
            Publish…
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Block({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className={styles.reviewBlock} aria-label={title}>
      <h3 className={styles.reviewTitle}>
        {title}
        <Button size="sm" variant="ghost" icon={<Icon name="edit" size={16} />} onClick={onEdit}>
          Edit
        </Button>
      </h3>
      {children}
    </section>
  );
}
