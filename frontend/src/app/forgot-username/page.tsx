'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotUsername() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
    })
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.phone) {
            alert('이름과 휴대폰 번호를 모두 입력해주세요.')
            return
        }

        setIsLoading(true)

        // API 서버 연결 시도
        let foundUser = null
        let apiError = false
        try {
            console.log('아이디 찾기 요청 데이터:', {
                name: formData.name,
                phoneNum: formData.phone,
            })

            // API 요청
            const response = await fetch('http://localhost:8090/api/v1/usernames/find-username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
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
                { name: '홍길동', phone: '01012345678', user_name: 'hong123' },
                { name: '김철수', phone: '01098765432', user_name: 'kim_cs' },
                { name: '이영희', phone: '01011112222', user_name: 'lee_younghee' },
                { name: '박지민', phone: '01033334444', user_name: 'jimin_park' },
                { name: '최수진', phone: '01055556666', user_name: 'soojin_choi' },
                { name: '관리자', phone: '01099998888', user_name: 'admin' },
                { name: '테스트', phone: '01000001111', user_name: 'tester' },
            ]

            // 입력한 정보로 회원 찾기
            foundUser = userDatabase.find((user) => user.name === formData.name && user.phone === formData.phone)

            console.log('테스트 데이터베이스 검색 결과:', foundUser || '일치하는 회원 없음')
        }

        // 아이디 처리 및 결과 표시
        if (foundUser && foundUser.user_name) {
            console.log('아이디 찾기 성공:', foundUser.user_name)
            localStorage.setItem('foundUsername', foundUser.user_name)
            router.push('/forgot-username/result')
        } else {
            console.log('일치하는 회원 정보 없음')
            alert('입력하신 정보와 일치하는 회원을 찾을 수 없습니다.')
        }

        setIsLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
            <div className="w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-8">아이디 찾기</h1>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <h2 className="text-lg font-medium mb-2">이름</h2>
                        <div className="mb-4">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="이름을 입력하세요"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-lg font-medium mb-2">휴대폰 번호</h2>
                        <div className="mb-4">
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="휴대폰 번호를 입력하세요"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <p className="text-gray-600 text-sm mb-6">- 숫자만 입력해주세요</p>
                    </div>

                    <div className="flex w-full">
                        <Link href="/login" className="w-1/2 mr-2">
                            <button
                                type="button"
                                className="w-full bg-white border border-gray-300 text-black font-medium py-3 rounded-lg"
                            >
                                취소
                            </button>
                        </Link>
                        <button
                            type="submit"
                            className="w-1/2 ml-2 bg-gray-300 text-white font-medium py-3 rounded-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? '처리 중...' : '아이디 찾기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
