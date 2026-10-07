import { useState } from 'react';

import { Calendar, type CalendarMarkers, DatePicker, DateRangePicker, type DateRangePreset, DateTimeInput } from '@/design/primitives';
import { addDays, type DateRange, type IsoDate, todayIso, type YearMonth } from '@/lib/date';

import styles from '../gallery.module.css';
import { Section, Sub } from '../Section';
import local from './DatesSection.module.css';

const TZ = 'Asia/Kolkata';
const TODAY = todayIso(TZ);

const MARKERS: CalendarMarkers = {
  [addDays(TODAY, 2)]: [{ label: 'Team bonding', tone: 'warn' }],
  [addDays(TODAY, 8)]: [{ label: 'Sampling closes', tone: 'accent' }, { label: 'Reminder 3 of 3', tone: 'info' }, { label: 'Lock deadline' }],
  [addDays(TODAY, 15)]: [{ label: 'Assessment opens', tone: 'info' }],
  [addDays(TODAY, 21)]: [{ label: 'Public holiday', tone: 'neutral' }],
};

const PRESETS: DateRangePreset[] = [
  { label: 'Next 10 days', range: { start: TODAY, end: addDays(TODAY, 9) } },
  { label: 'Next 30 days', range: { start: TODAY, end: addDays(TODAY, 29) } },
  { label: 'Next 90 days', range: { start: TODAY, end: addDays(TODAY, 89) } },
];

const isWeekend = (iso: IsoDate) => {
  const d = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return d === 0 || d === 6;
};

export function DatesSection() {
  const [month, setMonth] = useState<YearMonth>(TODAY.slice(0, 7));
  const [single, setSingle] = useState<IsoDate | null>(addDays(TODAY, 1));
  const [rangeMonth, setRangeMonth] = useState<YearMonth>(TODAY.slice(0, 7));
  const [range, setRange] = useState<DateRange>({ start: addDays(TODAY, 1), end: addDays(TODAY, 7) });
  const [picked, setPicked] = useState<IsoDate | null>(null);
  const [window, setWindow] = useState<DateRange>({ start: null, end: null });
  const [wall, setWall] = useState<string | null>(`${addDays(TODAY, 3)}T09:30`);
  const [phoneMonth, setPhoneMonth] = useState<YearMonth>(TODAY.slice(0, 7));
  const [phoneRange, setPhoneRange] = useState<DateRange>({ start: addDays(TODAY, 1), end: addDays(TODAY, 7) });

  return (
    <Section
      id="dates"
      title="Dates"
      note="Calendar (single / range, markers, min–max and a disabled rule), DatePicker and DateRangePicker (popover with a draft: Apply commits, Cancel discards; bottom sheet under 760px), DateTimeInput (date + 24 h time + zone caption). Keyboard: arrows, Home/End, PageUp/Down, Shift+PageUp/Down, Enter. Toggle the theme in the index for dark."
    >
      <Sub>Calendar — single with markers, weekends disabled, limited to the next 60 days</Sub>
      <div className={styles.grid2}>
        <div>
          <Calendar mode="single" value={single} onChange={setSingle} month={month} onMonthChange={setMonth} today={TODAY} markers={MARKERS} min={TODAY} max={addDays(TODAY, 60)} disabled={isWeekend} label="Single date" />
        </div>
        <div>
          <Sub>Range — hover previews the band</Sub>
          <Calendar mode="range" value={range} onChange={setRange} month={rangeMonth} onMonthChange={setRangeMonth} today={TODAY} label="Date range" />
        </div>
      </div>

      <Sub>Pickers</Sub>
      <div className={styles.grid}>
        <DatePicker label="Initiation date" value={picked} onChange={setPicked} tz={TZ} hint="Type a date or open the calendar" min={TODAY} markers={MARKERS} />
        <DatePicker label="Lock deadline" value={addDays(TODAY, 5)} onChange={() => undefined} error="Must be after the sampling window" required />
        <DatePicker label="Archived on" value={addDays(TODAY, -30)} onChange={() => undefined} disabled />
        <DateRangePicker label="Assessment window" value={window} onChange={setWindow} presets={PRESETS} tz={TZ} hint="Presets or pick start and end" />
      </div>
      <div className={styles.grid2}>
        <DateTimeInput label="Sampling opens" value={wall} onChange={setWall} tz={TZ} hint="Wall-clock in the cycle time zone" />
        <DateTimeInput label="Assessment closes" value={null} onChange={() => undefined} tz={TZ} error="Must be after the sampling window" required />
      </div>

      <Sub>Phone width (390px) — 44px cells; the pickers open a bottom sheet under 760px</Sub>
      <div className={local.phoneFrame}>
        <Calendar mode="range" value={phoneRange} onChange={setPhoneRange} month={phoneMonth} onMonthChange={setPhoneMonth} today={TODAY} markers={MARKERS} size="lg" label="Phone range" />
        <DateRangePicker label="Assessment window" value={window} onChange={setWindow} presets={PRESETS} tz={TZ} size="lg" />
        <DateTimeInput label="Sampling opens" value={wall} onChange={setWall} tz={TZ} />
      </div>
    </Section>
  );
}
