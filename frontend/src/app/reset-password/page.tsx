'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

// API 기본 URL
const API_BASE_URL = 'http://localhost:8090' // 실제 서버 URL로 변경 필요

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const phoneNumber = searchParams.get('phone') || ''

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    // 휴대폰 번호가 없는 경우 로그인 페이지로 리다이렉트
    useEffect(() => {
        if (!phoneNumber) {
            router.push('/login')
        }
    }, [phoneNumber, router])

    // 비밀번호 유효성 검사
    const validatePassword = (password: string) => {
        // 최소 8자, 최대 15자
        if (password.length < 8 || password.length > 15) {
            return false
        }
        return true
    }

    // 비밀번호 변경 처리
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 입력값 검증
        if (!password || !confirmPassword) {
            setPasswordError('비밀번호를 입력해주세요.')
            return
        }

        if (!validatePassword(password)) {
            setPasswordError('비밀번호는 8~15자로 입력해주세요.')
            return
        }

        if (password !== confirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.')
            return
        }

        setIsLoading(true)
        setPasswordError('')

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/usernames/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newPassword: password,
                    newPasswordConfirm: confirmPassword,
                }),
            })

            if (response.status === 401) {
                setPasswordError('존재하지 않는 사용자입니다.')
                return
            }

            if (!response.ok) {
                throw new Error('비밀번호 변경에 실패했습니다.')
            }

            // 비밀번호 변경 성공 메시지 표시
            setSuccessMessage('비밀번호가 성공적으로 변경되었습니다.')

            // 3초 후 로그인 페이지로 이동
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (error) {
            console.error('비밀번호 변경 오류:', error)
            setPasswordError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5EEF8] px-4 pt-0">
            <div className="w-full max-w-[600px] bg-white rounded-3xl p-12 shadow-lg mt-[-200px]">
                <div className="flex flex-col items-center mb-10 mt-[-10px]">
                    <Link href="/" className="cursor-pointer">
                        <Image src="/logo.png" alt="Hakple 로고" width={120} height={120} className="mb-2" />
                    </Link>
                    <h1 className="text-4xl font-bold text-center">
                        <span className="text-[#9C50D4]">비밀번호</span>
                        <span className="text-black"> 재설정</span>
                    </h1>
                    <p className="text-base text-gray-600 mt-2 text-center">새로운 비밀번호를 입력해주세요</p>
                </div>

                {successMessage && (
                    <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
                        <p>{successMessage}</p>
                        <p className="text-sm mt-1">잠시 후 로그인 페이지로 이동합니다...</p>
                    </div>
                )}

                {passwordError && (
                    <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                        <p>{passwordError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label htmlFor="password" className="block text-gray-700 text-lg">
                            새 비밀번호
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                setPasswordError('')
                            }}
                            placeholder="새 비밀번호 입력"
                            className="w-full px-5 py-4 text-lg text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled={isLoading || !!successMessage}
                        />
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="confirm-password" className="block text-gray-700 text-lg">
                            새 비밀번호 확인
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value)
                                setPasswordError('')
                            }}
                            placeholder="새 비밀번호 다시 입력"
                            className="w-full px-5 py-4 text-lg text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled={isLoading || !!successMessage}
                        />
                    </div>

                    <p className="text-sm text-gray-500">비밀번호는 8~15자로 입력해주세요</p>

                    <button
                        type="submit"
                        className="w-full py-4 text-lg bg-[#9C50D4] text-white rounded-lg hover:bg-[#8a45bc] transition-colors mt-6 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        disabled={isLoading || !!successMessage}
                    >
                        {isLoading ? '처리 중...' : '완료'}
                    </button>

                    <div className="text-center mt-4">
                        <Link href="/login" className="text-base text-gray-600 hover:text-purple-600">
                            로그인 페이지로 돌아가기
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
