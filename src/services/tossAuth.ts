// 토스 로그인 API 서비스
import { appLogin, getAnonymousKey } from '@apps-in-toss/web-framework';
import type {
  TossLoginRequest,
  TossLoginData,
} from '../types/tossAuth';
import { getMigrationStatusMapped } from './migration';

/**
 * 토스 앱 환경인지 확인
 */
function isTossAppEnvironment(): boolean {
  return typeof window !== 'undefined' && 
    'ReactNativeWebView' in window;
}

function isLocalGraniteEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { __CONSTANT_HANDLER_MAP?: Record<string, unknown> };
  return w.__CONSTANT_HANDLER_MAP?.deploymentId === 'local' || import.meta.env.DEV;
}

export function saveAnonymousKeyHash(hash: string) {
  localStorage.setItem('anonymous_key', hash);
}

export function getAnonymousKeyHash(): string | null {
  return localStorage.getItem('anonymous_key');
}

function parsePositiveUserKey(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === 'string') {
    const n = Number(value.trim().replace(/^Bearer\s+/i, ''));
    if (Number.isFinite(n) && n > 0) return Math.trunc(n);
  }
  return null;
}

/**
 * Toss 로그인 응답 본문에서 userKey 추출 (백엔드 스키마 변형 대응)
 */
function extractUserKeyFromJsonBody(body: unknown): number | null {
  if (body === null || body === undefined) return null;

  const direct = parsePositiveUserKey(body);
  if (direct !== null) return direct;

  if (typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;

  const nestedData = o.data;
  const candidates: unknown[] = [
    o.userKey,
    o.user_key,
    nestedData,
  ];

  if (nestedData !== null && typeof nestedData === 'object') {
    const d = nestedData as Record<string, unknown>;
    candidates.push(d.userKey, d.user_key);
  }

  for (const c of candidates) {
    const n = parsePositiveUserKey(c);
    if (n !== null) return n;
  }

  if (typeof nestedData === 'string') {
    const t = nestedData.trim();
    if (/^\d+$/.test(t)) return parsePositiveUserKey(t);
    try {
      return extractUserKeyFromJsonBody(JSON.parse(nestedData));
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * 응답 헤더 Authorization(또는 authorization)에서 userKey 추출.
 * 주의: CORS 환경에서는 서버가 Access-Control-Expose-Headers에 해당 헤더를 넣지 않으면
 * 브라우저가 헤더 값을 JS에 노출하지 않아 항상 null이 될 수 있습니다.
 */
function extractUserKeyFromResponseHeaders(response: Response): number | null {
  const raw =
    response.headers.get('Authorization') ??
    response.headers.get('authorization');
  if (!raw) return null;
  return parsePositiveUserKey(raw);
}

/**
 * Step 1: 토스 앱에서 인가 코드 받기
 * SDK를 통해 사용자 인증을 요청하고 인가 코드를 받습니다.
 */
export async function getTossAuthorizationCode(): Promise<{ authorizationCode: string; referrer: string }> {
  console.log('[Step 1] 인가 코드 받기 시작');
  
  // 브라우저 환경에서는 목 데이터 반환 (개발용)
  if (!isTossAppEnvironment()) {
    console.warn(' 브라우저 환경입니다. 토스 앱에서만 실제 로그인이 가능합니다.');
    console.log(' 개발 모드: 목(mock) 인가 코드를 반환합니다.');
    
    return {
      authorizationCode: 'MOCK_AUTH_CODE_FOR_DEVELOPMENT',
      referrer: 'SANDBOX',
    };
  }
  
  try {
    console.log(' 토스 앱 로그인 창을 엽니다...');
    
    const result = await appLogin();
    
    console.log('인가 코드 받기 성공', {
      referrer: result.referrer,
      codeLength: result.authorizationCode.length,
    });
    
    return {
      authorizationCode: result.authorizationCode,
      referrer: result.referrer,
    };
  } catch (error) {
    console.error(' [Step 1] 토스 로그인 실패:', error);
    throw new Error('토스 로그인에 실패했습니다.');
  }
}

/**
 * Step 2: 백엔드 로그인 요청
 * 인가 코드를 백엔드로 전송하여 로그인을 완료합니다.
 * 
 * [중요] userKey 획득 전략
 * 1. 응답 Body(DTO)의 data 필드 확인 (권장)
 * 2. 응답 Header의 Authorization 필드 확인 (fallback)
 */
export async function loginToBackend(
  authorizationCode: string,
  referrer: string
): Promise<TossLoginData> {
  console.log('[Step 2] 백엔드 로그인 요청 시작', { referrer });

  const requestBody: TossLoginRequest = {
    authorizationCode,
    referrer,
  };

  try {
    // Response 헤더를 확인하기 위해 fetch를 직접 사용
    // apiRequest는 헤더 접근이 제한되므로 여기서는 fetch 직접 사용 유지
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/dayline/api';
    const fullUrl = `${API_BASE_URL}/v1/auth/toss/login`;
    
    // [디버깅] 요청 정보 확인
    // alert(`[백엔드 요청 시작]\nURL: ${fullUrl}\nMethod: POST\nReferrer: ${referrer}`);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    // [디버깅] 응답 상태 확인
    // alert(`[백엔드 응답]\nStatus: ${response.status}\nStatusText: ${response.statusText}\nOK: ${response.ok}`);

    if (!response.ok) {
      const errorText = await response.text();
      
      // [디버깅] 백엔드 에러 내용 확인
      // alert(`[백엔드 에러]\nStatus: ${response.status}\nError: ${errorText.slice(0, 200)}`);
      
      let message = '로그인에 실패했습니다.';
      try {
        const errorData = JSON.parse(errorText || '{}');
        message = errorData.message || message;
      } catch {
        // JSON 파싱 실패 시 (예: "Invalid CORS request" 텍스트만 온 경우)
        if (errorText) message = errorText;
      }
      throw new Error(message);
    }

    const body: unknown = await response.json();

    console.log('[DEBUG] 백엔드 응답 Body:', body);

    const fromBody = extractUserKeyFromJsonBody(body);
    if (fromBody !== null) {
      console.log('[Step 2] Body에서 userKey 획득:', fromBody);
      return fromBody;
    }

    const fromHeader = extractUserKeyFromResponseHeaders(response);
    console.log('[Step 2] 헤더 확인:', {
      Authorization: response.headers.get('Authorization'),
      authorization: response.headers.get('authorization'),
    });

    if (fromHeader !== null) {
      console.log('[Step 2] Header에서 userKey 획득:', fromHeader);
      return fromHeader;
    }

    console.warn('백엔드 로그인 응답에 userKey가 없습니다.', {
      body,
      headerKeys: [...response.headers.keys()],
    });
    throw new Error(
      '로그인 응답에서 사용자 식별 키(userKey)를 찾을 수 없습니다. ' +
        '웹/미니앱에서는 Authorization 응답 헤더가 CORS 때문에 스크립트에 보이지 않을 수 있어요. ' +
        '백엔드에서 JSON(data 등)으로 userKey를 내려주거나, Access-Control-Expose-Headers에 Authorization을 포함해 주세요.'
    );
    
  } catch (error) {
    console.error('[Step 2] 로그인 API 요청 실패:', error);
    
    // [디버깅] Fetch 에러 상세 정보
    // if (error instanceof TypeError) {
    //   alert(`[Fetch 에러]\nTypeError: ${error.message}\n\n네트워크 연결 실패 또는 CORS 문제일 수 있습니다.`);
    // } else if (error instanceof Error) {
    //   alert(`[에러 상세]\nName: ${error.name}\nMessage: ${error.message}`);
    // }
    
    throw error;
  }
}

/**
 * 익명 키 기반 로그인 플로우 (getAnonymousKey)
 * 사용자 인증 없이 디바이스 고유 hash를 통해 자동 로그인합니다.
 */
export async function loginWithAnonymousKey(): Promise<string> {
  console.log('[Anonymous Login] getAnonymousKey 호출 시작');

  // 로컬/개발 환경(Granite local 포함)에서는 네이티브 브릿지가 일부 미구현일 수 있어 mock 사용
  // (예: getAnonymousKey가 "load failed"로 실패)
  if (!isTossAppEnvironment() || isLocalGraniteEnvironment()) {
    console.warn('[Anonymous Login] 로컬/브라우저 환경 - mock hash 사용');
    const mockHash = 'LOCAL_MOCK_HASH';
    saveAnonymousKeyHash(mockHash);
    return mockHash;
  }

  const result = await getAnonymousKey();

  if (result === undefined) {
    throw new Error('앱 버전이 낮아 익명 로그인을 지원하지 않아요. 앱을 업데이트해주세요.');
  }

  if (result === 'ERROR') {
    throw new Error('익명 로그인 중 오류가 발생했어요. 다시 시도해주세요.');
  }

  const { hash } = result;
  saveAnonymousKeyHash(hash);

  console.log('[Anonymous Login] 완료');
  return hash;
}

// V2에서는 hash(X-Anonymous-Key)로 일기 API를 호출하므로, 별도의 익명 로그인 API가 필요하지 않습니다.

/**
 * 기존 토스 로그인 데이터 병합 플로우
 * 1. appLogin()으로 기존 Toss 계정의 userKey 획득
 * 2. 현재 익명 userKey와 기존 데이터를 병합하는 Mock API 호출
 */
export type MergeDataWithTossResult = 'ALREADY_MAPPED' | 'LINKED';

export async function mergeDataWithToss(): Promise<MergeDataWithTossResult> {
  console.log('[Data Merge] 기존 데이터 병합 시작');

  const hash = getAnonymousKeyHash();
  if (!hash) throw new Error('익명 키가 없어 기존 데이터를 불러올 수 없어요.');

  // 0) 이미 매핑된 유저면 추가 연동 불필요 (불필요한 Toss 로그인 방지)
  const isMapped = await getMigrationStatusMapped(hash);
  if (isMapped) {
    console.log('[Data Merge] 이미 매핑된 사용자 - link 생략');
    return 'ALREADY_MAPPED';
  }

  // 1) 미매핑이면 Toss 로그인으로 userKey 획득
  const { authorizationCode, referrer } = await getTossAuthorizationCode();
  const oldUserKey = await loginToBackend(authorizationCode, referrer);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/dayline/api';
  const response = await fetch(`${API_BASE_URL}/v2/auth/migration/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: String(oldUserKey),
    },
    body: JSON.stringify({
      hash,
      authorizationCode,
      referrer,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || '기존 데이터 연결(마이그레이션)에 실패했어요.');
  }

  console.log('[Data Merge] 병합 완료');
  return 'LINKED';
}

// V2에서는 /v2/auth/migration/link로 userKey와 hash를 연결합니다.

/**
 * 통합 로그인 플로우 (기존 Toss 로그인 - 데이터 병합 시에만 사용)
 * @deprecated 신규 로그인은 loginWithAnonymousKey()를 사용하세요.
 */
export async function loginWithToss() {
  console.log('토스 로그인 플로우 시작');
  
  try {
    // 1. 인가 코드 획득
    // alert('[Step 1] 인가 코드 받기 시작...');
    const { authorizationCode, referrer } = await getTossAuthorizationCode();
    
    // [디버깅] 인가 코드 획득 성공
    // alert(`[Step 1 성공]\nCode: ${authorizationCode.slice(0, 20)}...\nReferrer: ${referrer}`);

    // 2. 백엔드 로그인
    // alert('[Step 2] 백엔드 로그인 시작...');
    const userKey = await loginToBackend(authorizationCode, referrer);
    
    // 3. UserKey 저장
    saveUserKey(userKey);
    console.log('UserKey 저장 완료:', userKey);

    // alert(`[로그인 성공!]\nUserKey: ${userKey}`);
    console.log('로그인 완료!');
    return userKey;
  } catch (error) {
    console.error('로그인 프로세스 중단:', error);
    
    // [디버깅] 로그인 플로우 실패
    // if (error instanceof Error) {
    //   alert(`[로그인 플로우 실패]\n${error.message}`);
    // }
    
    throw error;
  }
}

/**
 * 로컬 스토리지에 userKey 저장
 */
export function saveUserKey(userKey: number) {
  localStorage.setItem('user_key', String(userKey));
}

/**
 * 로컬 스토리지에서 userKey 가져오기
 */
export function getUserKey(): number | null {
  const userKey = localStorage.getItem('user_key');
  return userKey ? Number(userKey) : null;
}

/**
 * 로그아웃 (로컬 데이터 삭제)
 */
export function logout() {
  localStorage.removeItem('user_key');
}
