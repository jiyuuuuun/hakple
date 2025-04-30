/**
 * API 요청을 위한 공통 유틸리티 함수
 * 400, 403 에러는 console.error가 아닌 console.log로 출력되도록 처리
 */

/**
 * API 요청을 위한 기본 URL
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * API 요청 타임아웃 시간 (밀리초)
 */
const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000

/**
 * 기본 fetch 함수 래퍼
 * @param url API 엔드포인트 URL
 * @param options fetch 옵션
 * @returns Response 객체
 */
export async function fetchApi(url: string, options: RequestInit = {}): Promise<Response> {
    // 전체 URL 생성 (상대 경로인 경우에만 BASE_URL 추가)
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

    // 기본 옵션
    const defaultOptions: RequestInit = {
        credentials: 'include',
        headers: {}, // 초기 헤더는 비워둡니다.
    }

    // 요청 본문이 FormData인지 확인
    const isFormData = options.body instanceof FormData

    // Content-Type 설정: FormData가 아닐 경우에만 기본값 설정
    if (!isFormData) {
        ;(defaultOptions.headers as Record<string, string>)['Content-Type'] = 'application/json'
        ;(defaultOptions.headers as Record<string, string>)['Accept'] = 'application/json'
    }

    // 기본 옵션과 사용자 지정 옵션 병합
    const mergedOptions: RequestInit = {
        ...defaultOptions,
        ...options,
        // 사용자 지정 헤더와 기본 헤더(필요한 경우) 병합
        headers: {
            ...defaultOptions.headers, // FormData가 아닐 때만 Content-Type 등이 포함됨
            ...options.headers,
        },
    }

    // API 요청 실행 및 타임아웃 설정
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT) // 환경 변수로 설정된 타임아웃

        const response = await fetch(fullUrl, {
            ...mergedOptions,
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // 401 에러 처리
        if (response.status === 401 && !url.includes('/api/v1/auth/login')) {
            // 로그인 페이지로 리다이렉트
            if (typeof window !== 'undefined') {
                window.location.href = '/login'
            }
        }

        // myInfos API가 아닌 다른 API 요청에서 200 응답을 받았을 때
        if (response.ok && !url.includes('/api/v1/myInfos')) {
            try {
                // 사용자 정보 갱신
                const userInfoResponse = await fetch(`${BASE_URL}/api/v1/myInfos`, {
                    credentials: 'include',
                })

                if (userInfoResponse.ok) {
                    const userInfo = await userInfoResponse.json()
                    // localStorage에 최신 학원 정보 저장
                    if (typeof window !== 'undefined' && userInfo.academyCode) {
                        localStorage.setItem('academyCode', userInfo.academyCode)
                        localStorage.setItem('academyName', userInfo.academyName || '등록된 학원')
                    }
                }
            } catch (error) {
                console.error('사용자 정보 갱신 실패:', error)
            }
        }

        return response
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('요청 시간이 초과되었습니다.')
            }
        }
        throw error
    }
}

/**
 * JSON 응답을 기대하는 API 요청
 * @param url API 엔드포인트 URL
 * @param options fetch 옵션
 * @returns 파싱된 JSON 데이터
 */
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetchApi(url, options)

    // 응답이 ok가 아니면 에러 발생
    if (!response.ok) {
        // 에러 상태에 따른 처리
        if (response.status === 400 || response.status === 403) {
            // 클라이언트 에러는 일반 로그로 처리
            console.log(`클라이언트 에러 발생 (${response.status}):`, response.statusText)
        } else if (response.status >= 500) {
            // 서버 에러는 경고 로그로 처리
            console.warn(`서버 에러 발생 (${response.status}):`, response.statusText)
        } else {
            // 기타 에러는 info 레벨로 처리
            console.info(`API 요청 실패 (${response.status}):`, response.statusText)
        }
        throw new Error(`API 요청 실패: ${response.statusText}`)
    }

    // 응답 텍스트 체크
    const text = await response.text()
    if (!text || text.trim() === '') {
        return {} as T
    }

    // JSON 파싱 시도
    try {
        return JSON.parse(text) as T
    } catch (error) {
        console.log('JSON 파싱 실패:', error)
        throw new Error('서버 응답을 처리할 수 없습니다.')
    }
}

/**
 * GET 요청용 래퍼 함수
 */
export function get<T>(url: string, options?: RequestInit): Promise<T> {
    return fetchJson<T>(url, { ...options, method: 'GET' })
}

/**
 * POST 요청용 래퍼 함수
 */
export function post<T>(url: string, data: any, options?: RequestInit): Promise<T> {
    return fetchJson<T>(url, {
        ...options,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        body: JSON.stringify(data),
    })
}

/**
 * PUT 요청용 래퍼 함수
 */
export function put<T>(url: string, data: any, options?: RequestInit): Promise<T> {
    return fetchJson<T>(url, {
        ...options,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        body: JSON.stringify(data),
    })
}

/**
 * PATCH 요청용 래퍼 함수
 */
export function patch<T>(url: string, data: any, options?: RequestInit): Promise<T> {
    return fetchJson<T>(url, {
        ...options,
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        body: JSON.stringify(data),
    })
}

/**
 * DELETE 요청용 래퍼 함수
 */
export function del<T>(url: string, options?: RequestInit): Promise<T> {
    return fetchJson<T>(url, { ...options, method: 'DELETE' })
}

import { ImageUploadResponse } from '../types/image'

export const uploadImage = async (file: File): Promise<ImageUploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetchApi('/api/v1/images/upload', {
        method: 'POST',
        body: formData,
    })

    if (!response.ok) {
        let errorMsg = '이미지 업로드에 실패했습니다.'
        try {
            const errorData = await response.json()
            errorMsg = errorData.message || `서버 응답 오류: ${response.status}`
        } catch {
            errorMsg = response.statusText || `서버 오류: ${response.status}`
        }
        throw new Error(errorMsg)
    }

    return response.json()
}
