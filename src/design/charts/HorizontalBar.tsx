import { useMemo } from 'react';

import { useReducedMotion } from '@/design/hooks/useReducedMotion';

import { ChartFrame, LegendDot } from './ChartFrame';
import { axisStyle, baseOption, echarts, ReactEChartsCore } from './echarts';
import { useChartTokens } from './tokens';

export type HorizontalBarRow = {
  id: string;
  label: string;
  value: number | null;
  /** Shown in the tooltip under the label. */
  sublabel?: string;
};

export type HorizontalBarProps = {
  rows: HorizontalBarRow[];
  /** Emphasis: this row takes the accent, the rest the de-emphasis grey. Without it every bar is accent. */
  highlightId?: string;
  highlightLabel?: string;
  min?: number;
  max?: number;
  format?: (v: number) => string;
  rowHeight?: number;
  loading?: boolean;
  provisional?: boolean;
  summary?: string;
  className?: string;
};

/** One series, horizontal, value at the tip of every bar (so no axis ticks); ranked lists and category averages. */
export function HorizontalBar({
  rows,
  highlightId,
  highlightLabel = 'Yours',
  min = 0,
  max = 5,
  format = (v) => v.toFixed(1),
  rowHeight = 30,
  loading,
  provisional,
  summary,
  className,
}: HorizontalBarProps) {
  const t = useChartTokens();
  const reduced = useReducedMotion();
  const height = Math.max(96, rows.length * rowHeight + 16);
  const empty = !loading && (rows.length === 0 || rows.every((r) => r.value === null));
  const emphasis = Boolean(highlightId) && rows.some((r) => r.id === highlightId);

  const option = useMemo(
    () => ({
      ...baseOption(t, reduced),
      grid: { top: 4, right: 56, bottom: 4, left: 8, containLabel: true },
      tooltip: {
        ...baseOption(t, reduced).tooltip,
        trigger: 'item' as const,
        formatter: (p: { dataIndex: number }) => {
          const r = rows[p.dataIndex];
          if (!r) return '';
          return `${r.label}${r.sublabel ? `<br/>${r.sublabel}` : ''}<br/>${r.value === null ? '—' : format(r.value)}`;
        },
      },
      xAxis: { type: 'value' as const, min, max, show: false },
      yAxis: {
        type: 'category' as const,
        data: rows.map((r) => r.label),
        inverse: true,
        ...axisStyle(t),
        splitLine: { show: false },
        axisLabel: { ...axisStyle(t).axisLabel, color: t.ink2, width: 150, overflow: 'truncate' as const, interval: 0 },
      },
      series: [
        {
          type: 'bar' as const,
          data: rows.map((r) => ({
            value: r.value,
            itemStyle: { color: emphasis && r.id !== highlightId ? t.self : t.customer, borderRadius: [0, 4, 4, 0] },
          })),
          barMaxWidth: 16,
          barCategoryGap: '40%',
          emphasis: { itemStyle: { opacity: 0.85 } },
          label: {
            show: true,
            position: 'right' as const,
            color: t.ink2,
            fontFamily: t.fontMono,
            fontSize: 11,
            formatter: (p: { value: unknown }) => (typeof p.value === 'number' ? format(p.value) : '—'),
          },
        },
      ],
    }),
    [t, reduced, rows, min, max, format, emphasis, highlightId],
  );

  const legend = emphasis ? (
    <>
      <LegendDot color={t.customer} label={highlightLabel} />
      <LegendDot color={t.self} label="Others" />
    </>
  ) : undefined;

  return (
    <ChartFrame height={height} loading={loading} empty={empty} provisional={provisional} summary={summary} legend={legend} className={className}>
      <ReactEChartsCore echarts={echarts} option={option} notMerge style={{ height, width: '100%' }} opts={{ renderer: 'canvas' }} />
    </ChartFrame>
  );
}
