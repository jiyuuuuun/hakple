'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

// API 기본 URL
const API_BASE_URL = 'http://localhost:8090' // 실제 서버 URL로 변경 필요

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [phoneNumber, setPhoneNumber] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [isSent, setIsSent] = useState(false)
    const [timeLeft, setTimeLeft] = useState(180) // 3분 타이머
    const [isTimerActive, setIsTimerActive] = useState(false)
    const [isExpired, setIsExpired] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    // 인증번호 전송 처리
    const handleSendVerification = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!phoneNumber) {
            setErrorMessage('휴대폰 번호를 입력해주세요.')
            return
        }

        // 전화번호 형식 검증 (간단한 검증)
        if (phoneNumber.length < 10 || phoneNumber.length > 11) {
            setErrorMessage('올바른 휴대폰 번호를 입력해주세요.')
            return
        }

        setIsLoading(true)
        setErrorMessage('')

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/sms/send?phone=${phoneNumber}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (response.status === 401) {
                setErrorMessage('존재하지 않는 사용자입니다.')
                return
            }

            if (!response.ok) {
                throw new Error('인증번호 전송에 실패했습니다.')
            }

            // 성공적으로 전송됨
            setIsSent(true)
            setTimeLeft(180)
            setIsTimerActive(true)
            setIsExpired(false)
            setVerificationCode('') // 재전송 시 인증번호 초기화
        } catch (error) {
            console.error('인증번호 전송 오류:', error)
            setErrorMessage('인증번호 전송에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    // 인증 완료 처리
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!verificationCode) {
            setErrorMessage('인증번호를 입력해주세요.')
            return
        }

        if (verificationCode.length !== 6) {
            setErrorMessage('인증번호 6자리를 모두 입력해주세요.')
            return
        }

        if (isExpired) {
            setErrorMessage('인증번호가 만료되었습니다. 인증번호를 재전송해주세요.')
            return
        }

        setIsLoading(true)
        setErrorMessage('')

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/sms/verify?phone=${phoneNumber}&code=${verificationCode}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )

            if (response.status === 401) {
                setErrorMessage('존재하지 않는 사용자입니다.')
                return
            }

            if (!response.ok) {
                throw new Error('인증번호 검증에 실패했습니다.')
            }

            // 인증 성공 시 다음 단계로 이동
            // 페이지 이동 시 phoneNumber를 state로 전달하여 비밀번호 재설정에 사용
            router.push(`/reset-password?phone=${encodeURIComponent(phoneNumber)}`)
        } catch (error) {
            console.error('인증 오류:', error)
            setErrorMessage('인증번호가 올바르지 않습니다. 다시 확인해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    // 타이머 처리
    useEffect(() => {
        let timer: NodeJS.Timeout

        if (isTimerActive && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1)
            }, 1000)
        } else if (timeLeft === 0) {
            setIsTimerActive(false)
            setIsExpired(true)
        }

        return () => {
            if (timer) clearInterval(timer)
        }
    }, [isTimerActive, timeLeft])

    // 타이머 포맷팅 (분:초)
    const formatTime = () => {
        const minutes = Math.floor(timeLeft / 60)
        const seconds = timeLeft % 60
        return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`
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
                        <span className="text-black"> 찾기</span>
                    </h1>
                    <p className="text-base text-gray-600 mt-2 text-center">
                        가입 시 등록한 휴대폰 번호로 인증 후 비밀번호를 재설정할 수 있습니다
                    </p>
                </div>

                {errorMessage && (
                    <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                        <p>{errorMessage}</p>
                    </div>
                )}

                <form className="space-y-6">
                    <div className="space-y-3">
                        <label htmlFor="phoneNumber" className="block text-gray-700 text-lg">
                            휴대폰 번호
                        </label>
                        <div className="flex space-x-2">
                            <input
                                id="phoneNumber"
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => {
                                    setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))
                                    setErrorMessage('')
                                }}
                                placeholder="휴대폰 번호를 입력하세요"
                                className="flex-1 px-5 py-4 text-lg text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSendVerification}
                                className={`px-4 py-2 text-lg bg-[#9C50D4] text-white rounded-lg hover:bg-[#8a45bc] transition-colors ${
                                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                                disabled={isLoading}
                                type="button"
                            >
                                {isLoading ? '처리 중...' : isSent && isExpired ? '재전송' : '인증번호 발송'}
                            </button>
                        </div>
                        <p className="text-sm text-gray-500">숫자만 입력해주세요</p>
                    </div>

                    {isSent && (
                        <div className={`space-y-3 ${isExpired ? 'opacity-80' : ''}`}>
                            <div className="flex justify-between items-center">
                                <label htmlFor="verificationCode" className="block text-gray-700 text-lg">
                                    인증번호
                                </label>
                                {isTimerActive && !isExpired && (
                                    <span className="text-red-500 font-medium">{formatTime()}</span>
                                )}
                                {isExpired && <span className="text-red-500 font-medium">만료됨</span>}
                            </div>
                            <input
                                id="verificationCode"
                                type="text"
                                value={verificationCode}
                                onChange={(e) => {
                                    setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))
                                    setErrorMessage('')
                                }}
                                placeholder="인증번호 6자리 입력"
                                className={`w-full px-5 py-4 text-lg text-black rounded-lg border ${
                                    isExpired ? 'border-red-300' : 'border-gray-300'
                                } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                maxLength={6}
                                inputMode="numeric"
                                disabled={isExpired || isLoading}
                            />
                            {isExpired && (
                                <p className="text-red-500 text-sm mt-1">
                                    인증번호가 만료되었습니다. 인증번호를 재전송해주세요.
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleVerify}
                        disabled={!isSent || isExpired || isLoading}
                        className={`w-full py-4 text-lg ${
                            !isSent || isExpired || isLoading
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-[#9C50D4] hover:bg-[#8a45bc]'
                        } text-white rounded-lg transition-colors mt-6`}
                    >
                        {isLoading ? '확인 중...' : '다음'}
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
