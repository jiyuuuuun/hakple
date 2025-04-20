'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'

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

            // 학원 등록 API 요청 - JWT에서 자동으로 사용자 정보 추출
            const response = await fetch(`/api/v1/academies/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // 쿠키 포함하여 요청
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
            const contentType = response.headers.get('content-type')
            let academyName = '등록된 학원'

            if (contentType && contentType.includes('application/json')) {
                // JSON 응답인 경우
                const data = (await response.json()) as AcademyResponse
                console.log('학원 등록 응답 데이터 (JSON):', data)

                // JSON 응답에서 학원 이름 추출
                if (data && data.academyName) {
                    academyName = data.academyName
                }
            } else {
                // 텍스트 응답인 경우
                const textData = await response.text()
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
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-screen-lg mx-auto pt-6 pb-10">
                <div className="bg-white rounded-lg shadow-sm mx-4 md:mx-auto max-w-2xl mt-4">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-3 text-center">학원 등록</h1>
                        <p className="text-sm text-gray-600 mb-8 text-center">학원 코드를 입력해 주세요</p>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-10">
                                {/* 학원 코드 입력 */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">학원 코드</h3>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            id="academyCode"
                                            placeholder="학원 코드를 입력해 주세요"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            value={academyCode}
                                            onChange={(e) => setAcademyCode(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                                </div>

                                {/* 하단 버튼 */}
                                <div className="flex justify-end space-x-3 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-[#9C50D4] text-white rounded-md hover:bg-purple-500 font-medium"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? '처리 중...' : '확인'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    )
}
