import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Tab, ListHeader, Text, Asset, Button, TextButton } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

import { CalendarView } from '../components/stats/CalendarView';
import { GraphView } from '../components/stats/GraphView';
import { StatsDetailView } from '../components/stats/StatsDetailView';
import { MergeDataBottomSheet } from '../components/bottomSheets';
import {
  DIARY_KEYS,
  MIGRATION_KEYS,
  useMultipleDiaryWindows,
  useRecentYearDiaries,
} from '../hooks/domain/diary/useDiaryData';
import type { DiaryEntry } from '../types/diary';

const toMonthKey = (year: number, month: number) => `${year}-${month}`;

function shiftMonth({ year, month }: { year: number; month: number }, delta: number) {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: total % 12 };
}

function endOfMonthDateString(year: number, month: number) {
  const d = new Date(year, month + 1, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function Page() {
  const queryClient = useQueryClient();
  // true면 완료 화면, false면 통계 화면을 보여줍니다.
  const [showComplete, setShowComplete] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0); // 0: 그래프, 1: 달력
  
  // 현재 날짜 기준
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  // 초기: 이번달부터 과거 1년(12개월) 범위
  const INITIAL_MONTH_COUNT = 12;
  const INITIAL_TODAY_SLIDE_INDEX = INITIAL_MONTH_COUNT - 1; // 마지막 슬라이드 = 현재 월

  // 화면에 보여줄 월 범위(오래된 월 → 현재 월). 더 과거로 스와이프하면 앞에 월을 prepend 합니다.
  const [monthRange, setMonthRange] = useState(() =>
    Array.from({ length: INITIAL_MONTH_COUNT }, (_, i) => {
      const offset = i - INITIAL_TODAY_SLIDE_INDEX; // -(INITIAL_MONTH_COUNT-1) ~ 0
      const totalMonths = todayYear * 12 + todayMonth + offset;
      return {
        year: Math.floor(totalMonths / 12),
        month: totalMonths % 12,
      };
    })
  );

  const [currentSlideIndex, setCurrentSlideIndex] = useState(INITIAL_TODAY_SLIDE_INDEX);
  const [isMergeSheetOpen, setIsMergeSheetOpen] = useState(false);
  const [graphSwiperInstance, setGraphSwiperInstance] = useState<SwiperType | null>(null);
  const [calendarSwiperInstance, setCalendarSwiperInstance] = useState<SwiperType | null>(null);

  // 1) targetDate 미지정: "이번달 기준 최근 1년" window
  const { data: baseWindow } = useRecentYearDiaries();
  const recentYearDiaries = baseWindow?.diaries ?? [];

  // 2) 더 과거로 스와이프하면 해당 월을 기준 targetDate window를 추가로 fetch
  const [extraWindowTargets, setExtraWindowTargets] = useState<string[]>([]);
  const extraWindows = useMultipleDiaryWindows(extraWindowTargets);

  // monthKey -> (date -> entry)로 중복 제거하면서 병합
  const monthEntryMap = new Map<string, Map<string, DiaryEntry>>();

  const addEntriesToMonthMap = (entries: DiaryEntry[]) => {
    for (const entry of entries) {
      const d = new Date(entry.date);
      const key = toMonthKey(d.getFullYear(), d.getMonth());
      const byDate = monthEntryMap.get(key) ?? new Map<string, DiaryEntry>();
      byDate.set(entry.date, entry);
      monthEntryMap.set(key, byDate);
    }
  };

  addEntriesToMonthMap(recentYearDiaries);
  for (const q of extraWindows) {
    addEntriesToMonthMap(q.data?.diaries ?? []);
  }

  const monthDataArray = monthRange.map(({ year, month }) => {
    const key = toMonthKey(year, month);
    const byDate = monthEntryMap.get(key);
    return byDate ? Array.from(byDate.values()) : [];
  });

  // 모든 월의 데이터를 합침 (선택된 날짜 찾기용)
  const allMonthlyData = monthDataArray.flat();

  const defaultSelectedDate =
    allMonthlyData.length > 0
      ? [...allMonthlyData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date ?? ''
      : '';

  // 사용자가 직접 선택한 날짜 (YYYY-MM-DD). 값이 없으면 defaultSelectedDate를 사용합니다.
  const [userSelectedDate, setUserSelectedDate] = useState<string>('');
  const selectedDate = userSelectedDate || defaultSelectedDate;

  // 날짜 선택 핸들러 (StatsDetailView 스와이프 포함, 월이 바뀌면 상단 그래프/달력도 동기화)
  const handleSelectDate = (date: string) => {
    setUserSelectedDate(date);

    const dateObj = new Date(date);
    const newSlideIndex = monthRange.findIndex(
      m => m.year === dateObj.getFullYear() && m.month === dateObj.getMonth()
    );

    if (newSlideIndex !== -1 && newSlideIndex !== currentSlideIndex) {
      setCurrentSlideIndex(newSlideIndex);
      graphSwiperInstance?.slideTo(newSlideIndex, 300);
      calendarSwiperInstance?.slideTo(newSlideIndex, 300);
    }
  };

  const completeScreen = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '24px',
        gap: '16px',
      }}
    >
      <Asset.Image
        frameShape={{ width: 100 }}
        src="https://static.toss.im/lotties/check-spot-apng.png"
        aria-hidden={true}
      />
      <Text
        display="block"
        color={adaptive.grey800}
        typography="t2"
        fontWeight="bold"
        textAlign="center"
      >
        오늘 한 줄 기록을 완료했어요
      </Text>
      <Text
        display="block"
        color={adaptive.grey700}
        typography="t5"
        fontWeight="regular"
        textAlign="center"
      >
        한 줄 일기와 감정 변화 그래프를 확인할 수 있어요
      </Text>
      <Button display="block" style={{ marginTop: '16px' }} onClick={() => setShowComplete(false)}>
        이동하기
      </Button>
    </div>
  );

  const statsScreen = (
    <div>
      <div style={{ flexShrink: 0 }}>
        <Tab
          fluid={false}
          size="large"
          onChange={(index: number) => setSelectedTab(index)}
        >
          <Tab.Item selected={selectedTab === 0}>
            그래프
          </Tab.Item>
          <Tab.Item selected={selectedTab === 1}>
            달력
          </Tab.Item>
        </Tab>
      </div>

      {/* 탭 하단 구분선 - 스타일 명확화 */}
      {/* <div style={{ 
        height: '1px', 
        backgroundColor: '#e5e8eb', // adaptive.grey200과 유사한 명시적 색상 (안전장치)
        width: '100%',
        minHeight: '1px' // 최소 높이 보장
      }} /> */}

      <div>
        <ListHeader 
          title={
            <ListHeader.TitleParagraph
              color={adaptive.grey800}
              fontWeight="bold"
              typography="t5"
            >
              {monthRange[currentSlideIndex]?.year}년 {(monthRange[currentSlideIndex]?.month ?? 0) + 1}월
            </ListHeader.TitleParagraph>
          }
          descriptionPosition="bottom"
          style={{ padding: '36px 0 8px' }}
        />
      </div>

      {/* 탭에 따라 다른 Swiper 렌더링 */}
      {selectedTab === 0 ? (
        <Swiper
          key="graph-swiper"
          spaceBetween={0}
          slidesPerView={1}
          initialSlide={INITIAL_TODAY_SLIDE_INDEX}
          onSwiper={setGraphSwiperInstance}
          onSlideChange={(swiper) => {
            const nextIndex = swiper.activeIndex;
            setCurrentSlideIndex(nextIndex);

            // 맨 앞(가장 오래된 월)에 닿으면 과거 월을 prepend하고, 현재 보고 있는 월이 유지되도록 인덱스를 보정
            if (nextIndex === 0) {
              const BATCH = 6;
              const baseOldest = monthRange.length > 0 ? monthRange[0] : { year: todayYear, month: todayMonth };
              const prepend = Array.from({ length: BATCH }, (_, i) => shiftMonth(baseOldest, -(BATCH - i)));
              setMonthRange(prev => [...prepend, ...prev]);

              // 가장 오래된 월을 기준으로 window를 하나 추가 fetch (겹치는 12개월을 한 번에 가져옴)
              const target = endOfMonthDateString(prepend[0].year, prepend[0].month);
              setExtraWindowTargets(prev => (prev.includes(target) ? prev : [...prev, target]));

              setCurrentSlideIndex(BATCH);
              swiper.slideTo(BATCH, 0);
            }
          }}
          style={{ height: '300px' }}
        >
          {monthRange.map((monthInfo, index) => (
            <SwiperSlide key={`${monthInfo.year}-${monthInfo.month}`}>
              <GraphView
                year={monthInfo.year}
                month={monthInfo.month}
                data={monthDataArray[index]}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <Swiper
          key="calendar-swiper"
          spaceBetween={0}
          slidesPerView={1}
          initialSlide={INITIAL_TODAY_SLIDE_INDEX}
          onSwiper={setCalendarSwiperInstance}
          onSlideChange={(swiper) => {
            const nextIndex = swiper.activeIndex;
            setCurrentSlideIndex(nextIndex);

            if (nextIndex === 0) {
              const BATCH = 6;
              const baseOldest = monthRange.length > 0 ? monthRange[0] : { year: todayYear, month: todayMonth };
              const prepend = Array.from({ length: BATCH }, (_, i) => shiftMonth(baseOldest, -(BATCH - i)));
              setMonthRange(prev => [...prepend, ...prev]);

              const target = endOfMonthDateString(prepend[0].year, prepend[0].month);
              setExtraWindowTargets(prev => (prev.includes(target) ? prev : [...prev, target]));

              setCurrentSlideIndex(BATCH);
              swiper.slideTo(BATCH, 0);
            }
          }}
          style={{ height: '300px' }}
        >
          {monthRange.map((monthInfo, index) => (
            <SwiperSlide key={`${monthInfo.year}-${monthInfo.month}`}>
              <CalendarView
                year={monthInfo.year}
                month={monthInfo.month}
                data={monthDataArray[index]}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* 마이그레이션 CTA: 그래프/달력 바로 아래 */}
      <div style={{ padding: 0, textAlign: 'center' }}>
        <TextButton
          size="xsmall"
          variant="underline"
          onClick={() => setIsMergeSheetOpen(true)}
        >
          기존 일기가 보이지 않나요?
        </TextButton>
      </div>

      <StatsDetailView
        allEntries={allMonthlyData}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
      />
    </div>
  );

  return (
    <>
      {showComplete ? completeScreen : statsScreen}

      <MergeDataBottomSheet
        open={isMergeSheetOpen}
        onClose={() => setIsMergeSheetOpen(false)}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: MIGRATION_KEYS.all });
          void queryClient.invalidateQueries({ queryKey: DIARY_KEYS.all });
        }}
      />
    </>
  );
}
