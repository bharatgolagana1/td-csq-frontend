import ReactEChartsCore from 'echarts-for-react/lib/core';
import { BarChart, CustomChart, LineChart, PieChart } from 'echarts/charts';
import { GraphicComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

import { type ChartTokens } from './tokens';

echarts.use([BarChart, PieChart, LineChart, CustomChart, GridComponent, TooltipComponent, LegendComponent, GraphicComponent, CanvasRenderer]);

export { echarts, ReactEChartsCore };

/** Shared pieces of the single CSQ chart theme (ARCHITECTURE §3: axis in muted ink, numbers in mono). */
export function baseOption(t: ChartTokens, reducedMotion: boolean) {
  return {
    animation: !reducedMotion,
    animationDuration: 400,
    animationEasing: 'cubicOut' as const,
    textStyle: { fontFamily: t.fontBody, color: t.ink2 },
    tooltip: {
      backgroundColor: t.ink,
      borderWidth: 0,
      padding: [6, 10],
      textStyle: { color: t.surface, fontFamily: t.fontMono, fontSize: 12 },
      extraCssText: 'box-shadow: 0 8px 24px rgba(12,20,22,.18); border-radius: 6px;',
    },
    legend: {
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 16,
      textStyle: { color: t.ink2, fontSize: 12, fontFamily: t.fontBody },
    },
  };
}

export function axisStyle(t: ChartTokens, mono = false) {
  return {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: t.muted, fontSize: 12, fontFamily: mono ? t.fontMono : t.fontBody },
    splitLine: { lineStyle: { color: t.grid, width: 1 } },
  };
}
