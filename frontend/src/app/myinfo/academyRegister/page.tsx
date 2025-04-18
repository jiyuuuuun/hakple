'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios, { AxiosError } from 'axios'

// API 기본 URL 설정 (백엔드 서버 URL)
const API_BASE_URL = 'http://localhost:8090' // 실제 백엔드 서버 URL로 변경 필요

export default function AcademyRegister() {
    const [academyCode, setAcademyCode] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            // API 요청을 통해 학원 코드 검증 및 등록
            const dummyUserName = 'user7' // 실제로는 로그인 정보에서 가져와야 함

            // 방법 1: 요청 본문에 userName과 academyCode를 함께 전송
            const response = await axios.post(
                `${API_BASE_URL}/api/v1/academies/register`,
                {
                    userName: dummyUserName,
                    academyCode: academyCode,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        // 필요하다면 인증 토큰 추가
                        // 'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    timeout: 10000,
                },
            )

            /* 
            // 방법 2: 요청 파라미터로 전달 (백엔드가 이 방식을 지원하는 경우)
            const response = await axios.post(
                `${API_BASE_URL}/api/v1/academies/register?userName=${dummyUserName}`,
                {
                    academyCode: academyCode
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            )
            */

            // 학원 등록 성공 시
            console.log('응답 데이터:', response.data)
            let academyName = '등록된 학원'

            // 응답 형식에 따라 학원 이름 추출 방법 조정
            if (typeof response.data === 'string' && response.data.includes(':')) {
                academyName = response.data.split(': ')[1]
            } else if (response.data && response.data.academyName) {
                academyName = response.data.academyName
            }

            // 로컬 스토리지에 저장하고 이동
            localStorage.setItem('academyName', academyName)
            router.push('/myinfo')
        } catch (error) {
            console.error('API 오류:', error)
            // 오류 응답 처리
            const axiosError = error as AxiosError

            if (axiosError.code === 'ECONNREFUSED') {
                setError('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.')
            } else if (axiosError.response) {
                if (axiosError.response.status === 400) {
                    setError('유효하지 않은 학원 코드입니다.')
                } else if (axiosError.response.status === 404) {
                    setError('등록된 학원이 아닙니다.')
                } else if (axiosError.response.status === 500) {
                    setError('서버 내부 오류가 발생했습니다. 서버 로그를 확인해주세요.')
                    console.error('서버 오류 응답:', axiosError.response.data)
                } else {
                    setError('학원 등록 중 오류가 발생했습니다.')
                }
            } else if (axiosError.request) {
                // 요청은 전송되었지만 응답을 받지 못함
                setError('서버로부터 응답이 없습니다. 잠시 후 다시 시도해주세요.')
            } else {
                setError('서버 연결에 실패했습니다. 나중에 다시 시도해주세요.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    // 테스트용 더미 등록 함수 (백엔드 연결 전 테스트용)
    const handleTestRegister = () => {
        setError('')
        setIsLoading(true)

        // 3초 후 성공한 것처럼 처리
        setTimeout(() => {
            localStorage.setItem('academyName', '테스트 학원')
            router.push('/myinfo')
        }, 2000)
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

                                {/* 개발/테스트용 버튼 - 백엔드 연결 전 테스트할 때 사용 */}
                                {process.env.NODE_ENV === 'development' && (
                                    <div className="mt-8 pt-4 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={handleTestRegister}
                                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                                        >
                                            테스트용: 학원 등록 성공 시뮬레이션
                                        </button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    )
}
