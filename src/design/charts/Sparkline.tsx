import { useMemo } from 'react';

import { useReducedMotion } from '@/design/hooks/useReducedMotion';

import { echarts, ReactEChartsCore } from './echarts';
import { useChartTokens } from './tokens';

export type SparklineProps = {
  values: (number | null)[];
  tone?: 'accent' | 'up' | 'down' | 'muted';
  width?: number | string;
  height?: number;
  min?: number;
  max?: number;
  /** Accessible description, e.g. "Rating over the last 4 cycles: 3.9 → 4.2". */
  label?: string;
  className?: string;
};

/** Tiny trend line with no axes; for stat tiles and table cells. */
export function Sparkline({ values, tone = 'accent', width = 96, height = 28, min, max, label, className }: SparklineProps) {
  const t = useChartTokens();
  const reduced = useReducedMotion();
  const color = tone === 'up' ? t.up : tone === 'down' ? t.down : tone === 'muted' ? t.muted : t.accent;

  const option = useMemo(
    () => ({
      animation: !reduced,
      grid: { top: 3, right: 3, bottom: 3, left: 3 },
      xAxis: { type: 'category' as const, show: false, boundaryGap: false, data: values.map((_, i) => i) },
      yAxis: { type: 'value' as const, show: false, min, max },
      tooltip: { show: false },
      series: [
        {
          type: 'line' as const,
          data: values,
          smooth: 0.3,
          showSymbol: false,
          symbol: 'circle',
          symbolSize: 5,
          connectNulls: false,
          lineStyle: { width: 2, color },
          itemStyle: { color },
          areaStyle: { color, opacity: 0.08 },
          emphasis: { disabled: true },
          markPoint: undefined,
        },
      ],
    }),
    [values, reduced, color, min, max],
  );

  if (values.length === 0) return <span className={className} style={{ display: 'inline-block', width, height }} aria-hidden="true" />;

  return (
    <span className={className} role="img" aria-label={label} style={{ display: 'inline-block', width, height, verticalAlign: 'middle' }}>
      <ReactEChartsCore echarts={echarts} option={option} notMerge style={{ width: '100%', height }} opts={{ renderer: 'canvas' }} />
    </span>
  );
}
