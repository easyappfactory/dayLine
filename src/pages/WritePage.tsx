import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTextInput } from '../hooks/common/useTextInput';
import { useHasTodayDiary, DIARY_KEYS } from '../hooks/domain/diary/useDiaryData';
import { AdPromotionBottomSheet } from '../components/bottomSheets/AdPromotionBottomSheet';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { DiaryInputForm } from '../components/write/DiaryInputForm';
import { useDiarySubmit } from '../hooks/domain/diary/useDiarySubmit';
import { BannerAd } from '../components/ads/BannerAd';

export default function Page() {
  const queryClient = useQueryClient();
  const [isAdSheetOpen, setIsAdSheetOpen] = useState(false);

  // 1. 텍스트 입력 로직
  const {
    value,
    trimmedValue,
    characterCount,
    hasError,
    errorMessage,
    isSubmittable,
    handleChange,
  } = useTextInput();

  // 2. 일기 데이터 조회 로직
  const { hasTodayDiary, isLoading: isChecking } = useHasTodayDiary();

  // 3. 일기 제출 로직 (Hooks로 분리됨)
  const {
    isLoading: isSubmitting,
    handleSubmit,
    formattedDate,
    today
  } = useDiarySubmit({
    trimmedValue,
    hasTodayDiary: !!hasTodayDiary
  });

  // 페이지 진입 시 데이터 갱신�
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: DIARY_KEYS.all,
    });
  }, [queryClient, today]);

  // 작성하기 버튼 핸들러
  const handleConfirm = async () => {
    // 이미 작성된 경우 제출 프로세스로 넘겨서(Hooks 내부) 바로 이동 처리
    if (hasTodayDiary) {
      handleSubmit();
      return;
    }

    if (isSubmittable && !isSubmitting) {
      setIsAdSheetOpen(true);
    }
  };

  return (
    <>
      <LoadingOverlay isVisible={isSubmitting} />

      <DiaryInputForm
        dateText={formattedDate}
        value={value}
        onChange={handleChange}
        hasError={hasError}
        errorMessage={errorMessage}
        characterCount={characterCount}
        hasTodayDiary={hasTodayDiary}
        isSubmittable={isSubmittable}
        isLoading={isSubmitting}
        isChecking={isChecking}
        onSubmit={handleConfirm}
      />

      <BannerAd />

      <AdPromotionBottomSheet
        open={isAdSheetOpen}
        onClose={() => setIsAdSheetOpen(false)}
        onNavigate={() => {
          setIsAdSheetOpen(false);
          handleSubmit();
        }}
      />
    </>
  );
}
