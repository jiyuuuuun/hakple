'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { fetchApi } from '@/utils/api'

// API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8090'

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        phoneNumber: '',
        verificationCode: '',
    })
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [codeSent, setCodeSent] = useState(false)
    const [codeVerified, setCodeVerified] = useState(false)
    const [phoneExists, setPhoneExists] = useState(false)
    const [timeLeft, setTimeLeft] = useState(180) // 3분 타이머
    const [isTimerActive, setIsTimerActive] = useState(false)
    const [isExpired, setIsExpired] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        // 숫자만 입력 허용
        const sanitizedValue =
            name === 'phoneNumber' || name === 'verificationCode' ? value.replace(/[^0-9]/g, '') : value

        setFormData((prev) => ({ ...prev, [name]: sanitizedValue }))

        // 휴대폰 번호가 변경되면 관련 상태 초기화
        if (name === 'phoneNumber') {
            setCodeSent(false)
            setIsTimerActive(false)
            setCodeVerified(false)
            setPhoneExists(false)
            setIsExpired(false)
        }

        // 인증번호가 변경되면 인증 상태 초기화
        if (name === 'verificationCode') {
            setCodeVerified(false)
        }

        // 에러 메시지 초기화
        setErrorMessage('')
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

    // 인증번호 전송 처리
    const handleSendVerification = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.phoneNumber) {
            setErrorMessage('휴대폰 번호를 입력해주세요.')
            return
        }

        // 전화번호 형식 검증 (간단한 검증)
        if (formData.phoneNumber.length < 10 || formData.phoneNumber.length > 11) {
            setErrorMessage('올바른 휴대폰 번호를 입력해주세요.')
            return
        }

        setIsLoading(true)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            // 먼저 휴대폰 번호 존재 여부 확인
            const phoneCheckResponse = await fetchApi(
                `${API_BASE_URL}/api/v1/users/check-phonenum?phoneNum=${formData.phoneNumber}`,
                {
                    method: 'GET',
                },
            )

            if (!phoneCheckResponse.ok) {
                throw new Error(`휴대폰 번호 확인 실패: ${phoneCheckResponse.status}`)
            }

            // 응답 데이터 읽기 (Boolean 타입)
            const isAvailable = (await phoneCheckResponse.json()) as boolean

            // 이미 등록된 번호인 경우에만 인증번호 전송 (false = 이미 사용중인 번호)
            if (isAvailable) {
                setErrorMessage('입력한 휴대폰 번호로 가입된 회원이 없습니다.')
                setIsLoading(false)
                return
            }

            setPhoneExists(true)

            // 인증번호 요청 - 휴대폰 번호가 이미 존재할 때만 실행 (isAvailable이 false일 때)
            const response = await fetchApi(`${API_BASE_URL}/api/v1/sms/send?phone=${formData.phoneNumber}`, {
                method: 'POST',
            })

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('존재하지 않는 사용자입니다.')
                } else {
                    throw new Error(`인증번호 전송 실패: ${response.status}`)
                }
            }

            // 성공적으로 전송됨
            setCodeSent(true)
            setTimeLeft(180)
            setIsTimerActive(true)
            setIsExpired(false)
            setFormData((prev) => ({ ...prev, verificationCode: '' })) // 재전송 시 인증번호 초기화
            setSuccessMessage('인증번호가 전송되었습니다. 인증번호를 입력해주세요.')
        } catch (error) {
            console.error('인증번호 전송 오류:', error)
            setErrorMessage(error instanceof Error ? error.message : '인증번호 전송에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    // 인증 완료 처리
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.verificationCode) {
            setErrorMessage('인증번호를 입력해주세요.')
            return
        }

        if (formData.verificationCode.length !== 6) {
            setErrorMessage('인증번호 6자리를 모두 입력해주세요.')
            return
        }

        if (isExpired) {
            setErrorMessage('인증번호가 만료되었습니다. 인증번호를 재전송해주세요.')
            return
        }

        setIsLoading(true)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            const response = await fetchApi(
                `${API_BASE_URL}/api/v1/sms/verify?phone=${formData.phoneNumber}&code=${formData.verificationCode}`,
                {
                    method: 'POST',
                },
            )

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('인증번호가 일치하지 않습니다.')
                } else {
                    throw new Error(`인증 확인 실패: ${response.status}`)
                }
            }

            // 인증 성공
            setCodeVerified(true)
            setIsTimerActive(false)
            setSuccessMessage('휴대폰 번호 인증이 완료되었습니다.')
        } catch (error) {
            console.error('인증 오류:', error)
            setErrorMessage(error instanceof Error ? error.message : '인증번호가 올바르지 않습니다. 다시 확인해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    // 비밀번호 재설정 진행
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.phoneNumber) {
            setErrorMessage('휴대폰 번호를 입력해주세요.')
            return
        }

        // 휴대폰 인증이 완료되지 않은 경우
        if (!codeVerified) {
            setErrorMessage('휴대폰 번호 인증을 완료해주세요.')
            return
        }

        setIsLoading(true)
        setSuccessMessage('인증이 완료되었습니다. 비밀번호 재설정 페이지로 이동합니다.')

        // 잠시 후 페이지 이동
        setTimeout(() => {
            // 페이지 이동 시 phoneNumber를 state로 전달하여 비밀번호 재설정에 사용
            router.push(`/reset-password?phone=${encodeURIComponent(formData.phoneNumber)}`)
        }, 1500)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5EEF8] px-4">
            <div className="w-full max-w-[600px] bg-white rounded-3xl p-12 shadow-lg mt-[-100px]">
                <div className="flex flex-col items-center mb-8">
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

                {successMessage && (
                    <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
                        <p>{successMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label htmlFor="phoneNumber" className="block text-gray-700 text-lg">
                            휴대폰 번호
                        </label>
                        <div className="flex space-x-2">
                            <input
                                id="phoneNumber"
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                placeholder="휴대폰 번호를 입력하세요"
                                className={`flex-1 px-5 py-4 text-lg text-black rounded-lg border ${
                                    phoneExists ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                                } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                disabled={isLoading || codeSent}
                            />
                            <button
                                type="button"
                                onClick={handleSendVerification}
                                className={`px-4 py-2 whitespace-nowrap text-base ${
                                    codeSent ? 'bg-green-500 text-white' : 'bg-[#9C50D4] text-white hover:bg-[#8a45bc]'
                                } rounded-lg transition-colors`}
                                disabled={isLoading || !formData.phoneNumber || codeSent}
                            >
                                {isLoading ? '처리 중...' : codeSent ? '전송됨' : '인증번호 받기'}
                            </button>
                        </div>
                        <p className="text-sm text-gray-500">숫자만 입력해주세요</p>
                    </div>

                    {/* 인증번호 입력 필드 (코드 전송 후 표시) */}
                    {codeSent && !codeVerified && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label htmlFor="verificationCode" className="block text-gray-700 text-lg">
                                    인증번호
                                </label>
                                {isTimerActive && !isExpired && (
                                    <span className="text-red-500 font-medium">{formatTime()}</span>
                                )}
                                {isExpired && <span className="text-red-500 font-medium">만료됨</span>}
                            </div>
                            <div className="flex space-x-2">
                                <input
                                    id="verificationCode"
                                    name="verificationCode"
                                    type="text"
                                    value={formData.verificationCode}
                                    onChange={handleChange}
                                    placeholder="인증번호 6자리를 입력하세요"
                                    className={`flex-1 px-5 py-4 text-lg text-black rounded-lg border ${
                                        isExpired
                                            ? 'border-red-300'
                                            : codeVerified
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-300 bg-gray-50'
                                    } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                    maxLength={6}
                                    disabled={isLoading || codeVerified || isExpired}
                                />
                                <button
                                    type="button"
                                    onClick={handleVerify}
                                    className="px-4 py-2 whitespace-nowrap text-base bg-[#9C50D4] text-white hover:bg-[#8a45bc] rounded-lg transition-colors"
                                    disabled={
                                        isLoading || formData.verificationCode.length !== 6 || codeVerified || isExpired
                                    }
                                >
                                    {isLoading ? '확인 중...' : '확인'}
                                </button>
                            </div>
                            {isExpired && (
                                <p className="text-red-500 text-sm mt-1">
                                    인증번호가 만료되었습니다. 인증번호를 재전송해주세요.
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !codeVerified}
                        className={`w-full py-4 text-lg ${
                            isLoading || !codeVerified
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-[#9C50D4] hover:bg-[#8a45bc]'
                        } text-white rounded-lg transition-colors mt-6`}
                    >
                        {isLoading ? '처리 중...' : '비밀번호 재설정'}
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
