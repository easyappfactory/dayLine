import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Dot,
} from 'recharts';
import { colors } from '@toss/tds-colors';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import type { ChartConfig } from '../ui/chart';
import type { DiaryEntry } from '../../types/diary';
import { isSameMonth } from '../../utils/dateUtils';

interface GraphViewProps {
  year: number;
  month: number;
  data: DiaryEntry[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const chartConfig: ChartConfig = {
  score: {
    label: '감정 점수',
    color: colors.blue500,
  },
};

export const GraphView = ({ year, month, data, selectedDate, onSelectDate }: GraphViewProps) => {
  const chartData = useMemo(() => {
    return data
      .filter(d => isSameMonth(d.date, year, month))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(d => ({
        day: new Date(d.date).getDate(),
        score: d.score,
        date: d.date,
      }));
  }, [data, year, month]);

  return (
    <ChartContainer
      config={chartConfig}
      style={{
        width: '100%',
        height: '300px',
        padding: '0 8px',
        // 드래그 시 텍스트 선택(하이라이트) 방지
        userSelect: 'none',
        WebkitUserSelect: 'none',
        // iOS/Android WebView에서 길게 눌러 선택/콜아웃 방지
        WebkitTouchCallout: 'none',
        // 터치 드래그가 스크롤/선택으로 해석되지 않도록 힌트
        touchAction: 'manipulation',
      }}
      onPointerDown={(e) => {
        // 그래프 영역 드래그가 "선택"으로 처리되는 현상 방지
        e.preventDefault();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
      }}
    >
      <LineChart
        data={chartData}
        margin={{ top: 12, right: 16, left: -16, bottom: 4 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="rgba(0,0,0,0.08)"
        />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const entry = payload?.[0]?.payload;
                if (!entry) return '';
                return `${year}.${month + 1}.${entry.day}`;
              }}
              nameKey="score"
            />
          }
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke={colors.blue500}
          strokeWidth={2}
          dot={(props) => {
            const { cx, cy, payload } = props;
            const isSelected = selectedDate === payload.date;
            return (
              <g key={payload.date}>
                {/* 실제로 보이는 점 */}
                <Dot
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? colors.blue700 : colors.blue500}
                  stroke={isSelected ? '#fff' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                />
                {/* 터치 히트 영역 */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={14}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectDate(payload.date)}
                />
              </g>
            );
          }}
          activeDot={false}
        />
      </LineChart>
    </ChartContainer>
  );
};
