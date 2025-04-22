/**
 * API 요청을 위한 공통 유틸리티 함수
 * 400, 403 에러는 console.error가 아닌 console.log로 출력되도록 처리
 */

/**
 * API 요청을 위한 기본 URL
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';

/**
 * 기본 fetch 함수 래퍼
 * @param url API 엔드포인트 URL
 * @param options fetch 옵션
 * @returns Response 객체
 */
export async function fetchApi(url: string, options: RequestInit = {}): Promise<Response> {
  // 전체 URL 생성 (상대 경로인 경우에만 BASE_URL 추가)
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

  // 기본 옵션과 사용자 지정 옵션 병합
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // API 요청 실행 및 타임아웃 설정
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

    const response = await fetch(fullUrl, {
      ...mergedOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다.');
      }
    }
    throw error;
  }
}

/**
 * JSON 응답을 기대하는 API 요청
 * @param url API 엔드포인트 URL
 * @param options fetch 옵션
 * @returns 파싱된 JSON 데이터
 */
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetchApi(url, options);

  // 응답이 ok가 아니면 에러 발생
  if (!response.ok) {
    // 에러 상태에 따른 처리
    if (response.status === 400 || response.status === 403) {
      // 클라이언트 에러는 일반 로그로 처리
      console.log(`클라이언트 에러 발생 (${response.status}):`, response.statusText);
    } else if (response.status >= 500) {
      // 서버 에러는 경고 로그로 처리
      console.warn(`서버 에러 발생 (${response.status}):`, response.statusText);
    } else {
      // 기타 에러는 info 레벨로 처리
      console.info(`API 요청 실패 (${response.status}):`, response.statusText);
    }
    throw new Error(`API 요청 실패: ${response.statusText}`);
  }

  // 응답 텍스트 체크
  const text = await response.text();
  if (!text || text.trim() === '') {
    return {} as T;
  }

  // JSON 파싱 시도
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.log('JSON 파싱 실패:', error);
    throw new Error('서버 응답을 처리할 수 없습니다.');
  }
}

/**
 * GET 요청용 래퍼 함수
 */
export function get<T>(url: string, options?: RequestInit): Promise<T> {
  return fetchJson<T>(url, { ...options, method: 'GET' });
}

/**
 * POST 요청용 래퍼 함수
 */
export function post<T>(url: string, data: any, options?: RequestInit): Promise<T> {
  return fetchJson<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT 요청용 래퍼 함수
 */
export function put<T>(url: string, data: any, options?: RequestInit): Promise<T> {
  return fetchJson<T>(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH 요청용 래퍼 함수
 */
export function patch<T>(url: string, data: any, options?: RequestInit): Promise<T> {
  return fetchJson<T>(url, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE 요청용 래퍼 함수
 */
export function del<T>(url: string, options?: RequestInit): Promise<T> {
  return fetchJson<T>(url, { ...options, method: 'DELETE' });
}