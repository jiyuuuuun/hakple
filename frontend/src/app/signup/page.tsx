'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Signup() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        nickname: '',
        phone: '',
        id: '',
        password: '',
        confirmPassword: '',
    })
    const [agreeToTerms, setAgreeToTerms] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Track validation status
    const [validations, setValidations] = useState({
        nicknameChecked: false,
        idChecked: false,
    })

    // 각 필드별 유효성 검사 결과 상태
    const [fieldErrors, setFieldErrors] = useState({
        nickname: '',
        phone: '',
        id: '',
        password: '',
        confirmPassword: '',
    })

    // 유효성 검증 함수
    const validateNickname = (value: string): string => {
        if (!value) return ''
        return /^[가-힣a-zA-Z0-9._-]{2,20}$/.test(value)
            ? ''
            : '닉네임은 한글/영문/숫자와 특수기호(_, -, .)만 사용할 수 있으며 공백 없이 2~20자여야 합니다.'
    }

    const validateId = (value: string): string => {
        if (!value) return ''
        return value.length >= 4 && value.length <= 15 ? '' : '아이디는 최소 4자 최대 15자까지 입력 가능합니다.'
    }

    const validatePassword = (value: string): string => {
        if (!value) return ''
        return /^.{8,15}$/.test(value) ? '' : '비밀번호는 최소 8자 이상 15자까지 입력 가능합니다.'
    }

    const validatePhone = (value: string): string => {
        if (!value) return ''
        return /^01[0-9]{1}-?[0-9]{3,4}-?[0-9]{4}$/.test(value) ? '' : '전화번호는 10~11자리 숫자만 입력 가능합니다.'
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))

        // 입력값에 대한 즉각적인 유효성 검사
        switch (name) {
            case 'nickname':
                setFieldErrors((prev) => ({ ...prev, nickname: validateNickname(value) }))
                // 값이 변경되면 중복확인 상태 초기화
                if (validations.nicknameChecked) {
                    setValidations((prev) => ({ ...prev, nicknameChecked: false }))
                }
                break
            case 'id':
                setFieldErrors((prev) => ({ ...prev, id: validateId(value) }))
                // 값이 변경되면 중복확인 상태 초기화
                if (validations.idChecked) {
                    setValidations((prev) => ({ ...prev, idChecked: false }))
                }
                break
            case 'password':
                setFieldErrors((prev) => ({ ...prev, password: validatePassword(value) }))
                // 비밀번호 변경 시 확인 비밀번호도 체크
                if (formData.confirmPassword) {
                    setFieldErrors((prev) => ({
                        ...prev,
                        confirmPassword: value !== formData.confirmPassword ? '비밀번호가 일치하지 않습니다.' : '',
                    }))
                }
                break
            case 'confirmPassword':
                setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: formData.password !== value ? '비밀번호가 일치하지 않습니다.' : '',
                }))
                break
            case 'phone':
                setFieldErrors((prev) => ({ ...prev, phone: validatePhone(value) }))
                break
        }

        // Clear error when user starts typing
        setErrorMessage('')
    }

    const checkDuplicate = async (type: 'nickname' | 'id') => {
        const fieldValue = formData[type]

        // 각 필드별 유효성 검사 먼저 수행
        let isValid = false
        if (type === 'nickname') {
            isValid = validateNickname(fieldValue) === ''
        } else {
            isValid = validateId(fieldValue) === ''
        }

        if (!isValid || !fieldValue) {
            setErrorMessage(
                type === 'nickname' ? '닉네임 형식이 올바르지 않습니다.' : '아이디 형식이 올바르지 않습니다.',
            )
            return
        }

        setIsLoading(true)
        setErrorMessage('')

        try {
            // 실제 백엔드 API에 중복 확인 요청
            const response = await fetch('http://localhost:8090/api/v1/users/check-duplicate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    field: type === 'nickname' ? 'nickName' : 'userName',
                    value: fieldValue,
                }),
            })

            if (response.ok) {
                // 중복 확인 성공
                setValidations((prev) => ({
                    ...prev,
                    [type === 'nickname' ? 'nicknameChecked' : 'idChecked']: true,
                }))
                setErrorMessage('')
            } else {
                // 중복인 경우 또는 다른 오류 발생
                const errorText = await response.text()

                if (errorText.includes('DUPLICATE')) {
                    setErrorMessage(`이미 사용 중인 ${type === 'nickname' ? '닉네임' : '아이디'}입니다.`)
                } else {
                    setErrorMessage('중복 확인 중 오류가 발생했습니다: ' + errorText)
                }

                // 중복 확인 상태 초기화
                setValidations((prev) => ({
                    ...prev,
                    [type === 'nickname' ? 'nicknameChecked' : 'idChecked']: false,
                }))
            }
        } catch (error) {
            console.error('중복 확인 중 오류 발생:', error)
            setErrorMessage('서버 연결 중 오류가 발생했습니다.')
            // 중복 확인 상태 초기화
            setValidations((prev) => ({
                ...prev,
                [type === 'nickname' ? 'nicknameChecked' : 'idChecked']: false,
            }))
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrorMessage('')

        // 유효성 검사
        if (fieldErrors.nickname || !formData.nickname) {
            setErrorMessage('닉네임을 올바르게 입력해주세요.')
            return
        }

        if (fieldErrors.id || !formData.id) {
            setErrorMessage('아이디를 올바르게 입력해주세요.')
            return
        }

        if (fieldErrors.password || !formData.password) {
            setErrorMessage('비밀번호를 올바르게 입력해주세요.')
            return
        }

        if (fieldErrors.phone || !formData.phone) {
            setErrorMessage('전화번호를 올바르게 입력해주세요.')
            return
        }

        // 비밀번호 일치 확인
        if (formData.password !== formData.confirmPassword) {
            setErrorMessage('비밀번호가 일치하지 않습니다.')
            return
        }

        // 중복확인 여부 검사
        if (!validations.nicknameChecked) {
            setErrorMessage('닉네임 중복확인이 필요합니다.')
            return
        }

        if (!validations.idChecked) {
            setErrorMessage('아이디 중복확인이 필요합니다.')
            return
        }

        if (!agreeToTerms) {
            setErrorMessage('이용약관에 동의해주세요.')
            return
        }

        setIsLoading(true)
        setErrorMessage('회원가입 처리 중...')

        try {
            // 입력데이터로 JSON 생성 및 API 요청
            const response = await fetch('http://localhost:8090/api/v1/users/userreg', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nickName: formData.nickname,
                    userName: formData.id,
                    password: formData.password,
                    phoneNum: formData.phone.replace(/-/g, ''), // 하이픈 제거하여 전송
                }),
            })

            if (response.status >= 200 && response.status < 300) {
                console.log('회원가입 성공')
                // 회원가입 성공
                router.push('/signup/success')
                return
            }

            // 오류 처리
            try {
                const responseText = await response.text()
                console.log('회원가입 응답:', response.status, responseText)

                let errorMsg = '회원가입 처리 중 오류가 발생했습니다.'

                if (response.status === 409) {
                    // 중복 오류 처리
                    if (responseText.includes('USERNAME_DUPLICATE')) {
                        errorMsg = '아이디를 이미 사용 중입니다.'
                        // 중복 확인 상태 초기화
                        setValidations((prev) => ({ ...prev, idChecked: false }))
                    } else if (responseText.includes('NICKNAME_DUPLICATE')) {
                        errorMsg = '닉네임을 이미 사용 중입니다.'
                        // 중복 확인 상태 초기화
                        setValidations((prev) => ({ ...prev, nicknameChecked: false }))
                    } else if (responseText.includes('PHONENUM_DUPLICATE')) {
                        errorMsg = '전화번호를 이미 사용 중입니다.'
                    }
                } else if (response.status === 400) {
                    // 잘못된 요청 처리
                    errorMsg = responseText || '입력 정보를 다시 확인해주세요.'
                }

                setErrorMessage(errorMsg)
            } catch (jsonError) {
                console.error('API 응답 파싱 오류:', jsonError)
                setErrorMessage('회원가입 처리 중 오류가 발생했습니다.')
            }
        } catch (error) {
            console.error('API 요청 중 오류 발생:', error)
            setErrorMessage('서버 연결 중 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    // Check if form is valid
    const isFormValid = () => {
        return (
            formData.nickname &&
            formData.id &&
            formData.password &&
            formData.password === formData.confirmPassword &&
            validations.nicknameChecked &&
            validations.idChecked &&
            agreeToTerms
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9FE] px-4 pt-0">
            <div className="w-full max-w-[600px] bg-white rounded-3xl p-10 shadow-lg mt-[-100px]">
                <div className="flex flex-col items-center mb-8 mt-[-10px]">
                    <Link href="/" className="cursor-pointer">
                        <Image src="/logo.png" alt="Hakple 로고" width={100} height={100} className="mb-2" />
                    </Link>
                    <h1 className="text-3xl font-bold">
                        <span className="text-[#9C50D4]">Hakple</span>
                        <span className="text-black">에 오신 것을 환영합니다</span>
                    </h1>
                </div>

                {/* 에러 메시지 - Hakple 로고와 환영 메시지 아래에 있지만 필요시에만 표시 */}
                {errorMessage &&
                    errorMessage !== '' &&
                    !errorMessage.includes('가능') &&
                    !errorMessage.includes('완료') && (
                        <div className="mb-4 p-3 rounded-md bg-red-100 border-l-4 border-red-500 text-red-700">
                            <p>{errorMessage}</p>
                        </div>
                    )}

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 아이디 */}
                    <div className="flex items-center space-x-4">
                        <label htmlFor="id" className="text-lg font-medium text-gray-700 w-24">
                            아이디
                        </label>
                        <div className="flex-1 flex space-x-2">
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
                                        ? 'border-green-500'
                                        : fieldErrors.id
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                } focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent`}
                            />
                            <button
                                type="button"
                                onClick={() => checkDuplicate('id')}
                                disabled={isLoading || !!fieldErrors.id}
                                className="px-4 py-3 text-base bg-gray-100 text-gray-700 rounded-lg hover:bg-[#9C50D4] hover:text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? '확인 중...' : '중복확인'}
                            </button>
                        </div>
                    </div>
                    {validations.idChecked && !fieldErrors.id && (
                        <div className="ml-28 -mt-2 text-sm text-green-600">사용 가능한 아이디입니다.</div>
                    )}
                    {fieldErrors.id && <div className="ml-28 -mt-2 text-sm text-red-600">{fieldErrors.id}</div>}

                    {/* 비밀번호 */}
                    <div className="flex items-center space-x-4">
                        <label htmlFor="password" className="text-lg font-medium text-gray-700 w-24">
                            비밀번호
                        </label>
                        <div className="flex-1 relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="비밀번호를 입력하세요"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 text-base text-black rounded-lg border ${
                                    fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                                } focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                                <Image
                                    src={showPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                                    alt={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                    width={24}
                                    height={24}
                                />
                            </button>
                        </div>
                    </div>
                    {fieldErrors.password && (
                        <div className="ml-28 -mt-2 text-sm text-red-600">{fieldErrors.password}</div>
                    )}

                    {/* 비밀번호 확인 */}
                    <div className="flex items-center space-x-4">
                        <label htmlFor="confirmPassword" className="text-base font-medium text-gray-700 w-24">
                            비밀번호 확인
                        </label>
                        <div className="flex-1 relative">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                placeholder="비밀번호를 다시 입력하세요"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 text-base text-black rounded-lg border ${
                                    fieldErrors.confirmPassword
                                        ? 'border-red-500'
                                        : formData.confirmPassword && formData.password === formData.confirmPassword
                                        ? 'border-green-500'
                                        : 'border-gray-300'
                                } focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                                <Image
                                    src={showConfirmPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                                    alt={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                    width={24}
                                    height={24}
                                />
                            </button>
                        </div>
                    </div>
                    {fieldErrors.confirmPassword && (
                        <div className="ml-28 -mt-2 text-sm text-red-600">{fieldErrors.confirmPassword}</div>
                    )}

                    {/* 닉네임 */}
                    <div className="flex items-center space-x-4">
                        <label htmlFor="nickname" className="text-lg font-medium text-gray-700 w-24">
                            닉네임
                        </label>
                        <div className="flex-1 flex space-x-2">
                            <input
                                id="nickname"
                                name="nickname"
                                type="text"
                                required
                                placeholder="닉네임을 입력하세요"
                                value={formData.nickname}
                                onChange={handleChange}
                                className={`flex-1 px-4 py-3 text-base text-black rounded-lg border ${
                                    validations.nicknameChecked
                                        ? 'border-green-500'
                                        : fieldErrors.nickname
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                } focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent`}
                            />
                            <button
                                type="button"
                                onClick={() => checkDuplicate('nickname')}
                                disabled={isLoading || !!fieldErrors.nickname}
                                className="px-4 py-3 text-base bg-gray-100 text-gray-700 rounded-lg hover:bg-[#9C50D4] hover:text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? '확인 중...' : '중복확인'}
                            </button>
                        </div>
                    </div>
                    {validations.nicknameChecked && !fieldErrors.nickname && (
                        <div className="ml-28 -mt-2 text-sm text-green-600">사용 가능한 닉네임입니다.</div>
                    )}
                    {fieldErrors.nickname && (
                        <div className="ml-28 -mt-2 text-sm text-red-600">{fieldErrors.nickname}</div>
                    )}

                    {/* 휴대폰 번호 */}
                    <div className="flex items-center space-x-4">
                        <label htmlFor="phone" className="text-lg font-medium text-gray-700 w-24">
                            휴대폰 번호
                        </label>
                        <div className="flex-1">
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                placeholder="휴대폰 번호를 입력하세요"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 text-base text-black rounded-lg border ${
                                    fieldErrors.phone ? 'border-red-500' : 'border-gray-300'
                                } focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent`}
                            />
                        </div>
                    </div>
                    {fieldErrors.phone && <div className="ml-28 -mt-2 text-sm text-red-600">{fieldErrors.phone}</div>}

                    {/* 이용약관 */}
                    <div className="flex items-center mt-8 mb-4">
                        <input
                            id="agreeToTerms"
                            name="agreeToTerms"
                            type="checkbox"
                            checked={agreeToTerms}
                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-[#9C50D4] focus:ring-[#9C50D4]"
                        />
                        <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-600">
                            이용약관 및 개인정보처리방침에 동의합니다
                        </label>
                    </div>

                    {/* 회원가입 버튼 */}
                    <button
                        type="submit"
                        disabled={!isFormValid() || isLoading}
                        className={`w-full py-4 text-lg font-medium text-white rounded-lg transition-colors ${
                            isFormValid() && !isLoading
                                ? 'bg-[#9C50D4] hover:bg-[#8a45bc]'
                                : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? '처리 중...' : '회원가입'}
                    </button>

                    {/* 로그인 링크 */}
                    <p className="text-center text-sm text-gray-600 mt-2">
                        이미 계정이 있으신가요?{' '}
                        <Link href="/login" className="text-[#9C50D4] hover:underline">
                            로그인
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
