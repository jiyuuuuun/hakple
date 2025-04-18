'use client'

import Link from 'next/link'
import { useState } from 'react'

// 로그인 후 헤더 컴포넌트

/**
 * 헤더 컴포넌트
 *
 * 웹사이트의 상단 네비게이션 바를 제공합니다.
 * 로고, 네비게이션 메뉴, 검색 기능, 로그인 버튼을 포함합니다.
 * 반응형으로 설계되어 모바일과 데스크톱 환경에 모두 대응합니다.
 */
export default function Header_afterLogin() {
    // 모바일에서 메뉴 버튼 클릭 시 상태 관리
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <header className="bg-[#f2edf4] py-3 sticky top-0 z-10 shadow-sm">
            <div className="max-w-screen-lg mx-auto px-4">
                <div className="flex items-center justify-between">
                    {/* 왼쪽: 로고와 네비게이션 */}
                    <div className="flex items-center space-x-4 md:space-x-8">
                        {/* 모바일 메뉴 버튼 */}
                        <button
                            className="md:hidden p-2 text-gray-500 rounded-md hover:bg-gray-100 focus:outline-none"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="메뉴 버튼"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>

                        {/* 로고 */}
                        <Link href="/" className="flex items-center flex-shrink-0">
                            <img src="/logo.png" alt="HAKPLE" width={55} height={55} className="logo" />
                        </Link>

                        {/* 데스크탑 메뉴 */}
                        <nav className="hidden md:flex space-x-5 lg:space-x-8">
                            <Link
                                href="/home"
                                className="font-medium text-lg text-gray-700 hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all"
                            >
                                홈
                            </Link>
                            <Link
                                href="/post"
                                className="font-medium text-lg text-gray-700 hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all"
                            >
                                게시판
                            </Link>
                            <Link
                                href="/boad"
                                className="font-medium text-lg text-gray-700 hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all"
                            >
                                인기글
                            </Link>
                            <Link
                                href="/community"
                                className="font-medium text-lg text-gray-700 hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all"
                            >
                                캘린더
                            </Link>
                        </nav>
                    </div>

                    {/* 오른쪽: 검색과 로그인 */}
                    <div className="flex items-center space-x-2 md:space-x-3">
                        {/* 검색 입력창 */}
                        <div className="relative w-full max-w-[180px] md:max-w-[220px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                    className="w-4 h-4 md:w-5 md:h-5 text-gray-400"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            <input
                                type="search"
                                className="block w-full pl-8 md:pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                                placeholder="검색어를 입력하세요"
                                aria-label="검색"
                            />
                        </div>

                        {/* 로그아웃 버튼 */}
                        <Link href="/login">
                            <button className="bg-[#9C50D4] hover:bg-purple-500 text-white font-medium py-2 px-4 md:px-5 rounded-md text-sm whitespace-nowrap h-[36px]">
                                로그아웃
                            </button>
                        </Link>

                        {/* 프로필 이미지 */}
                        <Link href="/myinfo" className="flex items-center">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                                <img src="/profile.png" alt="프로필" className="min-w-full min-h-full object-cover" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* 모바일 메뉴 - 햄버거 메뉴 클릭 시 표시됨 */}
                {isMenuOpen && (
                    <div className="mt-3 md:hidden">
                        <nav className="flex flex-col space-y-2 py-2">
                            <Link
                                href="/home"
                                className="font-medium text-base text-gray-700 hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100"
                            >
                                홈
                            </Link>
                            <Link
                                href="/academy"
                                className="font-medium text-base text-gray-700 hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100"
                            >
                                게시판
                            </Link>
                            <Link
                                href="/boad"
                                className="font-medium text-base text-gray-700 hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100"
                            >
                                인기글
                            </Link>
                            <Link
                                href="/community"
                                className="font-medium text-base text-gray-700 hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100"
                            >
                                캘린더
                            </Link>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    )
}
