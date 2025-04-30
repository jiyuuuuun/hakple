'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import Link from 'next/link'
import { ArrowLeftIcon, AcademicCapIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { fetchApi } from '@/utils/api'

// 백엔드 응답 타입 정의
interface AcademyResponse {
    academyName?: string
    message?: string
    [key: string]: unknown
}

export default function AcademyRegister() {
    const [academyCode, setAcademyCode] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { isLogin } = useGlobalLoginMember()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        // 로그인 상태 확인
        if (!isLogin) {
            setError('로그인이 필요합니다.')
            setIsLoading(false)
            return
        }

        try {
            console.log('학원 등록 요청:', {
                academyCode: academyCode,
            })

            // 학원 등록 API 요청 
            const response = await fetchApi(`/api/v1/academies/register`, {
                method: 'POST',
                body: JSON.stringify({
                    academyCode: academyCode,
                }),
            })

            if (!response.ok) {
                // HTTP 에러 상태 코드에 따른 처리
                if (response.status === 400) {
                    throw new Error('유효하지 않은 학원 코드입니다.')
                } else if (response.status === 404) {
                    throw new Error('등록된 학원이 아닙니다.')
                } else if (response.status === 500) {
                    throw new Error('서버 내부 오류가 발생했습니다. 서버 로그를 확인해주세요.')
                } else {
                    throw new Error('학원 등록 중 오류가 발생했습니다.')
                }
            }

            // 응답 형식 확인 후 적절히 처리
            let academyName = '등록된 학원'
            let data: AcademyResponse | null = null
            let textData: string | null = null

            try {
                // 먼저 JSON으로 파싱 시도
                data = (await response.clone().json()) as AcademyResponse // .clone() 사용 주의
                console.log('학원 등록 응답 데이터 (JSON):', data)

                // JSON 응답에서 학원 이름 추출
                if (data && data.academyName) {
                    academyName = data.academyName
                }
            } catch (jsonError) {
                // JSON 파싱 실패 시 텍스트로 처리
                console.warn('JSON 파싱 실패, 텍스트로 처리 시도:', jsonError)
                textData = await response.text()
                console.log('학원 등록 응답 데이터 (텍스트):', textData)

                // 텍스트 응답에서 학원 이름 추출
                if (textData.includes('학원이 등록되었습니다:')) {
                    academyName = textData.split('학원이 등록되었습니다:')[1].trim()
                }
            }

            // 로컬 스토리지에 학원 코드와 이름 저장
            localStorage.setItem('academyName', academyName)
            localStorage.setItem('academyCode', academyCode)

            console.log('학원 정보 저장 완료:', {
                academyName: academyName,
                academyCode: academyCode,
            })

            // 저장 후 내 정보 페이지로 이동
            router.push('/myinfo')
        } catch (error) {
            console.error('API 오류:', error)
            // 에러 메시지 설정
            setError(error instanceof Error ? error.message : '서버 연결에 실패했습니다. 나중에 다시 시도해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                {/* 뒤로가기 버튼 */}
                <div className="mb-8">
                    <Link 
                        href="/myinfo" 
                        className="inline-flex items-center text-gray-600 hover:text-[#9C50D4] transition-colors text-lg"
                    >
                        <ArrowLeftIcon className="h-6 w-6 mr-2" />
                        <span>내 정보로 돌아가기</span>
                    </Link>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    {/* 헤더 부분 */}
                    <div className="bg-[#F7F3FD] px-8 py-6 border-b border-gray-100">
                        <div className="flex items-center">
                            <AcademicCapIcon className="h-9 w-9 text-[#9C50D4] mr-4" />
                            <h1 className="text-2xl font-bold text-gray-800">학원 등록</h1>
                        </div>
                        <p className="text-gray-600 mt-3 text-lg">
                            해당 학원에서 제공하는 코드를 입력하여 학원을 등록해 주세요.
                        </p>
                    </div>

                    {/* 컨텐츠 부분 */}
                    <div className="p-8">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-8">
                                <div>
                                    <label 
                                        htmlFor="academyCode" 
                                        className="block text-lg font-medium text-gray-700 mb-3"
                                    >
                                        학원 코드
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="academyCode"
                                            placeholder="예: ABC123"
                                            className={`w-full px-5 py-4 text-lg border ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent transition-colors`}
                                            value={academyCode}
                                            onChange={(e) => setAcademyCode(e.target.value)}
                                            required
                                        />
                                        {academyCode && !error && (
                                            <CheckCircleIcon className="absolute right-4 top-4 h-6 w-6 text-green-500" />
                                        )}
                                    </div>
                                    {error && (
                                        <p className="mt-3 text-base text-red-600 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            {error}
                                        </p>
                                    )}
                                    <p className="mt-3 text-sm text-gray-500">
                                        학원 코드는 각 학원에서 개별적으로 발급됩니다. 코드를 모르시면 학원 관리자에게 문의해 주세요.
                                    </p>
                                </div>

                                <div className="pt-6">
                                    <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                            className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors text-lg"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                            className="px-6 py-3 bg-[#9C50D4] text-white rounded-lg hover:bg-[#8A45BC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9C50D4] transition-colors font-medium flex items-center justify-center min-w-[100px] text-lg"
                                        disabled={isLoading}
                                    >
                                            {isLoading ? (
                                                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : '등록하기'}
                                    </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
