// 기본 API 클라이언트 설정
// 환경 변수로 baseURL 관리 (.env.development, .env.production)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/dayline/api';

export class ApiError extends Error {
  status?: number;
  errorCode?: string;

  constructor(
    message: string,
    status?: number,
    errorCode?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.reason || errorData.error || '요청을 처리하는 도중 문제가 발생했습니다.',
        response.status,
        errorData.error?.errorCode || errorData.error
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      '네트워크 연결을 확인해주세요.',
      undefined,
      'NETWORK_ERROR'
    );
  }
}
