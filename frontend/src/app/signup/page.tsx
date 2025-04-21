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
        nicknameValid: false,
        idValid: false,
        phoneValid: false,
        passwordValid: false,
        confirmPasswordValid: false,
        nicknameChecked: false,
        idChecked: false,
        phoneChecked: false,
    })

    // 각 필드별 유효성 결과 상태
    const [fieldErrors, setFieldErrors] = useState({
        nickname: '',
        phone: '',
        id: '',
        password: '',
        confirmPassword: '',
    })

    // 각 필드별 유효성 및 오류 메시지 정보
    const fieldValidation = {
        nickname: {
            regex: /^[가-힣a-zA-Z0-9._-]{2,20}$/,
            invalidMessage:
                '닉네임은 한글/영문/숫자와 특수기호 _, -, .만 사용할 수 있으며 공백 없이 2~20자여야 합니다.',
            duplicateMessage: '이미 사용 중인 닉네임입니다.',
            fieldName: 'nickName',
            requiredMessage: '닉네임은 필수 입력값입니다.',
        },
        id: {
            regex: /^[a-zA-Z0-9]{4,15}$/,
            invalidMessage: '아이디는 4~15자 사이여야 합니다.',
            duplicateMessage: '이미 사용 중인 아이디입니다.',
            fieldName: 'userName',
            requiredMessage: '아이디는 필수 입력값입니다.',
        },
        phone: {
            regex: /^01[0-9]{1}-?[0-9]{3,4}-?[0-9]{4}$/,
            invalidMessage: '전화번호는 10~11자리 숫자만 입력 가능합니다. (하이픈 생략 가능)',
            duplicateMessage: '이미 사용 중인 전화번호입니다.',
            fieldName: 'phoneNum',
            requiredMessage: '전화번호는 필수 입력값입니다.',
        },
        password: {
            regex: /^.{8,15}$/,
            invalidMessage: '비밀번호는 8~15자 사이여야 합니다.',
            fieldName: 'password',
            requiredMessage: '비밀번호는 필수 입력값입니다.',
        },
    }

    // 각 필드 유효성 검사 함수
    const validateField = (field: 'nickname' | 'id' | 'phone' | 'password', value: string): string => {
        if (!value) return fieldValidation[field].requiredMessage

        const validation = fieldValidation[field]
        return validation.regex.test(value) ? '' : validation.invalidMessage
    }

    // 입력 필드 변경 핸들러
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))

        // 입력값에 대한 즉각적인 유효성 검사
        let error = ''
        let isValid = false

        if (name === 'nickname' || name === 'id' || name === 'phone' || name === 'password') {
            error = validateField(name, value)
            isValid = error === ''

            setFieldErrors((prev) => ({ ...prev, [name]: error }))
            setValidations((prev) => ({
                ...prev,
                [`${name}Valid`]: isValid,
                // 값이 변경되면 중복확인 상태 초기화 (비밀번호는 제외)
                ...(name === 'nickname' || name === 'id' || name === 'phone' ? { [`${name}Checked`]: false } : {}),
            }))

            // 비밀번호가 변경되면 비밀번호 확인 필드도 체크
            if (name === 'password' && formData.confirmPassword) {
                const confirmError = formData.confirmPassword === value ? '' : '비밀번호가 일치하지 않습니다.'
                setFieldErrors((prev) => ({ ...prev, confirmPassword: confirmError }))
                setValidations((prev) => ({ ...prev, confirmPasswordValid: !confirmError }))
            }
        } else if (name === 'confirmPassword') {
            error = !value
                ? '비밀번호 확인을 입력해주세요.'
                : formData.password !== value
                ? '비밀번호가 일치하지 않습니다.'
                : ''
            isValid = error === ''

            setFieldErrors((prev) => ({ ...prev, confirmPassword: error }))
            setValidations((prev) => ({ ...prev, confirmPasswordValid: isValid }))
        }

        // Clear global error message when user types
        setErrorMessage('')
    }

    // 중복 확인 함수
    const checkDuplicate = async (type: 'nickname' | 'id' | 'phone') => {
        // 형식 검사 먼저 수행
        if (!validations[`${type}Valid`]) {
            setErrorMessage(`${fieldValidation[type].requiredMessage} 또는 형식이 올바르지 않습니다.`)
            return
        }

        let fieldValue = formData[type]
        if (type === 'phone') {
            fieldValue = fieldValue.replace(/-/g, '') // 하이픈 제거
        }

        // API 엔드포인트 매핑
        const endpointMap = {
            nickname: 'check-nickname',
            id: 'check-username',
            phone: 'check-phonenum',
        }

        const endpoint = endpointMap[type]

        setIsLoading(true)
        setErrorMessage('')

        try {
            console.log(`중복 확인 요청: ${type}=${fieldValue}`)

            // 쿼리 매개변수 방식 API 호출
            let url
            if (type === 'nickname') {
                url = `http://localhost:8090/api/v1/users/${endpoint}?nickName=${encodeURIComponent(fieldValue)}`
            } else if (type === 'id') {
                url = `http://localhost:8090/api/v1/users/${endpoint}?userName=${encodeURIComponent(fieldValue)}`
            } else {
                // phone
                url = `http://localhost:8090/api/v1/users/${endpoint}?phoneNum=${encodeURIComponent(fieldValue)}`
            }

            console.log('요청 URL:', url)

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            console.log('응답 상태 코드:', response.status)

            // 응답 처리
            if (response.ok) {
                // 응답이 성공적인 경우
                const responseData = await response.text()
                console.log('중복 확인 응답 데이터:', responseData)

                let isAvailable = false

                try {
                    // 텍스트 응답을 boolean으로 변환 시도
                    if (responseData.trim() === 'true') {
                        isAvailable = true
                    } else if (responseData.trim() === 'false') {
                        isAvailable = false
                    } else {
                        // JSON 파싱 시도
                        const jsonResponse = JSON.parse(responseData)
                        isAvailable = Boolean(jsonResponse)
                    }
                } catch (parseError) {
                    console.error('응답 파싱 오류:', parseError)
                    // 응답을 해석할 수 없는 경우 사용 불가능으로 처리
                    isAvailable = false
                }

                console.log('중복 확인 결과:', isAvailable ? '사용 가능' : '중복')

                if (isAvailable) {
                    // 성공: 중복되지 않음
                    setValidations((prev) => ({
                        ...prev,
                        [`${type}Checked`]: true,
                    }))

                    setFieldErrors((prev) => ({
                        ...prev,
                        [type]: `사용 가능한 ${
                            type === 'nickname' ? '닉네임' : type === 'id' ? '아이디' : '전화번호'
                        }입니다.`,
                    }))

                    // 성공 메시지 제거 (입력창 아래 녹색 메시지만 표시)
                    setErrorMessage('')
                } else {
                    // 실패: 중복됨
                    setValidations((prev) => ({
                        ...prev,
                        [`${type}Checked`]: false,
                    }))

                    setFieldErrors((prev) => ({
                        ...prev,
                        [type]: fieldValidation[type].duplicateMessage,
                    }))
                }
            } else {
                // 응답이 오류인 경우
                const errorText = await response.text()
                console.error('중복 확인 응답 오류:', errorText)

                if (response.status === 409) {
                    // 중복 오류 (HTTP 409 Conflict)
                    setValidations((prev) => ({ ...prev, [`${type}Checked`]: false }))
                    setFieldErrors((prev) => ({ ...prev, [type]: fieldValidation[type].duplicateMessage }))
                } else {
                    // 기타 오류
                    throw new Error(`서버 오류: ${errorText}`)
                }
            }
        } catch (error) {
            console.error('중복 확인 중 오류 발생:', error)

            setValidations((prev) => ({
                ...prev,
                [`${type}Checked`]: false,
            }))

            setFieldErrors((prev) => ({
                ...prev,
                [type]: '서버 연결 중 오류가 발생했습니다.',
            }))

            // 에러 메시지 표시
            setErrorMessage(
                `중복 확인 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
            )
        } finally {
            setIsLoading(false)
        }
    }

    // 폼 제출 핸들러
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrorMessage('')

        // 모든 필드에 대한 유효성 검사 수행
        let hasError = false

        // 아이디 검사
        if (!formData.id) {
            setFieldErrors((prev) => ({ ...prev, id: fieldValidation.id.requiredMessage }))
            hasError = true
        } else if (!validations.idValid) {
            hasError = true
        } else if (!validations.idChecked) {
            setErrorMessage('아이디 중복 확인이 필요합니다.')
            hasError = true
        }

        // 비밀번호 검사
        if (!formData.password) {
            setFieldErrors((prev) => ({ ...prev, password: fieldValidation.password.requiredMessage }))
            hasError = true
        } else if (!validations.passwordValid) {
            hasError = true
        }

        // 비밀번호 확인 검사
        if (!formData.confirmPassword) {
            setFieldErrors((prev) => ({ ...prev, confirmPassword: '비밀번호 확인을 입력해주세요.' }))
            hasError = true
        } else if (formData.password !== formData.confirmPassword) {
            setFieldErrors((prev) => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다.' }))
            hasError = true
        }

        // 닉네임 검사
        if (!formData.nickname) {
            setFieldErrors((prev) => ({ ...prev, nickname: fieldValidation.nickname.requiredMessage }))
            hasError = true
        } else if (!validations.nicknameValid) {
            hasError = true
        } else if (!validations.nicknameChecked) {
            setErrorMessage('닉네임 중복 확인이 필요합니다.')
            hasError = true
        }

        // 전화번호 검사
        if (!formData.phone) {
            setFieldErrors((prev) => ({ ...prev, phone: fieldValidation.phone.requiredMessage }))
            hasError = true
        } else if (!validations.phoneValid) {
            hasError = true
        } else if (!validations.phoneChecked) {
            setErrorMessage('전화번호 중복 확인이 필요합니다.')
            hasError = true
        }

        // 이용약관 동의 검사
        if (!agreeToTerms) {
            setErrorMessage('이용약관에 동의해주세요.')
            hasError = true
        }

        if (hasError) {
            return
        }

        setIsLoading(true)
        setErrorMessage('회원가입 처리 중...')

        try {
            // 전화번호 하이픈 제거
            const cleanedPhone = formData.phone.replace(/-/g, '')

            // 회원가입 API 요청 - DTO 변경 사항 반영 (passwordCheck 필드 추가)
            const response = await fetch('http://localhost:8090/api/v1/users/userreg', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userName: formData.id,
                    password: formData.password,
                    passwordCheck: formData.confirmPassword,
                    nickName: formData.nickname,
                    phoneNum: cleanedPhone,
                }),
            })

            // 응답 처리
            if (response.ok) {
                console.log('회원가입 성공')
                router.push('/signup/success')
                return
            }

            // 오류 처리
            try {
                const responseText = await response.text()
                console.log('회원가입 응답:', response.status, responseText)
                setErrorMessage(responseText || '회원가입 처리 중 오류가 발생했습니다.')
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

    // 폼 전체 유효성 상태 확인
    const isFormValid = () => {
        return (
            validations.nicknameValid &&
            validations.nicknameChecked &&
            validations.idValid &&
            validations.idChecked &&
            validations.phoneValid &&
            validations.phoneChecked &&
            validations.passwordValid &&
            validations.confirmPasswordValid &&
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

                {/* 에러 메시지 */}
                {errorMessage && !errorMessage.includes('처리 중') && (
                    <div className="mb-4 p-3 rounded-md bg-red-100 border-l-4 border-red-500 text-red-700">
                        <p>{errorMessage}</p>
                    </div>
                )}

                {/* 처리 중 메시지 */}
                {errorMessage && errorMessage.includes('처리 중') && (
                    <div className="mb-4 p-3 rounded-md bg-blue-100 border-l-4 border-blue-500 text-blue-700">
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
                                        : validations.idValid
                                        ? 'border-orange-300'
                                        : fieldErrors.id
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                } focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent`}
                            />
                            <button
                                type="button"
                                onClick={() => checkDuplicate('id')}
                                disabled={isLoading || !validations.idValid}
                                className="px-4 py-3 text-sm whitespace-nowrap bg-gray-100 text-gray-700 rounded-lg hover:bg-[#9C50D4] hover:text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading && formData.id === fieldErrors.id ? '확인 중...' : '중복확인'}
                            </button>
                        </div>
                    </div>
                    {validations.idChecked ? (
                        <div className="ml-28 -mt-2 text-sm text-green-600">사용 가능한 아이디입니다.</div>
                    ) : fieldErrors.id ? (
                        <div className="ml-28 -mt-2 text-sm text-red-600">{fieldErrors.id}</div>
                    ) : null}

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
                                    validations.passwordValid && formData.password
                                        ? 'border-green-500'
                                        : fieldErrors.password
                                        ? 'border-red-500'
                                        : 'border-gray-300'
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
                                    validations.confirmPasswordValid && formData.confirmPassword
                                        ? 'border-green-500'
                                        : fieldErrors.confirmPassword
                                        ? 'border-red-500'
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
                                        : validations.nicknameValid
                                        ? 'border-orange-300'
                                        : fieldErrors.nickname
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                } focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent`}
                            />
                            <button
                                type="button"
                                onClick={() => checkDuplicate('nickname')}
                                disabled={isLoading || !validations.nicknameValid}
                                className="px-4 py-3 text-sm whitespace-nowrap bg-gray-100 text-gray-700 rounded-lg hover:bg-[#9C50D4] hover:text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading && formData.nickname === fieldErrors.nickname ? '확인 중...' : '중복확인'}
                            </button>
                        </div>
                    </div>
                    {validations.nicknameChecked ? (
                        <div className="ml-28 -mt-2 text-sm text-green-600">사용 가능한 닉네임입니다.</div>
                    ) : fieldErrors.nickname ? (
                        <div className="ml-28 -mt-2 text-sm text-red-600">{fieldErrors.nickname}</div>
                    ) : null}

                    {/* 전화번호 */}
                    <div className="flex items-center space-x-4">
                        <label htmlFor="phone" className="text-lg font-medium text-gray-700 w-24">
                            전화번호
                        </label>
                        <div className="flex-1 flex space-x-2">
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                placeholder="'-' 없이 입력하세요"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`flex-1 px-4 py-3 text-base text-black rounded-lg border ${
                                    validations.phoneChecked
                                        ? 'border-green-500'
                                        : validations.phoneValid
                                        ? 'border-orange-300'
                                        : fieldErrors.phone
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                } focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent`}
                            />
                            <button
                                type="button"
                                onClick={() => checkDuplicate('phone')}
                                disabled={isLoading || !validations.phoneValid}
                                className="px-4 py-3 text-sm whitespace-nowrap bg-gray-100 text-gray-700 rounded-lg hover:bg-[#9C50D4] hover:text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading && formData.phone === fieldErrors.phone ? '확인 중...' : '중복확인'}
                            </button>
                        </div>
                    </div>
                    {validations.phoneChecked ? (
                        <div className="ml-28 -mt-2 text-sm text-green-600">사용 가능한 전화번호입니다.</div>
                    ) : fieldErrors.phone ? (
                        <div className="ml-28 -mt-2 text-sm text-red-600">{fieldErrors.phone}</div>
                    ) : null}

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
                        disabled={isLoading}
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
