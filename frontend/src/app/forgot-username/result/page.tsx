'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotUsernameResult() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // localStorage에서 저장된 아이디 가져오기
        const foundUsername = localStorage.getItem('foundUsername')
        if (foundUsername) {
            setUsername(foundUsername)
            setIsLoading(false)
        } else {
            // 아이디를 찾지 못한 경우 아이디 찾기 페이지로 리다이렉트
            router.push('/forgot-username')
        }
    }, [router])

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
                        요청하신 아이디 정보를 확인해주세요
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#9C50D4]"></div>
                    </div>
                ) : (
                    <div className="bg-gray-50 p-8 rounded-xl mb-8 border border-gray-200">
                        <p className="text-center text-gray-700 mb-2">회원님의 아이디는</p>
                        <p className="text-center font-bold text-2xl text-[#9C50D4] my-4">{username}</p>
                        <p className="text-center text-gray-700">입니다.</p>
                    </div>
                )}

                <div className="space-y-4">
                    <Link href="/login" className="w-full block">
                        <button className="w-full bg-[#9C50D4] text-white font-bold py-4 rounded-lg hover:bg-[#8a45bc] transition-colors text-lg">
                            로그인 페이지로 이동
                        </button>
                    </Link>

                    <Link href="/forgot-password" className="w-full block">
                        <button className="w-full bg-white text-[#9C50D4] font-bold py-4 rounded-lg border border-[#9C50D4] hover:bg-gray-50 transition-colors text-lg">
                            비밀번호 찾기
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
