'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header_afterLogin from '@/components/Header_afterLogin'

export default function ProfileUpdatePage() {
    const router = useRouter()
    const [nickname, setNickname] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [newPhoneNumber, setNewPhoneNumber] = useState('')

    // 컴포넌트 마운트 시 서버에서 사용자 정보를 가져오는 것을 시뮬레이션
    useEffect(() => {
        // 실제로는 API 호출을 통해 사용자 정보를 가져와야 함
        // 예시 목적으로 하드코딩된 값 사용
        setPhoneNumber('010-1234-5678')
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // 프로필 업데이트 로직 구현
        if (newPhoneNumber) {
            setPhoneNumber(newPhoneNumber)
        }
        // API 호출 등의 로직
        router.push('/myinfo')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header_afterLogin />

            <main className="max-w-screen-lg mx-auto pt-6 pb-10">
                <div className="bg-white rounded-lg shadow-sm mx-4 md:mx-auto max-w-2xl mt-4">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-3 text-center">내 정보 수정</h1>
                        <p className="text-sm text-gray-600 mb-8 text-center">프로필 정보를 수정하세요</p>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-10">
                                {/* 닉네임 입력 */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">닉네임</h3>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            id="nickname"
                                            placeholder="홍길동"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 whitespace-nowrap"
                                        >
                                            중복확인
                                        </button>
                                    </div>
                                </div>

                                {/* 휴대폰 번호 */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">휴대폰 번호</h3>
                                    <div className="text-sm text-gray-500 mb-2">현재 번호: {phoneNumber}</div>
                                    <div className="flex space-x-2">
                                        <input
                                            type="tel"
                                            id="phone"
                                            placeholder="새 휴대폰 번호를 입력하세요"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            value={newPhoneNumber}
                                            onChange={(e) => setNewPhoneNumber(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 whitespace-nowrap"
                                        >
                                            중복확인
                                        </button>
                                    </div>
                                </div>

                                {/* 하단 버튼 */}
                                <div className="flex justify-end space-x-3 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-[#9C50D4] text-white rounded-md hover:bg-purple-500 font-medium"
                                    >
                                        변경사항 저장
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    )
}
