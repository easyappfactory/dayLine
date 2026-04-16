export interface DiaryEntry {
  /**
   * V2 API에서 일기 수정에 필요한 식별자
   * (백엔드 응답 필드명이 diaryId/id 중 무엇이든 올 수 있어 optional로 둡니다)
   */
  diaryId?: number;
  line: string;
  score: number;
  date: string;
  description?: string; // GPT의 분석 및 응원 메시지
}


