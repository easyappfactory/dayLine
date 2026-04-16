const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/dayline/api';

/**
 * POST /v2/auth/migration/status
 * @returns 백엔드의 isMapped (매핑 완료/불필요 여부). false면 V1 데이터 마이그레이션 유도 가능.
 */
export async function getMigrationStatusMapped(hash: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/v2/auth/migration/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hash }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || '마이그레이션 상태를 확인하지 못했습니다.');
  }

  const json: unknown = await response.json();

  const isMapped = parseMigrationIsMapped(json);
  if (isMapped === null) {
    console.warn('[migration/status] 알 수 없는 응답 형식:', json);
    throw new Error('마이그레이션 상태 응답을 해석할 수 없습니다.');
  }
  return isMapped;
}

function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    if (s === 'true' || s === '1') return true;
    if (s === 'false' || s === '0') return false;
  }
  return null;
}

function parseMigrationIsMapped(json: unknown): boolean | null {
  if (json === null || typeof json !== 'object') return null;
  const root = json as Record<string, unknown>;

  const rootMapped = coerceBoolean(root.isMapped);
  if (rootMapped !== null) return rootMapped;
  const rootMappedAlt = coerceBoolean(root.mapped);
  if (rootMappedAlt !== null) return rootMappedAlt;

  const data = root.data;
  const dataAsBool = coerceBoolean(data);
  if (dataAsBool !== null) return dataAsBool;

  if (typeof data === 'string') {
    const t = data.trim();
    try {
      const inner = JSON.parse(t) as { isMapped?: unknown };
      const innerMapped = coerceBoolean(inner?.isMapped);
      if (innerMapped !== null) return innerMapped;
    } catch {
      return null;
    }
  }
  if (data !== null && typeof data === 'object' && 'isMapped' in data) {
    const nested = coerceBoolean((data as { isMapped: unknown }).isMapped);
    if (nested !== null) return nested;
  }
  if (data !== null && typeof data === 'object' && 'mapped' in data) {
    const nested = coerceBoolean((data as { mapped: unknown }).mapped);
    if (nested !== null) return nested;
  }

  return null;
}
