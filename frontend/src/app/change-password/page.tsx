'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios, { AxiosError } from 'axios'

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
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-screen-lg mx-auto pt-6 pb-10">
                <div className="bg-white rounded-lg shadow-sm mx-4 md:mx-auto max-w-2xl mt-4">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-3 text-center">비밀번호 변경</h1>
                        <p className="text-sm text-gray-600 mb-8 text-center">
                            현재 비밀번호 확인 후 새 비밀번호를 설정해주세요
                        </p>

                        {successMessage && (
                            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-green-600 font-medium">{successMessage}</p>
                                <p className="text-green-600 text-sm mt-1">잠시 후 내 정보 페이지로 이동합니다...</p>
                            </div>
                        )}

                        {passwordError && (
                            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-red-600 font-medium">{passwordError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-10">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">현재 비밀번호</h3>
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            disabled={isLoading || !!successMessage}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">새 비밀번호</h3>
                                    <div>
                                        <input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value)
                                            }}
                                            placeholder="새 비밀번호 입력"
                                            className={`w-full px-4 py-2 border ${
                                                passwordError ? 'border-red-300' : 'border-gray-300'
                                            } rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                            disabled={isLoading || !!successMessage}
                                            required
                                        />
                                        <p
                                            className={`text-sm mt-2 ${
                                                validatePassword(newPassword) ? 'text-green-600' : 'text-gray-500'
                                            }`}
                                        >
                                            비밀번호는 8자 이상이어야 합니다.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">새 비밀번호 확인</h3>
                                    <div>
                                        <input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value)
                                            }}
                                            placeholder="새 비밀번호 다시 입력"
                                            className={`w-full px-4 py-2 border ${
                                                confirmError ? 'border-red-300' : 'border-gray-300'
                                            } rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                            disabled={isLoading || !!successMessage}
                                            required
                                        />
                                        {confirmError && <p className="text-red-500 text-sm mt-2">{confirmError}</p>}
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                        disabled={isLoading || !!successMessage}
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitDisabled()}
                                        className={`px-6 py-2 ${
                                            isSubmitDisabled()
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : 'bg-[#9C50D4] hover:bg-purple-500'
                                        } text-white rounded-md font-medium`}
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
