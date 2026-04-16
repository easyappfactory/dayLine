import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { ListHeader, Text, Badge, IconButton } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import type { DiaryEntry } from '../../types/diary';

interface StatsDetailViewProps {
  allEntries: DiaryEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const getBadgeColor = (score: number): 'red' | 'yellow' | 'green' | 'blue' => {
  if (score <= 30) return 'red';
  if (score <= 50) return 'yellow';
  if (score <= 70) return 'green';
  return 'blue';
};

export const StatsDetailView = ({ allEntries, selectedDate, onSelectDate }: StatsDetailViewProps) => {
  const navigate = useNavigate();
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  // 날짜 오름차순 정렬 (오래된 날짜가 왼쪽)
  const sortedEntries = useMemo(
    () => [...allEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [allEntries]
  );

  const currentIndex = sortedEntries.findIndex(e => e.date === selectedDate);
  const initialIndex = Math.max(0, currentIndex);

  // 달력/그래프에서 날짜가 바뀌면 다이어리 Swiper도 해당 슬라이드로 이동
  useEffect(() => {
    if (!swiperInstance || currentIndex === -1) return;
    if (swiperInstance.activeIndex !== currentIndex) {
      swiperInstance.slideTo(currentIndex, 300);
    }
  }, [selectedDate, currentIndex, swiperInstance]);

  if (sortedEntries.length === 0) {
    return (
      <div style={{ padding: '0 24px', marginTop: '24px' }}>
        <Text typography="t5" color={adaptive.grey500}>
          한 줄 일기가 없습니다.
        </Text>
      </div>
    );
  }

  return (
    <Swiper
      onSwiper={setSwiperInstance}
      initialSlide={initialIndex}
      spaceBetween={0}
      slidesPerView={1}
      onSlideChange={(swiper) => {
        const entry = sortedEntries[swiper.activeIndex];
        // 외부에서 이미 같은 날짜로 설정된 경우 중복 호출 방지
        if (entry && entry.date !== selectedDate) {
          onSelectDate(entry.date);
        }
      }}
    >
      {sortedEntries.map(entry => {
        const formattedDate = entry.date.replace(/-/g, '.');
        return (
          <SwiperSlide key={entry.date}>
            <div>
              <ListHeader
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',}}>
                    <ListHeader.TitleParagraph
                      color={adaptive.grey800}
                      fontWeight="bold"
                      typography="t5"
                    >
                      {formattedDate} 한 줄
                    </ListHeader.TitleParagraph>
                    <IconButton
                      src="https://static.toss.im/icons/svg/icon-pencil-blue.svg"
                      aria-label="일기 수정"
                      iconSize={20}
                      color={adaptive.grey500}
                      onClick={() => navigate('/rewrite', { state: { entry } })}
                    />
                  </div>
                }
                descriptionPosition="bottom"
                style={{ padding: '24px 0 16px' }}
              />

              <div style={{ marginBottom: '16px', display: 'flex', padding: '0 24px' }}>
                <Badge variant="weak" color={getBadgeColor(entry.score)} size="medium">
                  + {entry.score}
                </Badge>
              </div>

              <Text
                display="block"
                color={adaptive.grey800}
                typography="t5"
                fontWeight="medium"
                style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', padding: '0 24px', textAlign: 'left' }}
              >
                {entry.line}
              </Text>

              {entry.description && (
                <div style={{
                  margin: '20px 24px 0',
                  padding: '16px',
                  backgroundColor: adaptive.grey50,
                  borderRadius: '12px',
                  border: `1px solid ${adaptive.grey100}`,
                }}>
                  <Text
                    display="block"
                    color={adaptive.grey600}
                    typography="t7"
                    fontWeight="semibold"
                    style={{ marginBottom: '8px', textAlign: 'left' }}
                  >
                    💡 오늘의 한마디
                  </Text>
                  <Text
                    display="block"
                    color={adaptive.grey500}
                    typography="t7"
                    fontWeight="regular"
                    style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', textAlign: 'left' }}
                  >
                    {entry.description}
                  </Text>
                </div>
              )}
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
};
