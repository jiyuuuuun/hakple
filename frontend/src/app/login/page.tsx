'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { useRouter } from 'next/navigation'
import { fetchApi } from '@/utils/api'

// API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8090'

const socialLoginForKakaoUrl = '/oauth2/authorization/kakao'
const redirectUrlAfterSocialLogin = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'

export default function LoginPage() {
    const { setLoginMember, checkAdminAndRedirect, isLogin } = useGlobalLoginMember()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    // 로그인 상태일 때 홈으로 리다이렉트
    useEffect(() => {
        if (isLogin) {
            router.push('/home')
        }
    }, [isLogin, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            console.log('로그인 요청 시작')
            const response = await fetchApi('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                    rememberMe,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                if (errorData && errorData.message) {
                    throw new Error(errorData.message)
                } else if (response.status === 401) {
                    throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.')
                } else if (response.status === 403) {
                    throw new Error('접근이 거부되었습니다. 권한을 확인해주세요.')
                } else {
                    throw new Error('로그인에 실패했습니다.')
                }
            }

            const data = await response.json()
            console.log('로그인 응답 데이터:', data)

            // 응답 데이터 안전하게 확인
            if (!data || !data.accessToken) {
                throw new Error('서버 응답 데이터가 올바르지 않습니다.')
            }

            console.log('로그인 성공, 토큰 받음', data.accessToken)

            // 서버 응답 구조에 맞게 로그인 멤버 정보 설정
            setLoginMember({
                id: data.userId,
                name: data.name,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
            })

            // 관리자 권한 확인
            console.log('관리자 권한 확인 시작')
            const isAdmin = await checkAdminAndRedirect()
            console.log('관리자 권한 확인 결과:', isAdmin)

            // 직접 라우팅 처리
            if (isAdmin) {
                console.log('관리자로 로그인 - 관리자 페이지로 이동')
                router.push('/admin')
            } else {
                console.log('일반 사용자로 로그인 - 홈 페이지로 이동')
                router.push('/home')
            }

            // 로딩 상태 해제
            setIsLoading(false)
        } catch (error) {
            console.log('로그인 에러:', error)
            setError(error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5EEF8] px-4 pt-0">
            <div className="w-full max-w-[600px] bg-white rounded-3xl p-12 shadow-lg mt-[-100px]">
                <div className="flex flex-col items-center mb-12 mt-[-10px]">
                    <Link href="/" className="cursor-pointer">
                        <Image src="/logo.png" alt="Hakple 로고" width={120} height={120} className="mb-3" />
                    </Link>
                    <h1 className="text-2xl md:text-4xl font-bold text-center">
                        <span className="text-[#9C50D4]">Hakple</span>
                        <span className="text-black">에 오신 것을 환영합니다</span>
                    </h1>
                </div>

                {error && (
                    <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label htmlFor="username" className="block text-gray-700 text-lg">
                            아이디
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="아이디를 입력하세요"
                            className="w-full px-5 py-4 text-lg text-black rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 shadow-md hover:shadow-lg transition-shadow"
                        />
                    </div>

                    <div className="space-y-3 mb-4">
                        <label htmlFor="password" className="block text-gray-700 text-lg">
                            비밀번호
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호를 입력하세요"
                                className="w-full px-5 py-4 text-lg text-black rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 shadow-md hover:shadow-lg transition-shadow"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            >
                                <Image
                                    src={showPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                                    alt={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                    width={28}
                                    height={28}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8 text-sm">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remember"
                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor="remember" className="ml-2 text-gray-600 cursor-pointer select-none">
                                로그인 상태 유지
                            </label>
                        </div>
                        <div className="flex items-center mt-2 sm:mt-0">
                            <Link
                                href="/forgot-username"
                                className="text-gray-600 hover:text-purple-600 hover:underline"
                            >
                                아이디 찾기
                            </Link>
                            <span className="text-gray-300 mx-2">|</span>
                            <Link
                                href="/forgot-password"
                                className="text-gray-600 hover:text-purple-600 hover:underline"
                            >
                                비밀번호 찾기
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 text-lg ${
                            isLoading
                                ? 'bg-purple-300 cursor-not-allowed'
                                : 'bg-[#9C50D4] hover:bg-[#8a45bc] transition-colors'
                        } text-white rounded-lg mb-1 flex items-center justify-center`}
                    >
                        {isLoading ? (
                            <>
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                로그인 중...
                            </>
                        ) : (
                            '로그인'
                        )}
                    </button>

                    <div className="flex items-center my-2">
                        <div className="flex-grow h-px bg-gray-300"></div>
                        <span className="px-3 text-gray-500 text-sm">또는</span>
                        <div className="flex-grow h-px bg-gray-300"></div>
                    </div>

                    <Link
                        href={`${socialLoginForKakaoUrl}?redirectUrl=${redirectUrlAfterSocialLogin}`}
                        className="w-full py-4 text-lg bg-[#FFE500] text-black rounded-lg hover:bg-[#FFD700] transition-colors flex items-center justify-center"
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="mr-2"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M12 2.14282C6.5812 2.14282 2.14282 5.65702 2.14282 9.99282C2.14282 12.8316 3.98042 15.2388 6.76902 16.7292L5.91062 20.1952C5.87342 20.3144 5.92542 20.4412 6.03662 20.4928C6.09302 20.5196 6.15902 20.5232 6.21902 20.504L10.3268 17.9128C10.8688 17.9896 11.4264 18.0296 12 18.0296C17.4188 18.0296 21.8572 14.5154 21.8572 9.99282C21.8572 5.65702 17.4188 2.14282 12 2.14282Z"
                                fill="black"
                            />
                        </svg>
                        카카오톡으로 1초만에 시작하기
                    </Link>

                    <p className="text-center text-base text-gray-600">
                        아직 회원이 아니신가요?{' '}
                        <Link href="/signup" className="text-[#9C50D4] hover:underline">
                            회원가입
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
