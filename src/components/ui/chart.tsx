/**
 * shadcn/ui Chart 컴포넌트 (Tailwind 없이 인라인 스타일로 적용)
 * 원본 소스: https://ui.shadcn.com/docs/components/chart
 */

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import type { ValueType as TooltipValueType, NameType as TooltipNameType } from 'recharts/types/component/DefaultTooltipContent';

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }
  return context;
}

function ChartContainer({
  id,
  style,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`;

  // CSS 변수로 색상 주입
  const colorVars = Object.entries(config).reduce<React.CSSProperties>(
    (acc, [key, value]) => {
      if (value.color) {
        (acc as Record<string, string>)[`--color-${key}`] = value.color;
      }
      return acc;
    },
    {}
  );

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        style={{ display: 'flex', justifyContent: 'center', fontSize: '12px', ...colorVars, ...style }}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  hideLabel = false,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<'div'> & {
    hideLabel?: boolean;
    nameKey?: string;
    labelKey?: string;
  } & Omit<
    RechartsPrimitive.DefaultTooltipContentProps<TooltipValueType, TooltipNameType>,
    'accessibilityLayer'
  >) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null;
    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? 'value'}`;
    const itemConfig = config[key];
    const value =
      !labelKey && typeof label === 'string'
        ? (config[label]?.label ?? label)
        : itemConfig?.label;

    if (labelFormatter) {
      return <div style={{ fontWeight: 500 }}>{labelFormatter(value, payload)}</div>;
    }
    if (!value) return null;
    return <div style={{ fontWeight: 500 }}>{value}</div>;
  }, [label, labelFormatter, payload, hideLabel, config, labelKey]);

  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        display: 'grid',
        minWidth: '8rem',
        gap: '6px',
        borderRadius: '8px',
        border: '1px solid rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        padding: '6px 10px',
        fontSize: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      }}
    >
      {tooltipLabel}
      <div style={{ display: 'grid', gap: '4px' }}>
        {payload
          .filter((item) => item.type !== 'none')
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`;
            const itemConfig = config[key];
            const color = item.payload?.fill ?? item.color;

            return (
              <div
                key={index}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: color ?? itemConfig?.color ?? '#3b82f6',
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: '#6b7280' }}>
                    {itemConfig?.label ?? item.name}
                  </span>
                  {item.value != null && (
                    <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                      {formatter
                        ? formatter(item.value, item.name ?? '', item, index, item.payload)
                        : typeof item.value === 'number'
                        ? item.value.toLocaleString()
                        : String(item.value)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
