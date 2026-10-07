import { useMemo } from 'react';

import { useReducedMotion } from '@/design/hooks/useReducedMotion';

import { ChartFrame } from './ChartFrame';
import { axisStyle, baseOption, ReactEChartsCore, echarts } from './echarts';
import { type ChartTokens, useChartTokens } from './tokens';

export type BarSeriesKey = 'customer' | 'self' | 'previous';

export type GroupedBarSeries = {
  name: string;
  values: (number | null)[];
  /** Which token colour the series takes: customer (accent), self (grey), previous (line). */
  key: BarSeriesKey;
};

export type GroupedBarProps = {
  categories: string[];
  series: GroupedBarSeries[];
  max?: number;
  height?: number;
  loading?: boolean;
  summary?: string;
  className?: string;
};

function seriesColor(t: ChartTokens, key: BarSeriesKey) {
  return key === 'customer' ? t.customer : key === 'self' ? t.self : t.previous;
}

/** Self vs customer grouped bars (Overall / Current / Previous …). Direct value labels, 1 dp. */
export function GroupedBar({ categories, series, max = 5, height = 260, loading, summary, className }: GroupedBarProps) {
  const t = useChartTokens();
  const reduced = useReducedMotion();
  const empty = !loading && (categories.length === 0 || series.every((s) => s.values.every((v) => v === null)));

  const option = useMemo(
    () => ({
      ...baseOption(t, reduced),
      grid: { top: 36, right: 8, bottom: 28, left: 36, containLabel: false },
      legend: { ...baseOption(t, reduced).legend, top: 0, left: 0 },
      tooltip: {
        ...baseOption(t, reduced).tooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const, shadowStyle: { color: 'rgba(107,125,130,0.08)' } },
        valueFormatter: (v: unknown) => (typeof v === 'number' ? v.toFixed(1) : '—'),
      },
      xAxis: {
        type: 'category' as const,
        data: categories,
        ...axisStyle(t),
        axisLabel: { ...axisStyle(t).axisLabel, interval: 0, hideOverlap: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        min: 0,
        max,
        interval: 1,
        ...axisStyle(t, true),
      },
      series: series.map((s) => ({
        name: s.name,
        type: 'bar' as const,
        data: s.values,
        barMaxWidth: 36,
        barGap: '12%',
        barCategoryGap: '40%',
        itemStyle: { color: seriesColor(t, s.key), borderRadius: [4, 4, 0, 0] },
        emphasis: { itemStyle: { color: seriesColor(t, s.key) } },
        label: {
          show: true,
          position: 'top' as const,
          color: t.ink2,
          fontFamily: t.fontMono,
          fontSize: 11,
          formatter: (p: { value: unknown }) => (typeof p.value === 'number' ? p.value.toFixed(1) : ''),
        },
      })),
    }),
    [t, reduced, categories, series, max],
  );

  return (
    <ChartFrame height={height} loading={loading} empty={empty} summary={summary} className={className}>
      <ReactEChartsCore echarts={echarts} option={option} notMerge style={{ height, width: '100%' }} opts={{ renderer: 'canvas' }} />
    </ChartFrame>
  );
}
