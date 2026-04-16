import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDiaryWindowV2, saveDiary, updateDiary } from '../../../services/diary';
import { getMigrationStatusMapped } from '../../../services/migration';
import { getAnonymousKeyHash } from '../../../services/tossAuth';
import { formatDate } from '../../../utils/dateUtils';
import type { DiaryEntry } from '../../../types/diary';

// React Query 키 관리
export const DIARY_KEYS = {
  all: ['diaries'] as const,
  window: (targetDate?: string) => [...DIARY_KEYS.all, 'window', targetDate ?? 'today'] as const,
};

export const MIGRATION_KEYS = {
  all: ['migration'] as const,
  status: (hash: string) => [...MIGRATION_KEYS.all, 'status', hash] as const,
};

/**
 * V2: targetDate 기준 최근 1년치 일기 데이터를 가져오는 훅
 */
export const useDiaryWindow = (targetDate?: string) => {
  return useQuery({
    queryKey: DIARY_KEYS.window(targetDate),
    queryFn: async () => await getDiaryWindowV2(targetDate),
    staleTime: 1000 * 60 * 5, // 5분간 fresh 유지
  });
};

/**
 * 오늘 날짜의 일기가 존재하는지 확인하는 훅
 */
export const useHasTodayDiary = () => {
  const today = new Date();
  const todayStr = formatDate(today, '-');

  const { data, isLoading } = useDiaryWindow();

  // 일기 목록 중 오늘 날짜와 일치하는 것이 있는지 확인
  const hasTodayDiary = data?.diaries?.some((diary: DiaryEntry) => diary.date === todayStr) ?? false;

  return { hasTodayDiary, isLoading };
};

/**
 * 여러 targetDate window를 병렬로 가져오는 훅
 */
export const useMultipleDiaryWindows = (targetDates: string[]) => {
  return useQueries({
    queries: targetDates.map((targetDate) => ({
      queryKey: DIARY_KEYS.window(targetDate),
      queryFn: async () => await getDiaryWindowV2(targetDate),
      staleTime: 1000 * 60 * 5,
    })),
  });
};

/**
 * 최근 1년치 일기 데이터를 가져오는 훅 (targetDate 미입력)
 */
export const useRecentYearDiaries = () => useDiaryWindow();

/**
 * V1→V2 마이그레이션 매핑 여부 (hash 기준). true면 매핑 완료 또는 신규로 병합 불필요.
 */
export const useMigrationMapped = () => {
  const hash = getAnonymousKeyHash();

  return useQuery({
    queryKey: hash ? MIGRATION_KEYS.status(hash) : [...MIGRATION_KEYS.all, 'status', 'none'],
    queryFn: async () => await getMigrationStatusMapped(hash!),
    enabled: Boolean(hash),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
};

/**
 * 일기 저장 훅
 */
export const useSaveDiary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveDiary,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DIARY_KEYS.all });
    },
  });
};

/**
 * 일기 수정 훅 (TanStack Query Mutation)
 */
export const useUpdateDiary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDiary,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DIARY_KEYS.all });
    },
  });
};

