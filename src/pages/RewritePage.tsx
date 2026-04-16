import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTextInput } from '../hooks/common/useTextInput';
import { AdPromotionBottomSheet } from '../components/bottomSheets/AdPromotionBottomSheet';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { DiaryInputForm } from '../components/write/DiaryInputForm';
import { BannerAd } from '../components/ads/BannerAd';
import { useRewriteSubmit } from '../hooks/domain/diary/useRewriteSubmit';
import type { DiaryEntry } from '../types/diary';

export default function Page() {
  const location = useLocation();
  const navigate = useNavigate();
  const entry: DiaryEntry | undefined = location.state?.entry;

  useEffect(() => {
    if (!entry) {
      navigate('/stats', { replace: true });
      return;
    }

    if (!entry.diaryId) {
      alert('일기 식별자(diaryId)가 없어요. 통계 화면에서 다시 들어와주세요.');
      navigate('/stats', { replace: true });
    }
  }, [entry, navigate]);

  const [isAdSheetOpen, setIsAdSheetOpen] = useState(false);

  const {
    value,
    trimmedValue,
    characterCount,
    hasError,
    errorMessage,
    isSubmittable,
    handleChange,
  } = useTextInput(entry?.line ?? '');

  const { isLoading, handleSubmit } = useRewriteSubmit({
    trimmedValue,
    date: entry?.date ?? '',
    diaryId: entry?.diaryId,
  });

  const handleConfirm = () => {
    if (isSubmittable && !isLoading) {
      setIsAdSheetOpen(true);
    }
  };

  if (!entry) return null;
  if (!entry.diaryId) return null;

  const formattedDate = entry.date.replace(/-/g, '.');

  return (
    <>
      <LoadingOverlay isVisible={isLoading} />

      <DiaryInputForm
        dateText={formattedDate}
        value={value}
        onChange={handleChange}
        hasError={hasError}
        errorMessage={errorMessage}
        characterCount={characterCount}
        hasTodayDiary={false}
        isSubmittable={isSubmittable}
        isLoading={isLoading}
        isChecking={false}
        onSubmit={handleConfirm}
        submitLabel="수정하기"
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
