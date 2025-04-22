'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotUsernameResult() {
    const router = useRouter()
    const [user_name, setUser_name] = useState('')

    useEffect(() => {
        // localStorage에서 저장된 아이디 가져오기
        const foundUsername = localStorage.getItem('foundUsername')
        if (foundUsername) {
            setUser_name(foundUsername)
        } else {
            // 아이디를 찾지 못한 경우 메인 페이지로 리다이렉트
            router.push('/forgot-username')
        }
    }, [router])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
            <div className="w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-8">아이디 찾기</h1>

                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <p className="text-center text-gray-700 mb-2">회원님의 아이디는</p>
                    <p className="text-center font-bold text-xl mb-2">{user_name}</p>
                    <p className="text-center text-gray-700">입니다.</p>
                </div>

                <div className="flex w-full">
                    <Link href="/login" className="w-full">
                        <button className="w-full bg-blue-500 text-white font-medium py-3 rounded-lg hover:bg-blue-600 transition duration-200">
                            로그인
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
