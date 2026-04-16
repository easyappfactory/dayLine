import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { loginWithAnonymousKey } from '../../../services/tossAuth';
import { getDiaryWindowV2 } from '../../../services/diary';
import { DIARY_KEYS } from '../diary/useDiaryData';
import { formatDate } from '../../../utils/dateUtils';

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // 익명 키(getAnonymousKey) 기반 로그인 - 사용자 인증 불필요
      await loginWithAnonymousKey();

      console.log('익명 로그인 성공');

      // 오늘 일기 존재 여부 확인 → 라우팅 분기
      // React Query 캐시를 priming 하여 Write/Stats에서 중복 요청 방지
      let navigateTo = '/write';
      try {
        const windowData = await getDiaryWindowV2();
        queryClient.setQueryData(DIARY_KEYS.window(), windowData);

        const todayStr = formatDate(new Date(), '-');
        const hasTodayDiary = windowData?.diaries?.some(d => d.date === todayStr) ?? false;
        if (hasTodayDiary) {
          navigateTo = '/stats';
        }
      } catch (fetchError) {
        // 네트워크 오류 시 /write로 기본 이동 (입력 가능 상태)
        console.warn('[Login] 일기 조회 실패, /write로 이동:', fetchError);
      }

      navigate(navigateTo);
    } catch (error) {
      console.error('로그인 실패:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : '로그인에 실패했어요. 다시 시도해주세요.';

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleLogin, isLoading };
};
