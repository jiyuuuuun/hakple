'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, ShieldExclamationIcon, KeyIcon, CheckIcon } from '@heroicons/react/24/outline'
import { fetchApi } from '@/utils/api'

export default function Withdraw() {
    const router = useRouter()
    const [reason, setReason] = useState('')
    const [password, setPassword] = useState('')
    const [agreeToDelete, setAgreeToDelete] = useState(false)
    const [selectedReason, setSelectedReason] = useState('')
    const [errors, setErrors] = useState({
        password: false,
        reason: false,
        agreement: false,
    })
    const [isLoading, setIsLoading] = useState(false)

    const handleWithdraw = async () => {
        // 필드 유효성 검사
        const newErrors = {
            password: !password,
            reason: !selectedReason,
            agreement: !agreeToDelete,
        }

        setErrors(newErrors)

        // 모든 필수 필드가 입력되었는지 확인
        if (!password || !agreeToDelete || !selectedReason) {
            return
        }

        setIsLoading(true)

        try {
            // 쿠키에서 accessToken 가져오기
            const cookies = document.cookie.split(';')
            const accessTokenCookie = cookies.find((cookie) => cookie.trim().startsWith('accessToken='))
            const accessToken = accessTokenCookie ? accessTokenCookie.split('=')[1].trim() : ''

            const response = await fetchApi('/api/v1/users/withdraw', {
                method: 'DELETE',
                body: JSON.stringify({
                    password: password,
                }),
            })

            if (!response.ok) {
                throw new Error('탈퇴 처리 중 오류가 발생했습니다.')
            }

            // 성공 시 알림 표시 후 홈으로 이동
            alert('탈퇴 처리 완료')
            router.push('/')
        } catch (error) {
            console.error('탈퇴 처리 중 오류:', error)
            alert('탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-md mx-auto">
                {/* 뒤로가기 버튼 */}
                <div className="mb-6">
                    <Link
                        href="/myinfo"
                        className="inline-flex items-center text-gray-600 hover:text-[#9C50D4] transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5 mr-1" />
                        <span>내 정보로 돌아가기</span>
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    {/* 헤더 부분 */}
                    <div className="bg-[#F7F3FD] px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center">
                            <ShieldExclamationIcon className="h-7 w-7 text-[#9C50D4] mr-3" />
                            <h1 className="text-xl font-bold text-gray-800">회원 탈퇴</h1>
                        </div>
                        <p className="text-gray-600 mt-2">회원 탈퇴 전 아래 안내사항을 반드시 확인해 주세요.</p>
                    </div>

                    {/* 컨텐츠 부분 */}
                    <div className="p-6">
                        <div className="mb-6 bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
                            <div className="flex">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-amber-500 mt-0.5 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-amber-800 mb-1">회원 탈퇴 시 주의사항</h3>
                                    <ul className="text-sm text-amber-700 space-y-1 ml-5 list-disc">
                                        <li>모든 개인정보가 삭제되며 복구할 수 없습니다.</li>
                                        <li>작성하신 게시물은 삭제되지 않습니다.</li>
                                        <li>탈퇴 후 동일한 전화번호로 재가입이 30일간 제한됩니다.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3">탈퇴 사유를 선택해 주세요</h3>
                                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="withdrawReason"
                                            className="h-4 w-4 text-[#9C50D4] focus:ring-[#9C50D4]"
                                            value="서비스 이용이 불편해서"
                                            onChange={() => {
                                                setSelectedReason('서비스 이용이 불편해서')
                                                setErrors((prev) => ({ ...prev, reason: false }))
                                            }}
                                        />
                                        <span className="ml-2 text-gray-700">서비스 이용이 불편해서</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="withdrawReason"
                                            className="h-4 w-4 text-[#9C50D4] focus:ring-[#9C50D4]"
                                            value="다른 서비스를 이용하기 위해서"
                                            onChange={() => {
                                                setSelectedReason('다른 서비스를 이용하기 위해서')
                                                setErrors((prev) => ({ ...prev, reason: false }))
                                            }}
                                        />
                                        <span className="ml-2 text-gray-700">다른 서비스를 이용하기 위해서</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="withdrawReason"
                                            className="h-4 w-4 text-[#9C50D4] focus:ring-[#9C50D4]"
                                            value="개인정보 보호를 위해서"
                                            onChange={() => {
                                                setSelectedReason('개인정보 보호를 위해서')
                                                setErrors((prev) => ({ ...prev, reason: false }))
                                            }}
                                        />
                                        <span className="ml-2 text-gray-700">개인정보 보호를 위해서</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="withdrawReason"
                                            className="h-4 w-4 text-[#9C50D4] focus:ring-[#9C50D4]"
                                            value="기타"
                                            onChange={() => {
                                                setSelectedReason('기타')
                                                setErrors((prev) => ({ ...prev, reason: false }))
                                            }}
                                        />
                                        <span className="ml-2 text-gray-700">기타</span>
                                    </label>
                                </div>
                                {errors.reason && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                            />
                                        </svg>
                                        탈퇴 사유를 선택해주세요
                                    </p>
                                )}
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">상세 사유 (선택사항)</h3>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C50D4] resize-none bg-gray-50"
                                    placeholder="서비스 개선을 위해 의견을 남겨주세요."
                                    rows={3}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                ></textarea>
                                <p className="mt-1 text-xs text-gray-500">
                                    더 나은 서비스를 위해 상세한 의견을 남겨주시면 큰 도움이 됩니다.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">비밀번호 확인</h3>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <KeyIcon
                                            className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`}
                                        />
                                    </div>
                                    <input
                                        type="password"
                                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C50D4] bg-gray-50 ${
                                            errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="비밀번호를 입력해주세요"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value)
                                            if (e.target.value) {
                                                setErrors((prev) => ({ ...prev, password: false }))
                                            }
                                        }}
                                    />
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                            />
                                        </svg>
                                        비밀번호를 입력해주세요
                                    </p>
                                )}
                            </div>

                            <div className="mt-6">
                                <label
                                    className={`flex items-center p-4 rounded-lg ${
                                        errors.agreement ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className={`h-4 w-4 rounded ${
                                            errors.agreement
                                                ? 'text-red-500 border-red-500'
                                                : 'text-[#9C50D4] border-gray-300'
                                        } focus:ring-[#9C50D4]`}
                                        checked={agreeToDelete}
                                        onChange={(e) => {
                                            setAgreeToDelete(e.target.checked)
                                            if (e.target.checked) {
                                                setErrors((prev) => ({ ...prev, agreement: false }))
                                            }
                                        }}
                                    />
                                    <span
                                        className={`ml-2 text-sm ${
                                            errors.agreement ? 'text-red-800' : 'text-gray-800'
                                        }`}
                                    >
                                        회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없다는 점을 이해했습니다.
                                    </span>
                                </label>

                                {errors.agreement && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                            />
                                        </svg>
                                        동의가 필요합니다
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="button"
                                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors font-medium flex items-center justify-center min-w-[80px]"
                                    onClick={handleWithdraw}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                    ) : (
                                        '탈퇴하기'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
