'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'

// TODO : 나중에 배포시
const socialLoginForKakaoUrl = 'http://localhost:8090/oauth2/authorization/kakao'
const redirectUrlAfterSocialLogin = 'http://localhost:3000'

export default function LoginPage() {
    const router = useRouter()
    const { setLoginMember, checkAdminAndRedirect } = useGlobalLoginMember()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            console.log('로그인 요청 시작:', username)
            const response = await fetch('http://localhost:8090/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('로그인에 실패했습니다.')
            }

            const data = await response.json()
            console.log('로그인 성공 데이터:', data)
            
            // 로그인이 성공하면 setLoginMember 호출하여 전역 상태 업데이트
            setLoginMember(data);
            
            // 관리자 권한 확인
            console.log('관리자 권한 확인 시작');
            const isAdmin = await checkAdminAndRedirect();
            console.log('관리자 권한 확인 결과:', isAdmin);
            
            // 약간의 지연 후 리다이렉트 (상태 업데이트를 위한 시간 확보)
            setTimeout(() => {
                // 관리자인 경우 관리자 페이지로, 일반 사용자인 경우 홈 페이지로 이동
                if (isAdmin) {
                    console.log('관리자로 로그인 - 관리자 페이지로 이동');
                    window.location.href = '/admin';
                } else {
                    console.log('일반 사용자로 로그인 - 홈 페이지로 이동');
                    window.location.href = '/home';
                }
            }, 500);
        } catch (error) {
            console.log('로그인 에러:', error)
            setError(error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9FE] px-4 pt-0">
            <div className="w-full max-w-[600px] bg-white rounded-3xl p-12 shadow-lg mt-[-100px]">
                <div className="flex flex-col items-center mb-12 mt-[-10px]">
                    <Link href="/" className="cursor-pointer">
                        <Image src="/logo.png" alt="Hakple 로고" width={120} height={120} className="mb-3" />
                    </Link>
                    <h1 className="text-4xl font-bold">
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
                            className="w-full px-5 py-4 text-lg text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                className="w-full px-5 py-4 text-lg text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

                    <div className="flex items-center mb-8">
                        <input
                            type="checkbox"
                            id="remember"
                            className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="remember" className="ml-3 text-base text-gray-600">
                            로그인 상태 유지
                        </label>
                        <div className="ml-auto flex space-x-4">
                            <Link href="/forgot-username" className="text-base text-gray-600 hover:text-purple-600">
                                아이디 찾기
                            </Link>
                            <Link href="/forgot-password" className="text-base text-gray-600 hover:text-purple-600">
                                비밀번호 찾기
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 text-lg bg-[#9C50D4] text-white rounded-lg hover:bg-[#8a45bc] transition-colors mb-1"
                    >
                        로그인
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
