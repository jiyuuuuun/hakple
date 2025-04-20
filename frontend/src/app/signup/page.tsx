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

    // Track validation status
    const [validations, setValidations] = useState({
        nicknameChecked: false,
        idChecked: false,
    })

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })

        // Reset validation when user changes related fields
        if (name === 'nickname') {
            setValidations((prev) => ({ ...prev, nicknameChecked: false }))
        } else if (name === 'id') {
            setValidations((prev) => ({ ...prev, idChecked: false }))
        }

        // Clear error when user starts typing
        setErrorMessage('')
    }

    const checkDuplicate = async (type: 'nickname' | 'id') => {
        const fieldValue = formData[type]

        if (!fieldValue) {
            setErrorMessage(`${type === 'nickname' ? '닉네임' : '아이디'}을 먼저 입력해주세요.`)
            return
        }

        setIsLoading(true)

        // API 호출 대신 타이머로 시뮬레이션
        setTimeout(() => {
            // 항상 성공 응답 시뮬레이션
            setValidations((prev) => ({
                ...prev,
                [type === 'nickname' ? 'nicknameChecked' : 'idChecked']: true,
            }))
            setErrorMessage(`${type === 'nickname' ? '닉네임' : '아이디'} 사용 가능합니다.`)
            setIsLoading(false)
        }, 800)
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrorMessage('')

        // Validate inputs
        if (!formData.nickname || !formData.password || !formData.id || !formData.phone) {
            setErrorMessage('모든 필드를 입력해주세요.')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setErrorMessage('비밀번호가 일치하지 않습니다.')
            return
        }

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
                    phoneNum: formData.phone,
                }),
            })

            // response.json() 대신 직접 성공 처리
            if (response.status >= 200 && response.status < 300) {
                console.log('회원가입 성공')
                // 회원가입 성공
                router.push('/signup/success')
                return
            }

            // 오류 응답인 경우에만 JSON 파싱 시도
            /*
            try {
                const data = await response.json()
                setErrorMessage(data.message || '회원가입 처리 중 오류가 발생했습니다.')
            } catch (parseError) {
                console.error('응답 파싱 오류:', parseError)
                setErrorMessage('회원가입 처리 중 오류가 발생했습니다.')
            }
            */
            
            // JSON 파싱 오류 개선 - 텍스트로 먼저 받은 후 처리
            try {
                const responseText = await response.text();
                
                // 빈 응답인지 확인
                if (!responseText.trim()) {
                    setErrorMessage('서버에서 응답이 없습니다.');
                    return;
                }
                
                // JSON으로 파싱 시도
                try {
                    const data = JSON.parse(responseText);
                    setErrorMessage(data.message || '회원가입 처리 중 오류가 발생했습니다.');
                } catch (jsonError) {
                    // JSON 파싱 실패 시 텍스트 그대로 표시
                    console.error('JSON 파싱 오류:', jsonError);
                    console.log('원본 응답:', responseText);
                    setErrorMessage(responseText || '회원가입 처리 중 오류가 발생했습니다.');
                }
            } catch (textError) {
                console.error('응답 텍스트 추출 오류:', textError);
                setErrorMessage('회원가입 처리 중 오류가 발생했습니다.');
            }
            //
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
        <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="w-full max-w-md">
                {/* 로고 */}
                <div className="flex justify-center mb-4">
                    <div className="relative w-16 h-16">
                        <Image src="/logo.png" alt="Logo" width={64} height={64} className="w-full h-full" />
                    </div>
                </div>

                {/* 타이틀 */}
                <h2 className="text-center text-2xl font-bold text-purple-600 mb-8">회원가입</h2>

                {/* 에러 메시지 */}
                {errorMessage && (
                    <div
                        className={`mb-4 p-3 rounded-md text-sm ${
                            errorMessage.includes('가능') || errorMessage.includes('완료')
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                        }`}
                    >
                        {errorMessage}
                    </div>
                )}

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 닉네임 */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                                닉네임
                            </label>
                            <button
                                type="button"
                                onClick={() => checkDuplicate('nickname')}
                                disabled={isLoading}
                                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition duration-150 disabled:opacity-50"
                            >
                                {isLoading ? '확인 중...' : '중복확인'}
                            </button>
                        </div>
                        <input
                            id="nickname"
                            name="nickname"
                            type="text"
                            required
                            placeholder="닉네임을 입력하세요"
                            value={formData.nickname}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border ${
                                validations.nicknameChecked ? 'border-green-500' : 'border-gray-300'
                            } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                        />
                    </div>

                    {/* 휴대폰 번호 */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            휴대폰 번호
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            placeholder="휴대폰 번호를 입력하세요"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>

                    {/* 아이디 */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="id" className="block text-sm font-medium text-gray-700">
                                아이디
                            </label>
                            <button
                                type="button"
                                onClick={() => checkDuplicate('id')}
                                disabled={isLoading}
                                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition duration-150 disabled:opacity-50"
                            >
                                {isLoading ? '확인 중...' : '중복확인'}
                            </button>
                        </div>
                        <input
                            id="id"
                            name="id"
                            type="text"
                            required
                            placeholder="아이디를 입력하세요"
                            value={formData.id}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border ${
                                validations.idChecked ? 'border-green-500' : 'border-gray-300'
                            } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                        />
                    </div>

                    {/* 비밀번호 */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>

                    {/* 비밀번호 확인 */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
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
                            className={`w-full px-3 py-2 border ${
                                formData.confirmPassword && formData.password === formData.confirmPassword
                                    ? 'border-green-500'
                                    : 'border-gray-300'
                            } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                        />
                    </div>

                    {/* 이용약관 */}
                    <div className="flex items-center mt-4">
                        <input
                            id="agreeToTerms"
                            name="agreeToTerms"
                            type="checkbox"
                            checked={agreeToTerms}
                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-600">
                            이용약관 및 개인정보처리방침에 동의합니다
                        </label>
                    </div>

                    {/* 회원가입 버튼 */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={!isFormValid() || isLoading}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                isFormValid() && !isLoading
                                    ? 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                                    : 'bg-purple-400 cursor-default'
                            }`}
                        >
                            {isLoading ? '처리 중...' : '회원가입'}
                        </button>
                    </div>

                    {/* 로그인 링크 */}
                    <div className="text-center mt-4">
                        <span className="text-sm text-gray-500">이미 계정이 있으신가요?</span>{' '}
                        <Link href="/login" className="text-sm font-medium text-gray-900 hover:text-purple-600">
                            로그인
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
