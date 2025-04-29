'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { fetchApi } from '@/utils/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8090'

export default function ForgotUsername() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        phone: '',
        verificationCode: '',
    })
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [codeSent, setCodeSent] = useState(false)
    const [codeVerified, setCodeVerified] = useState(false)
    const [phoneExists, setPhoneExists] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))

        // 휴대폰 번호가 변경되면 관련 상태 초기화
        if (name === 'phone') {
            setCodeSent(false)
            setCodeVerified(false)
            setPhoneExists(false)
        }

        // 인증번호가 변경되면 인증 상태 초기화
        if (name === 'verificationCode') {
            setCodeVerified(false)
        }

        // 에러 메시지 초기화
        setErrorMessage('')
    }

    // 휴대폰 번호 존재 여부 확인 및 인증번호 전송
    const sendVerificationCode = async () => {
        const phone = formData.phone

        if (!phone) {
            setErrorMessage('휴대폰 번호를 먼저 입력해주세요.')
            return
        }

        // 휴대폰 번호 형식 검사 (숫자만)
        if (!/^\d+$/.test(phone)) {
            setErrorMessage('휴대폰 번호는 숫자만 입력 가능합니다.')
            return
        }

        setIsLoading(true)
        setErrorMessage('')

        try {
            // 휴대폰 번호 존재 여부 확인
            const phoneCheckResponse = await fetchApi(`${API_BASE_URL}/api/v1/users/check-phonenum?phoneNum=${phone}`, {
                method: 'GET',
            })

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
            try {
                const smsResponse = await fetchApi(`${API_BASE_URL}/api/v1/sms/send?phone=${phone}`, {
                    method: 'POST',
                })

                if (!smsResponse.ok) {
                    throw new Error(`인증번호 전송 실패: ${smsResponse.status}`)
                }

                setCodeSent(true)
                setSuccessMessage('인증번호가 전송되었습니다. 인증번호를 입력해주세요.')
            } catch (error) {
                console.error('인증번호 전송 API 호출 중 오류:', error)
                setErrorMessage('인증번호 전송에 실패했습니다. 네트워크 연결을 확인하세요.')
                return
            }
        } catch (error) {
            console.error('휴대폰 번호 확인 중 오류:', error)
            setErrorMessage('서버 연결에 문제가 있습니다. 네트워크 연결을 확인하세요.')
        } finally {
            setIsLoading(false)
        }
    }

    // 인증번호 확인
    const verifyCode = async () => {
        const { phone, verificationCode } = formData

        if (!verificationCode) {
            setErrorMessage('인증번호를 입력해주세요.')
            return
        }

        setIsLoading(true)
        setErrorMessage('')

        try {
            // 인증번호 확인 API 호출
            const response = await fetchApi(
                `${API_BASE_URL}/api/v1/sms/verify?phone=${phone}&code=${verificationCode}`,
                {
                    method: 'POST',
                },
            )

            if (!response.ok) {
                if (response.status === 401) {
                    setErrorMessage('인증번호가 일치하지 않습니다.')
                } else {
                    setErrorMessage(`인증 확인 실패: ${response.status}`)
                }
                setIsLoading(false)
                return
            }

            // 인증 성공
            setCodeVerified(true)
            setSuccessMessage('휴대폰 번호 인증이 완료되었습니다.')
        } catch (error) {
            console.error('인증번호 확인 중 오류 발생:', error)
            setErrorMessage('서버 연결에 문제가 있습니다. 네트워크 연결을 확인하세요.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.phone) {
            setErrorMessage('휴대폰 번호를 입력해주세요.')
            return
        }

        // 휴대폰 인증이 완료되지 않은 경우
        if (!codeVerified) {
            setErrorMessage('휴대폰 번호 인증을 완료해주세요.')
            return
        }

        setIsLoading(true)
        setErrorMessage('')

        try {
            // API 요청 (휴대폰 번호만으로 아이디 찾기)
            const response = await fetchApi(`${API_BASE_URL}/api/v1/usernames/find-username`, {
                method: 'POST',
                body: JSON.stringify({
                    phoneNum: formData.phone,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || `아이디 찾기 실패: ${response.status}`)
            }

            // 응답 처리
            const data = await response.json()

            // API 응답에서 user_name 필드 추출
            const username = data.userName

            if (username) {
                // 찾은 아이디 저장 후 결과 페이지로 이동
                localStorage.setItem('foundUsername', username)
                router.push('/forgot-username/result')
            } else {
                setErrorMessage('일치하는 회원 정보를 찾을 수 없습니다.')
            }
        } catch (error) {
            console.error('아이디 찾기 요청 오류:', error)
            setErrorMessage(error instanceof Error ? error.message : '일치하는 회원 정보를 찾을 수 없습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5EEF8] px-4">
            <div className="w-full max-w-[600px] bg-white rounded-3xl p-12 shadow-lg mt-[-100px]">
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="cursor-pointer">
                        <Image src="/logo.png" alt="Hakple 로고" width={120} height={120} className="mb-2" />
                    </Link>
                    <h1 className="text-4xl font-bold text-center">
                        <span className="text-[#9C50D4]">아이디</span>
                        <span className="text-black"> 찾기</span>
                    </h1>
                    <p className="text-base text-gray-600 mt-2 text-center">
                        가입 시 등록한 휴대폰 번호로 아이디를 찾을 수 있습니다
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
                        <label htmlFor="phone" className="block text-gray-700 text-lg">
                            휴대폰 번호
                        </label>
                        <div className="flex space-x-2">
                            <input
                                id="phone"
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="휴대폰 번호를 입력하세요"
                                className={`flex-1 px-5 py-4 text-lg text-black rounded-lg border ${
                                    phoneExists ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                                } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                disabled={isLoading || codeSent}
                            />
                            <button
                                type="button"
                                onClick={sendVerificationCode}
                                className={`px-4 py-2 whitespace-nowrap text-base ${
                                    codeSent ? 'bg-green-500 text-white' : 'bg-[#9C50D4] text-white hover:bg-[#8a45bc]'
                                } rounded-lg transition-colors`}
                                disabled={isLoading || !formData.phone || codeSent}
                            >
                                {isLoading ? '처리 중...' : codeSent ? '전송됨' : '인증번호 받기'}
                            </button>
                        </div>
                        <p className="text-sm text-gray-500">숫자만 입력해주세요</p>
                    </div>

                    {/* 인증번호 입력 필드 (코드 전송 후 표시) */}
                    {codeSent && !codeVerified && (
                        <div className="space-y-3">
                            <label htmlFor="verificationCode" className="block text-gray-700 text-lg">
                                인증번호
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    id="verificationCode"
                                    name="verificationCode"
                                    type="text"
                                    placeholder="인증번호 6자리를 입력하세요"
                                    value={formData.verificationCode}
                                    onChange={handleChange}
                                    className={`flex-1 px-5 py-4 text-lg text-black rounded-lg border ${
                                        codeVerified ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                                    } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                    disabled={isLoading || codeVerified}
                                />
                                <button
                                    type="button"
                                    onClick={verifyCode}
                                    className="px-4 py-2 whitespace-nowrap text-base bg-[#9C50D4] text-white hover:bg-[#8a45bc] rounded-lg transition-colors"
                                    disabled={isLoading || !formData.verificationCode || codeVerified}
                                >
                                    {isLoading ? '확인 중...' : '확인'}
                                </button>
                            </div>
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
                        {isLoading ? '처리 중...' : '아이디 찾기'}
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
