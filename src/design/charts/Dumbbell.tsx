import { useMemo } from 'react';

import { useReducedMotion } from '@/design/hooks/useReducedMotion';

import { ChartFrame, LegendDot } from './ChartFrame';
import { axisStyle, baseOption, echarts, ReactEChartsCore } from './echarts';
import { useChartTokens } from './tokens';

export type DumbbellRow = {
  label: string;
  self: number | null;
  customer: number | null;
};

export type DumbbellProps = {
  rows: DumbbellRow[];
  min?: number;
  max?: number;
  rowHeight?: number;
  loading?: boolean;
  provisional?: boolean;
  summary?: string;
  className?: string;
};

type RenderParams = { dataIndex: number };
type RenderApi = { value: (i: number) => number | string; coord: (v: [number, number]) => [number, number] };

/** Self vs customer per category: a line between two dots, one row per category. */
export function Dumbbell({ rows, min = 1, max = 5, rowHeight = 36, loading, provisional, summary, className }: DumbbellProps) {
  const t = useChartTokens();
  const reduced = useReducedMotion();
  const height = Math.max(120, rows.length * rowHeight + 48);
  const empty = !loading && (rows.length === 0 || rows.every((r) => r.self === null && r.customer === null));

  const option = useMemo(() => {
    const data = rows.map((r, i) => [i, r.self, r.customer] as [number, number | null, number | null]);
    return {
      ...baseOption(t, reduced),
      grid: { top: 8, right: 24, bottom: 28, left: 8, containLabel: true },
      tooltip: {
        ...baseOption(t, reduced).tooltip,
        trigger: 'item' as const,
        formatter: (p: { dataIndex: number }) => {
          const r = rows[p.dataIndex];
          if (!r) return '';
          return `${r.label}<br/>Customer ${r.customer === null ? '—' : r.customer.toFixed(1)}<br/>Self ${r.self === null ? '—' : r.self.toFixed(1)}`;
        },
      },
      xAxis: { type: 'value' as const, min, max, interval: 1, ...axisStyle(t, true) },
      yAxis: {
        type: 'category' as const,
        data: rows.map((r) => r.label),
        inverse: true,
        ...axisStyle(t),
        splitLine: { show: false },
        axisLabel: { ...axisStyle(t).axisLabel, color: t.ink2, width: 160, overflow: 'truncate' as const },
      },
      series: [
        {
          type: 'custom' as const,
          encode: { x: [1, 2], y: 0 },
          data,
          renderItem: (_params: RenderParams, api: RenderApi) => {
            const y = Number(api.value(0));
            const self = api.value(1);
            const customer = api.value(2);
            const children: object[] = [];
            const hasSelf = typeof self === 'number' && !Number.isNaN(self);
            const hasCustomer = typeof customer === 'number' && !Number.isNaN(customer);
            if (hasSelf && hasCustomer) {
              const [x1, cy] = api.coord([self, y]);
              const [x2] = api.coord([customer, y]);
              children.push({ type: 'line', shape: { x1, y1: cy, x2, y2: cy }, style: { stroke: t.previous, lineWidth: 2 } });
            }
            if (hasSelf) {
              const [cx, cy] = api.coord([self, y]);
              children.push({ type: 'circle', shape: { cx, cy, r: 5 }, style: { fill: t.selfStrong, stroke: t.surface, lineWidth: 2 } });
            }
            if (hasCustomer) {
              const [cx, cy] = api.coord([customer, y]);
              children.push({ type: 'circle', shape: { cx, cy, r: 6 }, style: { fill: t.customer, stroke: t.surface, lineWidth: 2 } });
              // Label on the side away from the self dot so the two never collide.
              const left = hasSelf && self > customer;
              children.push({
                type: 'text',
                style: {
                  x: left ? cx - 11 : cx + 11,
                  y: cy,
                  text: customer.toFixed(1),
                  fill: t.ink2,
                  fontFamily: t.fontMono,
                  fontSize: 11,
                  align: left ? 'right' : 'left',
                  verticalAlign: 'middle',
                },
              });
            }
            return { type: 'group', children };
          },
        },
      ],
    };
  }, [t, reduced, rows, min, max]);

  const legend = (
    <>
      <LegendDot color={t.customer} label="Customer" />
      <LegendDot color={t.selfStrong} label="Self" />
    </>
  );

  return (
    <ChartFrame height={height} loading={loading} empty={empty} provisional={provisional} summary={summary} legend={legend} className={className}>
      <ReactEChartsCore echarts={echarts} option={option} notMerge style={{ height, width: '100%' }} opts={{ renderer: 'canvas' }} />
    </ChartFrame>
  );
}
