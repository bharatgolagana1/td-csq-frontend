import { useMemo } from 'react';

import { useReducedMotion } from '@/design/hooks/useReducedMotion';

import { ChartFrame, LegendDot } from './ChartFrame';
import { baseOption, echarts, ReactEChartsCore } from './echarts';
import { ratingColor, useChartTokens } from './tokens';

export type DonutSlice = {
  /** 5 = Excellent … 1 = Poor, null = NA. Picks the ramp colour. */
  rating: 1 | 2 | 3 | 4 | 5 | null;
  label: string;
  count: number;
  pct?: number;
};

export type DonutProps = {
  slices: DonutSlice[];
  centreValue: string;
  centreLabel?: string;
  height?: number;
  loading?: boolean;
  summary?: string;
  className?: string;
};

/** Feedback distribution: five bands + NA, count and % (§7), centre value in mono. */
export function Donut({ slices, centreValue, centreLabel, height = 260, loading, summary, className }: DonutProps) {
  const t = useChartTokens();
  const reduced = useReducedMotion();
  const total = slices.reduce((a, s) => a + s.count, 0);
  const empty = !loading && total === 0;

  const option = useMemo(
    () => ({
      ...baseOption(t, reduced),
      tooltip: {
        ...baseOption(t, reduced).tooltip,
        trigger: 'item' as const,
        formatter: (p: { name: string; value: number; percent: number }) => `${p.name}  ${p.value} · ${p.percent.toFixed(0)} %`,
      },
      legend: { show: false },
      series: [
        {
          type: 'pie' as const,
          radius: ['62%', '86%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          padAngle: 2,
          itemStyle: { borderRadius: 3, borderColor: t.surface, borderWidth: 2 },
          label: { show: false },
          labelLine: { show: false },
          emphasis: { scale: false, itemStyle: { opacity: 0.85 } },
          data: slices.map((s) => ({ name: s.label, value: s.count, itemStyle: { color: ratingColor(t, s.rating) } })),
        },
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: centreLabel ? `${centreValue}\n${centreLabel}` : centreValue,
            textAlign: 'center',
            fill: t.ink,
            fontFamily: t.fontMono,
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 26,
            rich: {},
          },
        },
      ],
    }),
    [t, reduced, slices, centreValue, centreLabel],
  );

  const legend = (
    <>
      {slices.map((s) => (
        <LegendDot
          key={s.label}
          color={ratingColor(t, s.rating)}
          label={
            <>
              {s.label} <span className="num">{s.count}</span>
              <span className="num" style={{ color: 'var(--muted)' }}>
                {' '}
                · {(s.pct ?? (total ? (s.count / total) * 100 : 0)).toFixed(0)} %
              </span>
            </>
          }
        />
      ))}
    </>
  );

  return (
    <ChartFrame height={height} loading={loading} empty={empty} summary={summary} legend={legend} className={className}>
      <ReactEChartsCore echarts={echarts} option={option} notMerge style={{ height, width: '100%' }} opts={{ renderer: 'canvas' }} />
    </ChartFrame>
  );
}
