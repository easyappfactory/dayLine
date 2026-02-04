// 일기 관련 API 서비스
// 백엔드 API 스펙 기준

import { apiRequest } from './api';
import { getUserKey } from './tossAuth';
import type { DiaryEntry } from '../types/diary';
import type { SuccessResponse } from '../types/api';

// 백엔드 응답 DTO
interface DiaryResDto {
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
 * 일기 목록 조회 (백엔드에서 월별 필터링)
 * 
 * @param year 년도 (YYYY)
 * @param month 월 (1-12)
 * @returns 일기 목록
 */
export async function getMonthlyDiaries(
  year: number,
  month: number
): Promise<DiaryEntry[]> {
  const userKey = getUserKey();
  if (!userKey) {
    throw new Error('로그인이 필요합니다.');
  }

  // 백엔드 API: GET /api/v1/scores?year={year}&month={month}
  // Authorization 헤더는 apiRequest 내부에서 처리됨 (user_key가 있을 경우)
  const response = await apiRequest<SuccessResponse<DiaryResDto[]>>(
    `/v1/scores?year=${year}&month=${month}`,
    {
      method: 'GET',
    }
  );

  // 데이터 추출
  const data = response.data || [];

  // DTO를 클라이언트 인터페이스로 변환
  const diaries: DiaryEntry[] = data.map(dto => ({
    date: dto.date,
    line: dto.line,
    score: dto.score,
    description: dto.description,
  }));

  return diaries;
}

/**
 * 특정 날짜의 일기 조회
 * 
 * @param date 날짜 (YYYY-MM-DD)
 * @returns 일기 데이터 또는 null
 */
export async function getDiaryByDate(date: string): Promise<DiaryEntry | null> {
  const userKey = getUserKey();
  if (!userKey) {
    throw new Error('로그인이 필요합니다.');
  }

  try {
    // 날짜에서 년도와 월 추출하여 해당 월의 일기 조회
    const year = parseInt(date.split('-')[0], 10);
    const month = parseInt(date.split('-')[1], 10);
    const response = await apiRequest<SuccessResponse<DiaryResDto[]>>(
      `/v1/scores?year=${year}&month=${month}`,
      {
        method: 'GET',
      }
    );

    const data = response.data || [];
    const diary = data.find(dto => dto.date === date);
    
    if (diary) {
      return {
        date: diary.date,
        line: diary.line,
        score: diary.score,
        description: diary.description,
      };
    }
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
  const userKey = getUserKey();
  if (!userKey) {
    throw new Error('로그인이 필요합니다.');
  }

  // 백엔드 API: POST /api/v1/scores
  const requestBody: DiaryCreateRequest = {
    line: data.content,
    score: data.emotion,
    date: data.date,
    description: data.description,
  };

  await apiRequest<SuccessResponse<null>>(
    '/v1/scores',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
 * 일기 삭제
 * 
 * @deprecated 백엔드에서 삭제 API를 제공하지 않습니다.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteDiary(_date: string): Promise<void> {
  // TODO: 백엔드에서 삭제 API 제공 시 구현
  throw new Error('일기 삭제 기능은 현재 지원되지 않습니다.');
}

