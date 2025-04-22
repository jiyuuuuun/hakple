/**
 * API 요청을 위한 공통 유틸리티 함수
 * 400, 403 에러는 console.error가 아닌 console.log로 출력되도록 처리
 */

/**
 * API 요청을 위한 기본 URL
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8090';

/**
 * 기본 fetch 함수 래퍼
 * @param url API 엔드포인트 URL
 * @param options fetch 옵션
 * @returns Response 객체
 */
export async function fetchApi(url: string, options?: RequestInit): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  // 기본 옵션 설정
  const defaultOptions: RequestInit = {
    credentials: 'include', // 기본적으로 쿠키 기반 인증 포함
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  // 사용자 옵션과 기본 옵션 병합
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options?.headers,
    },
  };

  // API 요청 실행
  try {
    const response = await fetch(fullUrl, mergedOptions);
    
    // 응답 상태 체크
    if (!response.ok) {
      // 400, 403 에러는 console.error 대신 console.log 사용
      if (response.status === 400 || response.status === 403) {
        console.log(`API 요청 실패 (${response.status}): ${response.statusText}`);
        try {
          // 에러 응답의 텍스트 추출 시도
          const errorText = await response.text();
          console.log('응답 내용:', errorText);
        } catch (e) {
          console.log('응답 내용을 읽을 수 없음');
        }
      } else {
        // 다른 에러는 기존대로 console.error 사용
        console.error(`API 요청 실패 (${response.status}): ${response.statusText}`);
      }
    }
    
    return response;
  } catch (error) {
    console.error('API 요청 중 네트워크 오류:', error);
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
    throw new Error(`API 요청 실패 (${response.status}): ${response.statusText}`);
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