'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotUsername() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        nickName: '',
        phone: '',
    })
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.nickName || !formData.phone) {
            setErrorMessage('닉네임과 휴대폰 번호를 모두 입력해주세요.')
            return
        }

        setIsLoading(true)
        setErrorMessage('')

        // API 서버 연결 시도
        let foundUser = null
        let apiError = false
        try {
            console.log('아이디 찾기 요청 데이터:', {
                nickName: formData.nickName,
                phoneNum: formData.phone,
            })

            // API 요청
            const response = await fetch('http://localhost:8090/api/v1/usernames/find-username', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nickName: formData.nickName,
                    phoneNum: formData.phone,
                }),
            })

            // 응답 텍스트 가져오기 (디버깅용)
            const responseText = await response.text()
            console.log('API 응답 원본:', responseText)

            // 응답이 JSON인지 확인
            let data = null
            if (responseText.trim()) {
                try {
                    data = JSON.parse(responseText)
                    console.log('API 응답 데이터(파싱됨):', data)
                } catch (parseError) {
                    console.error('JSON 파싱 오류:', parseError)
                    apiError = true
                }
            }

            // 응답 확인
            if (response.ok && data) {
                // API 응답에서 user_name 필드 추출
                const username =
                    data.user_name ||
                    data.userName ||
                    data.username ||
                    (data.data && (data.data.user_name || data.data.userName || data.data.username))

                if (username) {
                    foundUser = {
                        user_name: username,
                    }
                    console.log('API에서 찾은 사용자명:', username)
                } else {
                    console.error('API 응답에 사용자명 필드가 없음:', data)
                    apiError = true
                }
            } else {
                console.error('API 오류 응답:', response.status, response.statusText)
                apiError = true
            }
        } catch (error) {
            console.error('API 요청 오류:', error)
            apiError = true
        }

        // API 연동 실패 시 테스트 데이터로 대체
        if (!foundUser && apiError) {
            console.log('API 연동 실패로 테스트 모드로 전환')

            // 테스트 데이터베이스
            const userDatabase = [
                { nickName: '홍길동', phone: '01012345678', user_name: 'hong123' },
                { nickName: '김철수', phone: '01098765432', user_name: 'kim_cs' },
                { nickName: '이영희', phone: '01011112222', user_name: 'lee_younghee' },
                { nickName: '박지민', phone: '01033334444', user_name: 'jimin_park' },
                { nickName: '최수진', phone: '01055556666', user_name: 'soojin_choi' },
                { nickName: '관리자', phone: '01099998888', user_name: 'admin' },
                { nickName: '테스트', phone: '01000001111', user_name: 'tester' },
            ]

            // 입력한 정보로 회원 찾기
            foundUser = userDatabase.find(
                (user) => user.nickName === formData.nickName && user.phone === formData.phone,
            )

            console.log('테스트 데이터베이스 검색 결과:', foundUser || '일치하는 회원 없음')
        }

        // 아이디 처리 및 결과 표시
        if (foundUser && foundUser.user_name) {
            console.log('아이디 찾기 성공:', foundUser.user_name)
            localStorage.setItem('foundUsername', foundUser.user_name)
            router.push('/forgot-username/result')
        } else {
            console.log('일치하는 회원 정보 없음')
            setErrorMessage('입력하신 정보와 일치하는 회원을 찾을 수 없습니다.')
        }

        setIsLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5EEF8] px-4 pt-0">
            <div className="w-full max-w-[600px] bg-white rounded-3xl p-12 shadow-lg mt-[-200px]">
                <div className="flex flex-col items-center mb-10 mt-[-10px]">
                    <Link href="/" className="cursor-pointer">
                        <Image src="/logo.png" alt="Hakple 로고" width={120} height={120} className="mb-2" />
                    </Link>
                    <h1 className="text-4xl font-bold text-center">
                        <span className="text-[#9C50D4]">아이디</span>
                        <span className="text-black"> 찾기</span>
                    </h1>
                    <p className="text-base text-gray-600 mt-2 text-center">
                        가입 시 등록한 닉네임과 휴대폰 번호로 아이디를 찾을 수 있습니다
                    </p>
                </div>

                {errorMessage && (
                    <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                        <p>{errorMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label htmlFor="nickName" className="block text-gray-700 text-lg">
                            닉네임
                        </label>
                        <input
                            id="nickName"
                            type="text"
                            name="nickName"
                            value={formData.nickName}
                            onChange={handleChange}
                            placeholder="닉네임을 입력하세요"
                            className="w-full px-5 py-4 text-lg text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="phone" className="block text-gray-700 text-lg">
                            휴대폰 번호
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="휴대폰 번호를 입력하세요"
                            className="w-full px-5 py-4 text-lg text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                            disabled={isLoading}
                        />
                        <p className="text-sm text-gray-500">숫자만 입력해주세요</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 text-lg ${
                            isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#9C50D4] hover:bg-[#8a45bc]'
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
