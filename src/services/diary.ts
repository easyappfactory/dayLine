import { apiRequest } from './api';
import type { DiaryEntry } from '../types/diary';
import type { SuccessResponse } from '../types/api';
import { getAnonymousKeyHash } from './tossAuth';

// 백엔드 응답 DTO
interface DiaryResDto {
  diaryId?: number;
  id?: number;
  line: string;      // 일기 내용
  score: number;     // 감정 점수
  date: string;      // YYYY-MM-DD
  description?: string; // GPT 분석 및 응원 메시지
}

// 일기 저장 요청
interface DiaryCreateRequest {
  line: string;
  score: number;
  date: string;  // YYYY-MM-DD
  description?: string; // GPT 분석 및 응원 메시지
}

/**
 * V2: targetDate 기준 최근 1년치 일기 목록 조회
 *
 * - targetDate 미입력 시 오늘 날짜
 * - 범위: targetDate가 속한 달의 11개월 전 같은 달 1일 ~ targetDate가 속한 달의 마지막 날
 */
export async function getDiaryWindowV2(targetDate?: string): Promise<{
  diaries: DiaryEntry[];
  count: number;
  targetDate: string;
}> {
  const hash = getAnonymousKeyHash();
  if (!hash) throw new Error('로그인이 필요해요. (익명 키가 없어요)');

  const query = targetDate ? `?targetDate=${encodeURIComponent(targetDate)}` : '';
  const response = await apiRequest<
    SuccessResponse<{
      diaries: DiaryResDto[];
      count: number;
      targetDate: string;
    }>
  >(`/v2/diarys${query}`, {
    method: 'GET',
    headers: {
      'X-Anonymous-Key': hash,
    },
  });

  const data = response.data ?? { diaries: [], count: 0, targetDate: targetDate ?? new Date().toISOString().slice(0, 10) };
  return {
    diaries: (data.diaries ?? []).map(dto => ({
      diaryId: dto.diaryId ?? dto.id,
      date: dto.date,
      line: dto.line,
      score: dto.score,
      description: dto.description,
    })),
    count: data.count ?? (data.diaries?.length ?? 0),
    targetDate: data.targetDate ?? (targetDate ?? new Date().toISOString().slice(0, 10)),
  };
}

/**
 * 특정 날짜의 일기 조회
 * 
 * @param date 날짜 (YYYY-MM-DD)
 * @returns 일기 데이터 또는 null
 */
export async function getDiaryByDate(date: string): Promise<DiaryEntry | null> {
  try {
    const { diaries } = await getDiaryWindowV2(date);
    const diary = diaries.find(d => d.date === date);
    if (diary) return diary;
    return null;
  } catch {
    // 에러 발생 시 null 반환
    return null;
  }
}

/**
 * 일기 작성/수정
 * 
 * @param data 일기 데이터 (date, line, score, description)
 * @returns 저장된 일기
 */
export async function saveDiary(data: {
  date: string;
  content: string;
  emotion: number;
  description?: string;
}): Promise<DiaryEntry> {
  const hash = getAnonymousKeyHash();
  if (!hash) throw new Error('로그인이 필요해요. (익명 키가 없어요)');

  // V2: POST /v2/diarys (X-Anonymous-Key)
  const requestBody: DiaryCreateRequest = {
    line: data.content,
    score: data.emotion,
    date: data.date,
    description: data.description,
  };

  await apiRequest<SuccessResponse<null>>(
    '/v2/diarys',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Anonymous-Key': hash,
      },
      body: JSON.stringify(requestBody),
    }
  );

  // 성공 응답만 오므로, 저장한 데이터를 그대로 반환
  return {
    date: data.date,
    line: data.content,
    score: data.emotion,
    description: data.description,
  };
}

/**
 * V2: 일기 수정
 * diaryId + X-Anonymous-Key로 소유권 확인 후 수정 (PATCH /v2/diarys/{diaryId})
 *
 * @param data 수정할 일기 데이터
 * @returns 수정된 일기
 */
export async function updateDiary(data: {
  diaryId: number;
  date: string;
  content: string;
  emotion: number;
  description?: string;
}): Promise<DiaryEntry> {
  const hash = getAnonymousKeyHash();
  if (!hash) throw new Error('로그인이 필요해요. (익명 키가 없어요)');

  await apiRequest<SuccessResponse<null>>(
    `/v2/diarys/${data.diaryId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Anonymous-Key': hash,
      },
      body: JSON.stringify({
        line: data.content,
        score: data.emotion,
        date: data.date,
        ...(data.description !== undefined ? { description: data.description } : {}),
      }),
    }
  );

  return {
    diaryId: data.diaryId,
    date: data.date,
    line: data.content,
    score: data.emotion,
    description: data.description,
  };
}

/**
 * 일기 삭제
 *
 * @deprecated 백엔드에서 삭제 API를 제공하지 않습니다.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteDiary(_date: string): Promise<void> {
  // TODO: 백엔드에서 삭제 API 제공 시 구현
  throw new Error('일기 삭제 기능은 현재 지원되지 않습니다.');
}

