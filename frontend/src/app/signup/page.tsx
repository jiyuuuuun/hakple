'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { fetchApi } from '@/utils/api'
import { useRouter } from 'next/navigation'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8090'

export default function Signup() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        nickname: '',
        phone: '',
        id: '',
        password: '',
        confirmPassword: '',
        verificationCode: '',
    })
    const [agreeToTerms, setAgreeToTerms] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [codeSent, setCodeSent] = useState(false)
    const [codeVerified, setCodeVerified] = useState(false)

    // Track validation status
    const [validations, setValidations] = useState({
        idChecked: false,
        phoneChecked: false,
    })

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })

        // Reset validation when user changes related fields
        if (name === 'id') {
            setValidations((prev) => ({ ...prev, idChecked: false }))
        } else if (name === 'phone') {
            setValidations((prev) => ({ ...prev, phoneChecked: false }))
            setCodeSent(false)
            setCodeVerified(false)
        } else if (name === 'verificationCode') {
            setCodeVerified(false)
        }

        // Clear error when user starts typing
        setErrorMessage('')
    }

    const checkIdDuplicate = async () => {
        const fieldValue = formData.id

        if (!fieldValue) {
            setErrorMessage('아이디를 먼저 입력해주세요.')
            return
        }

        setIsLoading(true)
        setErrorMessage('')

        try {
            // 백엔드 API 호출 (직접 fetch 사용)
            const response = await fetchApi(`${API_BASE_URL}/api/v1/users/check-username?userName=${fieldValue}`, {
                method: 'GET',
            })

            if (!response.ok) {
                throw new Error(`아이디 중복 확인 실패: ${response.status}`)
            }

            const isAvailable = await response.json()

            if (isAvailable) {
                setValidations((prev) => ({
                    ...prev,
                    idChecked: true,
                }))
                setSuccessMessage('아이디 사용 가능합니다.')
            } else {
                setErrorMessage('이미 사용 중인 아이디입니다.')
            }
        } catch (error) {
            console.error('중복 확인 중 오류 발생:', error)
            setErrorMessage('서버 연결에 문제가 있습니다. 네트워크 연결을 확인하세요.')
        } finally {
            setIsLoading(false)
        }
    }

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
            // 먼저 휴대폰 번호 중복 확인
            let duplicateCheckResponse
            try {
                duplicateCheckResponse = await fetchApi(
                    `${API_BASE_URL}/api/v1/users/check-phonenum?phoneNum=${phone}`,
                    {
                        method: 'GET',
                    },
                )

                if (!duplicateCheckResponse.ok) {
                    throw new Error(`휴대폰 번호 중복 확인 실패: ${duplicateCheckResponse.status}`)
                }
            } catch (error) {
                console.error('휴대폰 번호 중복 확인 중 오류:', error)
                setErrorMessage('서버 연결에 문제가 있습니다. 네트워크 연결을 확인하세요.')
                setIsLoading(false)
                return
            }

            // 응답 데이터 읽기 (Boolean 타입)
            const isAvailable = (await duplicateCheckResponse.json()) as boolean

            // false이면 이미 사용 중인 번호
            if (!isAvailable) {
                setErrorMessage('이미 사용 중인 휴대폰 번호입니다.')
                setIsLoading(false)
                return
            }

            // 인증번호 요청 - isAvailable이 true일 때만 실행 (사용 가능한 번호)
            try {
                const smsResponse = await fetchApi('/api/v1/sms/send?phone=${phone}', {
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
            console.error('인증번호 전송 중 오류:', error)
            setErrorMessage('인증번호 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

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
            const response = await fetchApi('/api/v1/sms/verify?phone=${phone}&code=${verificationCode}', {
                method: 'POST',
            })

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
            setValidations((prev) => ({ ...prev, phoneChecked: true }))
            setSuccessMessage('휴대폰 번호 인증이 완료되었습니다.')
        } catch (error) {
            console.error('인증번호 확인 중 오류 발생:', error)
            setErrorMessage('서버 연결에 문제가 있습니다. 네트워크 연결을 확인하세요.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrorMessage('')

        // Validate inputs
        if (!formData.nickname || !formData.password || !formData.id || !formData.phone) {
            setErrorMessage('모든 필드를 입력해주세요.')
            return
        }

        if (formData.password.length < 8 || formData.password.length > 15) {
            setErrorMessage('비밀번호는 8자~15자 이어야 합니다.')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setErrorMessage('비밀번호가 일치하지 않습니다.')
            return
        }

        if (!validations.idChecked) {
            setErrorMessage('아이디 중복확인이 필요합니다.')
            return
        }

        if (!validations.phoneChecked) {
            setErrorMessage('휴대폰 번호 인증이 필요합니다.')
            return
        }

        if (!agreeToTerms) {
            setErrorMessage('이용약관에 동의해주세요.')
            return
        }

        setIsLoading(true)
        setErrorMessage('')
        setSuccessMessage('회원가입 처리 중...')

        try {
            // API 기본 URL 설정
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090'

            // 백엔드 API 호출
            const requestData = {
                userName: formData.id,
                password: formData.password,
                nickName: formData.nickname,
                phoneNum: formData.phone,
            }

            const response = await fetchApi('/api/v1/users/userreg', {
                method: 'POST',
                body: JSON.stringify(requestData),
            })

            // 응답 상태 코드로 성공/실패 판단하기
            if (!response.ok) {
                // 오류 응답인 경우에만 응답 본문 읽기
                const errorText = await response.text()
                throw new Error(errorText || `회원가입 실패: ${response.status}`)
            }

            // 성공시 응답 본문 읽지 않고 바로 처리
            setSuccessMessage('회원가입이 성공적으로 완료되었습니다!')

            // 성공 페이지로 이동
            router.push('/signup/success')
        } catch (error) {
            console.error('회원가입 중 오류 발생:', error)
            setErrorMessage(error instanceof Error ? error.message : '회원가입 처리 중 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    // Check if form is valid
    const isFormValid = () => {
        return (
            formData.nickname &&
            formData.id &&
            formData.phone &&
            formData.password &&
            formData.password === formData.confirmPassword &&
            validations.idChecked &&
            validations.phoneChecked &&
            agreeToTerms
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5EEF8] px-4 py-8">
            <div className="w-full max-w-[600px] bg-white rounded-3xl p-12 shadow-lg">
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="cursor-pointer">
                        <Image src="/logo.png" alt="Hakple 로고" width={120} height={120} className="mb-2" />
                    </Link>
                    <h1 className="text-4xl font-bold text-center">
                        <span className="text-[#9C50D4]">회원</span>
                        <span className="text-black">가입</span>
                    </h1>
                    <p className="text-base text-gray-600 mt-2 text-center">Hakple에 오신 것을 환영합니다!</p>
                </div>

                {/* 성공 메시지 */}
                {successMessage && (
                    <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
                        <p>{successMessage}</p>
                    </div>
                )}

                {/* 에러 메시지 */}
                {errorMessage && (
                    <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                        <p>{errorMessage}</p>
                    </div>
                )}

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* 닉네임 */}
                    <div className="space-y-2">
                        <label htmlFor="nickname" className="block text-base font-medium text-gray-700">
                            닉네임
                        </label>
                        <input
                            id="nickname"
                            name="nickname"
                            type="text"
                            required
                            placeholder="닉네임을 입력하세요"
                            value={formData.nickname}
                            onChange={handleChange}
                            className="w-full px-4 py-3 text-base text-black rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled={isLoading}
                        />
                    </div>

                    {/* 휴대폰 번호 */}
                    <div className="space-y-2">
                        <label htmlFor="phone" className="block text-base font-medium text-gray-700">
                            휴대폰 번호
                        </label>
                        <div className="flex space-x-2">
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                placeholder="휴대폰 번호를 입력하세요 (숫자만)"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`flex-1 px-4 py-3 text-base text-black rounded-lg border ${
                                    validations.phoneChecked
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-300 bg-gray-50'
                                } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                disabled={isLoading || validations.phoneChecked}
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
                    </div>

                    {/* 인증번호 입력 필드 (코드 전송 후 표시) */}
                    {codeSent && !validations.phoneChecked && (
                        <div className="space-y-2">
                            <label htmlFor="verificationCode" className="block text-base font-medium text-gray-700">
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
                                    className={`flex-1 px-4 py-3 text-base text-black rounded-lg border ${
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

                    {/* 아이디 */}
                    <div className="space-y-2">
                        <label htmlFor="id" className="block text-base font-medium text-gray-700">
                            아이디
                        </label>
                        <div className="flex space-x-2">
                            <input
                                id="id"
                                name="id"
                                type="text"
                                required
                                placeholder="아이디를 입력하세요"
                                value={formData.id}
                                onChange={handleChange}
                                className={`flex-1 px-4 py-3 text-base text-black rounded-lg border ${
                                    validations.idChecked
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-300 bg-gray-50'
                                } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={checkIdDuplicate}
                                className={`px-4 py-2 whitespace-nowrap text-base ${
                                    validations.idChecked
                                        ? 'bg-green-500 text-white'
                                        : 'bg-[#9C50D4] text-white hover:bg-[#8a45bc]'
                                } rounded-lg transition-colors`}
                                disabled={isLoading || !formData.id}
                            >
                                {isLoading && formData.id && !validations.idChecked
                                    ? '확인 중...'
                                    : validations.idChecked
                                    ? '확인 완료'
                                    : '중복확인'}
                            </button>
                        </div>
                    </div>

                    {/* 비밀번호 */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-base font-medium text-gray-700">
                            비밀번호
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="비밀번호를 입력하세요"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 text-base text-black rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled={isLoading}
                        />
                        <p className="text-sm text-gray-500">비밀번호는 8자~15자 이어야 합니다.</p>
                    </div>

                    {/* 비밀번호 확인 */}
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-700">
                            비밀번호 확인
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            placeholder="비밀번호를 다시 입력하세요"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-3 text-base text-black rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled={isLoading}
                        />
                    </div>

                    {/* 이용약관 동의 */}
                    <div className="flex items-center space-x-2 mt-4">
                        <input
                            id="agreeToTerms"
                            type="checkbox"
                            checked={agreeToTerms}
                            onChange={() => setAgreeToTerms(!agreeToTerms)}
                            className="w-5 h-5 text-[#9C50D4] border-gray-300 rounded focus:ring-[#9C50D4]"
                            disabled={isLoading}
                        />
                        <label htmlFor="agreeToTerms" className="text-base text-gray-900">
                            <span>이용약관에 동의합니다.</span>
                            <Link href="/terms" className="text-[#9C50D4] ml-1 hover:underline">
                                (약관보기)
                            </Link>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className={`w-full py-3 px-4 rounded-xl text-white text-lg font-bold ${
                            isFormValid() ? 'bg-[#9C50D4] hover:bg-[#8a45bc]' : 'bg-gray-400 cursor-not-allowed'
                        } transition-colors mt-6`}
                        disabled={!isFormValid() || isLoading}
                    >
                        {isLoading ? '처리 중...' : '회원가입'}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-base text-gray-700">
                        이미 계정이 있으신가요?{' '}
                        <Link href="/login" className="text-[#9C50D4] hover:underline">
                            로그인
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
