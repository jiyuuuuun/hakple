'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios, { AxiosError } from 'axios'
import Link from 'next/link'
import { ArrowLeftIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function ChangePasswordPage() {
    const router = useRouter()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [confirmError, setConfirmError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    // 비밀번호 유효성 검사
    const validatePassword = (password: string) => {
        return password.length >= 8
    }

    // 비밀번호 확인 일치 검사
    useEffect(() => {
        if (newPassword && confirmPassword) {
            if (newPassword !== confirmPassword) {
                setConfirmError('비밀번호가 일치하지 않습니다.')
            } else {
                setConfirmError('')
            }
        } else {
            setConfirmError('')
        }
    }, [newPassword, confirmPassword])

    // 비밀번호 유효성 실시간 검사
    useEffect(() => {
        if (newPassword) {
            if (!validatePassword(newPassword)) {
                setPasswordError('비밀번호는 8자 이상이어야 합니다.')
            } else {
                setPasswordError('')
            }
        } else {
            setPasswordError('')
        }
    }, [newPassword])

    // 제출 버튼 활성화 여부
    const isSubmitDisabled = () => {
        return (
            !currentPassword ||
            !newPassword ||
            !confirmPassword ||
            passwordError !== '' ||
            confirmError !== '' ||
            isLoading
        )
    }

    // 비밀번호 변경 처리
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 입력값 검증
        if (!currentPassword) {
            setPasswordError('현재 비밀번호를 입력해주세요.')
            return
        }

        if (!validatePassword(newPassword)) {
            setPasswordError('비밀번호는 8자 이상이어야 합니다.')
            return
        }

        if (newPassword !== confirmPassword) {
            setConfirmError('비밀번호가 일치하지 않습니다.')
            return
        }

        setIsLoading(true)
        setPasswordError('')
        setConfirmError('')

        try {
            await axios.post(
                '/api/v1/usernames/change-password',
                {
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                    newPasswordConfirm: confirmPassword,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    withCredentials: true, // 쿠키 포함하여 요청 (JWT 인증)
                },
            )

            // 비밀번호 변경 성공 메시지 표시
            setSuccessMessage('비밀번호가 성공적으로 변경되었습니다.')

            // 폼 리셋
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')

            // 3초 후 메인 페이지로 이동
            setTimeout(() => {
                router.push('/myinfo')
            }, 3000)
        } catch (error) {
            console.error('비밀번호 변경 오류:', error)

            const axiosError = error as AxiosError

            if (axiosError.response) {
                if (axiosError.response.status === 401) {
                    setPasswordError('현재 비밀번호가 올바르지 않습니다.')
                } else if (axiosError.response.status === 400) {
                    setPasswordError('비밀번호 변경 요청이 올바르지 않습니다.')
                } else {
                    setPasswordError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.')
                }
            } else {
                setPasswordError('서버 연결에 문제가 발생했습니다. 나중에 다시 시도해주세요.')
            }
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
                            <KeyIcon className="h-9 w-9 text-[#9C50D4] mr-4" />
                            <h1 className="text-2xl font-bold text-gray-800">비밀번호 변경</h1>
                        </div>
                        <p className="text-gray-600 mt-3 text-lg">
                            현재 비밀번호 확인 후 새 비밀번호를 설정해주세요.
                        </p>
                    </div>

                    {/* 컨텐츠 부분 */}
                    <div className="p-8">
                        {successMessage && (
                            <div className="mb-8 p-5 bg-green-50 rounded-lg border border-green-200 flex items-start">
                                <ShieldCheckIcon className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-green-600 font-medium text-lg">{successMessage}</p>
                                    <p className="text-green-600 text-base mt-1">잠시 후 내 정보 페이지로 이동합니다...</p>
                                </div>
                            </div>
                        )}

                        {passwordError && (
                            <div className="mb-8 p-5 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-red-600 font-medium text-base">{passwordError}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div>
                                <h3 className="text-xl font-medium text-gray-800 mb-3">현재 비밀번호</h3>
                                    <div>
                                        <input
                                            id="current-password"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => {
                                                setCurrentPassword(e.target.value)
                                                setPasswordError('')
                                            }}
                                            placeholder="현재 비밀번호 입력"
                                        className="w-full px-5 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent transition-colors bg-white"
                                            disabled={isLoading || !!successMessage}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                <h3 className="text-xl font-medium text-gray-800 mb-3">새 비밀번호</h3>
                                    <div>
                                        <input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value)
                                            }}
                                            placeholder="새 비밀번호 입력"
                                        className={`w-full px-5 py-4 text-lg border ${
                                            passwordError ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent transition-colors`}
                                            disabled={isLoading || !!successMessage}
                                            required
                                        />
                                        <p
                                        className={`text-base mt-3 ${
                                                validatePassword(newPassword) ? 'text-green-600' : 'text-gray-500'
                                        } flex items-center`}
                                        >
                                        {validatePassword(newPassword) ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : null}
                                            비밀번호는 8자 이상이어야 합니다.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                <h3 className="text-xl font-medium text-gray-800 mb-3">새 비밀번호 확인</h3>
                                    <div>
                                        <input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value)
                                            }}
                                            placeholder="새 비밀번호 다시 입력"
                                        className={`w-full px-5 py-4 text-lg border ${
                                            confirmError ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent transition-colors`}
                                            disabled={isLoading || !!successMessage}
                                            required
                                        />
                                    {confirmError && (
                                        <p className="text-red-600 text-base mt-3 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {confirmError}
                                        </p>
                                    )}
                                    {newPassword && confirmPassword && newPassword === confirmPassword && (
                                        <p className="text-green-600 text-base mt-3 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            비밀번호가 일치합니다.
                                        </p>
                                    )}
                                </div>
                                </div>

                            <div className="flex justify-end space-x-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                    className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-lg"
                                        disabled={isLoading || !!successMessage}
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitDisabled()}
                                    className={`px-6 py-3 ${
                                            isSubmitDisabled()
                                                ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-[#9C50D4] hover:bg-[#8A45BC]'
                                    } text-white rounded-lg font-medium text-lg min-w-[100px] flex items-center justify-center`}
                                >
                                    {isLoading ? (
                                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : '변경하기'}
                                    </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}