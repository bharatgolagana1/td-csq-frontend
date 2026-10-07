import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

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
  provisional?: boolean;
  /** One quiet line under the plot. */
  note?: ReactNode;
  summary?: string;
  className?: string;
};

function seriesColor(t: ChartTokens, key: BarSeriesKey) {
  return key === 'customer' ? t.customer : key === 'self' ? t.selfStrong : t.previous;
}

/** Width of the element, tracked so category labels can wrap to their slot at any viewport. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWidth(Math.round(w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

/** Self vs customer grouped bars (Overall / Current / Previous …). Direct value labels, 1 dp; legend top-right, hairline grid. */
export function GroupedBar({ categories, series, max = 5, height = 260, loading, provisional, note, summary, className }: GroupedBarProps) {
  const t = useChartTokens();
  const reduced = useReducedMotion();
  const { ref, width } = useWidth<HTMLDivElement>();
  const empty = !loading && (categories.length === 0 || series.every((s) => s.values.every((v) => v === null)));
  // Each category label wraps inside its own slot (never into the neighbour's).
  const labelWidth = width > 0 && categories.length > 0 ? Math.max(44, Math.floor((width - 40) / categories.length) - 8) : undefined;

  const option = useMemo(
    () => ({
      ...baseOption(t, reduced),
      grid: { top: 36, right: 8, bottom: 8, left: 8, containLabel: true },
      legend: { ...baseOption(t, reduced).legend, top: 0, right: 0 },
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
        axisLabel: { ...axisStyle(t).axisLabel, interval: 0, hideOverlap: false, width: labelWidth, overflow: 'break' as const, lineHeight: 14 },
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
        barMaxWidth: 24,
        barGap: '16%',
        barCategoryGap: '44%',
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
    [t, reduced, categories, series, max, labelWidth],
  );

  return (
    <ChartFrame height={height} loading={loading} empty={empty} provisional={provisional} note={note} summary={summary} className={className}>
      <div ref={ref} style={{ width: '100%', height }}>
        <ReactEChartsCore echarts={echarts} option={option} notMerge style={{ height, width: '100%' }} opts={{ renderer: 'canvas' }} />
      </div>
    </ChartFrame>
  );
}
