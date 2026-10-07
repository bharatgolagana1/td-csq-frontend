import { useState } from 'react';

import { Donut, Dumbbell, GroupedBar, RankTable, Sparkline } from '@/design/charts';
import { Card, Stat, Switch } from '@/design/primitives';

import styles from '../gallery.module.css';
import { Row, Section, Sub } from '../Section';

const CATEGORIES = ['Overall', 'Current cycle', 'Previous cycle'];

export function ChartsSection() {
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const bars = empty ? { customer: [null, null, null], self: [null, null, null] } : { customer: [4.15, 4.2, 3.9], self: [4.4, 4.5, 4.3] };

  return (
    <Section id="charts" title="Charts" note="One echarts theme bound to the tokens (read at runtime, follows dark mode). Series colours: customer = accent, self = ramp grey. Direct labels and legends everywhere; reduced motion disables animation.">
      <Row>
        <Switch checked={loading} onChange={setLoading} label="Loading" size="sm" />
        <Switch checked={empty} onChange={setEmpty} label="Empty" size="sm" />
      </Row>
      <div className={styles.grid2}>
        <Card title="Self vs customer" subtitle="Overall · current · previous">
          <GroupedBar
            categories={CATEGORIES}
            series={[
              { name: 'Customer', key: 'customer', values: bars.customer },
              { name: 'Self', key: 'self', values: bars.self },
            ]}
            loading={loading}
            summary="Customer rating 4.15 overall versus self 4.4"
          />
        </Card>
        <Card title="Feedback distribution" subtitle="128 assessments">
          <Donut
            slices={
              empty
                ? []
                : [
                    { rating: 5, label: 'Excellent', count: 41 },
                    { rating: 4, label: 'Very good', count: 52 },
                    { rating: 3, label: 'Good', count: 21 },
                    { rating: 2, label: 'Fair', count: 9 },
                    { rating: 1, label: 'Poor', count: 3 },
                    { rating: null, label: 'NA', count: 2 },
                  ]
            }
            centreValue="4.15"
            centreLabel="overall"
            loading={loading}
            summary="Feedback distribution across five bands and NA"
          />
        </Card>
        <Card title="Category ratings" subtitle="Self vs customer per category">
          <Dumbbell
            rows={
              empty
                ? []
                : [
                    { label: 'Infrastructure / Facilities', self: 4.6, customer: 4.1 },
                    { label: 'Security / Safety', self: 4.5, customer: 4.4 },
                    { label: 'Processes', self: 4.2, customer: 3.7 },
                    { label: 'Trade facilitation', self: 4.3, customer: 4.2 },
                    { label: 'Customer service', self: null, customer: 3.9 },
                  ]
            }
            loading={loading}
            summary="Category ratings, self versus customer"
          />
        </Card>
        <Card title="All-India" subtitle="Airports by weighted rating · own airport highlighted">
          <RankTable
            rows={
              empty
                ? []
                : [
                    { id: 'bom', label: 'Mumbai', sublabel: 'BOM', rating: 4.42, rank: 1, rankOf: 12, extra: '3' },
                    { id: 'blr', label: 'Bengaluru', sublabel: 'BLR', rating: 4.31, rank: 2, rankOf: 12, extra: '2' },
                    { id: 'del', label: 'Delhi', sublabel: 'DEL', rating: 4.15, rank: 3, rankOf: 12, extra: '2' },
                    { id: 'hyd', label: 'Hyderabad', sublabel: 'HYD', rating: 3.88, rank: 4, rankOf: 12, extra: '1' },
                    { id: 'maa', label: 'Chennai', sublabel: 'MAA', rating: 3.6, rank: 5, rankOf: 12, extra: '2' },
                    { id: 'ccu', label: 'Kolkata', sublabel: 'CCU', rating: null, rank: null, extra: '1' },
                  ]
            }
            highlightId="del"
            extraHeader="Operators"
            loading={loading}
          />
        </Card>
      </div>
      <Sub>Sparklines in stat tiles</Sub>
      <Card>
        <div className={styles.grid}>
          <Stat label="Rating trend" value="4.15" delta={{ value: 0.3 }} hint={<Sparkline values={[3.6, 3.8, 3.9, 3.85, 4.15]} tone="up" min={3} max={5} label="Rating over five cycles, rising" />} />
          <Stat label="Pending" value="23" delta={{ value: 4, invert: true }} hint={<Sparkline values={[40, 34, 29, 19, 23]} tone="down" label="Pending assessments over five days" />} />
          <Stat label="Completion" value="81 %" hint={<Sparkline values={[12, 30, 44, 61, 81]} label="Completion rising to 81 percent" />} />
          <Stat label="No data" value="—" hint={<Sparkline values={[]} tone="muted" />} />
        </div>
      </Card>
    </Section>
  );
}
