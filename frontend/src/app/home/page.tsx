'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
    const [academyName, setAcademyName] = useState<string | null>(null)

    useEffect(() => {
        // 클라이언트 사이드에서만 localStorage 접근
        const storedAcademyName = localStorage.getItem('academyName')
        setAcademyName(storedAcademyName)
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-screen-lg mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* 왼쪽 사이드바 - 학원 목록 */}
                    <aside className="w-full md:w-64 shrink-0">
                        <div className="bg-white rounded-lg shadow p-4 mb-6">
                            <h2 className="text-lg font-semibold mb-4">현재 학원</h2>
                            <div className="space-y-2">
                                {academyName ? (
                                    <div className="p-2 rounded-md flex items-center justify-between">
                                        <span className="text-gray-700">{academyName}</span>
                                        <div className="flex items-center text-purple-800">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                                            <span className="text-sm">활성</span>
                                        </div>
                                    </div>
                                ) : (
                                    <Link href="/myinfo/academyRegister" className="block">
                                        <div className="p-2 bg-gray-50 rounded-md flex items-center justify-between hover:bg-gray-100">
                                            <span className="text-gray-700">학원 등록하기</span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 text-gray-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                />
                                            </svg>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* 메인 피드 영역 */}
                    <div className="flex-1">
                        {/* 글쓰기 버튼 */}
                        <div className="bg-white rounded-lg shadow p-4 mb-6">
                            <Link href="/post/new">
                                <button className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-md transition">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    새 글쓰기
                                </button>
                            </Link>
                        </div>

                        {/* 게시글 카드 */}
                        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                            <div className="p-4">
                                {/* 작성자 정보 */}
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden">
                                            <img
                                                src="/profile.png"
                                                alt="프로필"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-medium">김민수</div>
                                            <div className="text-sm text-gray-500">24시간 전</div>
                                        </div>
                                    </div>
                                    <button className="text-gray-400">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-6 w-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                {/* 게시글 내용 */}
                                <p className="mb-4">오늘 수업 내용 정리했습니다! 혹석한 친구들 참고하세요 📚</p>

                                {/* 게시글 이미지 */}
                                <div className="bg-gray-100 rounded-md h-72 flex items-center justify-center mb-4">
                                    {/* 실제 구현 시 이미지를 추가하는 부분 */}
                                </div>

                                {/* 해시태그 */}
                                <div className="flex gap-2 mb-4">
                                    <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                        #수업내용
                                    </span>
                                    <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                        #수학
                                    </span>
                                </div>

                                {/* 좋아요 및 댓글 수 */}
                                <div className="flex items-center gap-6 text-gray-500 text-sm">
                                    <button className="flex items-center gap-1">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                            />
                                        </svg>
                                        23
                                    </button>
                                    <button className="flex items-center gap-1">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                            />
                                        </svg>
                                        12
                                    </button>
                                    <div className="flex items-center gap-1 ml-auto">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                        </svg>
                                        89
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
