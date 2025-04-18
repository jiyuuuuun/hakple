'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AcademyRegister() {
    const [academyCode, setAcademyCode] = useState('')
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // 여기에 학원 코드 검증 및 등록 로직 구현
        console.log('학원 코드:', academyCode)
        // 성공 시 마이페이지로 이동
        router.push('/myinfo')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-screen-lg mx-auto pt-6 pb-10">
                <div className="bg-white rounded-lg shadow-sm mx-4 md:mx-auto max-w-2xl mt-4">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-3 text-center">학원 등록</h1>
                        <p className="text-sm text-gray-600 mb-8 text-center">학원 코드를 입력해 주세요</p>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-10">
                                {/* 학원 코드 입력 */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">학원 코드</h3>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            id="academyCode"
                                            placeholder="학원 코드를 입력해 주세요"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            value={academyCode}
                                            onChange={(e) => setAcademyCode(e.target.value)}
                                            required
                                        />
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
                                        확인
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
