import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateDiary } from './useDiaryData';
import { analyzeDiaryText } from '../../../services/gpt';
import { useAdMob } from '../../common/useAdMob';

interface UseRewriteSubmitProps {
  trimmedValue: string;
  date: string; // 수정할 일기의 날짜 (YYYY-MM-DD)
  diaryId?: number;
}

export const useRewriteSubmit = ({ trimmedValue, date, diaryId }: UseRewriteSubmitProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { showAd } = useAdMob({
    adGroupId: 'ait.v2.live.8be900a4b263458c',
    shouldLoad: true,
  });

  const { mutateAsync: updateDiaryMutation } = useUpdateDiary();

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // 광고 시청 + GPT 재분석 + 백엔드 저장을 병렬로 실행 (작성과 완벽히 동일한 로직)
      await Promise.all([
        showAd(),
        (async () => {
          const gptResponse = await analyzeDiaryText(trimmedValue);

          if (!gptResponse || !gptResponse.line || typeof gptResponse.score !== 'number') {
            throw new Error('GPT 응답이 올바르지 않습니다.');
          }

          // TODO: 백엔드 API path 확정 시 수정 (PUT /v1/scores/:id)
          if (!diaryId) {
            throw new Error('수정할 일기의 식별자(diaryId)가 없어요. 최신 목록을 다시 불러와주세요.');
          }
          await updateDiaryMutation({
            diaryId,
            date,
            content: gptResponse.line,
            emotion: gptResponse.score,
            description: gptResponse.description,
          });
        })(),
      ]);

      navigate('/stats', { state: { skipComplete: true } });
    } catch (error) {
      console.error('수정 중 에러 발생:', error);

      if (error instanceof Error) {
        if (error.message.includes('로그인')) {
          alert('로그인이 필요해요.');
        } else if (error.message.includes('GPT')) {
          alert('일기 분석에 실패했어요. 다시 시도해주세요.');
        } else if (error.message.includes('네트워크')) {
          alert('네트워크 연결을 확인해주세요.');
        } else {
          alert('저장에 실패했어요. 다시 시도해주세요.');
        }
      } else {
        alert('알 수 없는 오류가 있어요. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleSubmit };
};
