'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { usePathname, useRouter } from 'next/navigation'
import { fetchApi } from '@/utils/api'

/**
 * 헤더 컴포넌트
 *
 * 웹사이트의 상단 네비게이션 바를 제공합니다.
 * 로고, 네비게이션 메뉴, 검색 기능, 로그인/로그아웃 버튼을 포함합니다.
 * 로그인 상태에 따라 UI가 변경됩니다.
 * 반응형으로 설계되어 모바일과 데스크톱 환경에 모두 대응합니다.
 */
export default function Header() {
    // 모바일에서 메뉴 버튼 클릭 시 상태 관리
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    // 관리자 권한 확인 상태
    const [isAdmin, setIsAdmin] = useState(false)
    // 검색어 상태 관리
    const [searchQuery, setSearchQuery] = useState('')
    // 현재 경로 가져오기
    const pathname = usePathname()
    // 라우터 가져오기
    const router = useRouter()

    // 로그인 상태 관리 - useGlobalLoginMember로 전역 상태 사용
    const { isLogin, logoutAndHome, loginMember } = useGlobalLoginMember()

    // 로그인/회원가입 페이지에서는 헤더를 표시하지 않음
    const isAuthPage = pathname === '/login' || pathname === '/signup'

    // 컴포넌트 마운트 시 한 번 관리자 권한 확인
    useEffect(() => {
        if (isAuthPage || !isLogin) return
        checkAdminPermission()
    }, [isAuthPage, isLogin])

    // 로그인 상태 변경 감지를 위한 효과
    useEffect(() => {
        if (isAuthPage || !isLogin) {
            setIsAdmin(false)
            return
        }
        checkAdminPermission()
    }, [isLogin, loginMember, isAuthPage])

    // 현재 경로가 바뀔 때 관리자 권한 다시 확인 (특히 /admin 페이지 방문 시)
    useEffect(() => {
        if (isAuthPage || !isLogin) {
            setIsAdmin(false)
            return
        }

        if (pathname?.startsWith('/admin')) {
            checkAdminPermission()
        }
    }, [pathname, isLogin, isAuthPage])

    // 관리자인 경우 루트 페이지 접속 시 관리자 페이지로 리다이렉트
    // useEffect(() => {
    //     if (isAdmin && pathname === '/') {
    //         router.push('/admin/admins')
    //     }
    // }, [isAdmin, pathname, router])

    // 관리자 권한 확인 함수
    const checkAdminPermission = async () => {
        try {
            // fetchApi 사용으로 변경
            const response = await fetchApi('/api/v1/admin/check', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            // 인증/권한 오류도 일반 로그로 출력
            if (response.status === 401 || response.status === 403) {
                console.log(`인증 오류: 권한이 없음 (상태 코드: ${response.status})`)
                setIsAdmin(false)
                return
            }

            // 그 외 서버 오류는 중요한 에러이므로 error로 출력
            if (!response.ok) {
                console.error(`서버 오류: 관리자 권한 확인 실패 (상태 코드: ${response.status})`)
                setIsAdmin(false)
                return
            }

            // boolean 값으로 응답이 오므로 이를 처리
            const isAdminResult = await response.json()

            if (isAdminResult === true) {
                setIsAdmin(true)
            } else {
                setIsAdmin(false)
            }
        } catch (error) {
            // 중요한 네트워크 오류는 콘솔에 출력
            console.error('관리자 권한 확인 중 오류 발생:', error)
            setIsAdmin(false)
        }
    }

    // 검색 제출 핸들러
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        // 로그인 상태 체크
        if (!isLogin) {
            alert('로그인이 필요합니다')
            router.push('/login')
            return
        }

        // POST API에서 토큰으로 userId를 추출해서 academyCode를 조회하기 때문에
        // 프론트엔드에서 별도로 academyCode를 체크할 필요가 없음

        // 검색 페이지로 이동 (등록일순, 제목 검색 조건 포함)
        router.push(
            `/post?keyword=${encodeURIComponent(searchQuery.trim())}&sortType=${encodeURIComponent(
                '등록일순',
            )}&filterType=${encodeURIComponent('제목')}`,
        )

        // 검색 후 검색창 초기화
        setSearchQuery('')
    }

    // 로그인/회원가입 페이지에서는 헤더를 표시하지 않음
    if (isAuthPage) {
        return null
    }

    return (
        <header className="bg-[#f2edf4] py-3 sticky top-0 z-10 shadow-sm">
            <div className="w-full px-4">
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
                        {isAdmin ? (
                            <div className="flex items-center flex-shrink-0 cursor-default">
                                <img src="/logo.png" alt="HAKPLE" width={55} height={55} className="logo" />
                            </div>
                        ) : (
                            <Link href="/" className="flex items-center flex-shrink-0">
                                <img src="/logo.png" alt="HAKPLE" width={55} height={55} className="logo" />
                            </Link>
                        )}

                        {/* 데스크탑 메뉴 */}
                        <nav className="hidden md:flex space-x-5 lg:space-x-8">
                            {!isAdmin && (
                                <>
                                    <Link
                                        href="/home"
                                        className={`font-medium text-lg ${pathname === '/home' ? 'text-purple-700 font-semibold' : 'text-gray-700'} hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all`}
                                    >
                                        홈
                                    </Link>
                                    <Link
                                        href={isLogin && loginMember?.academyCode ? `/post/notice/${loginMember.academyCode}` : '/post/notice'}
                                        className={`font-medium text-lg ${pathname?.startsWith('/post/notice') ? 'text-purple-700 font-semibold' : 'text-gray-700'} hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all`}
                                    >
                                        공지사항
                                    </Link>
                                    <Link
                                        href="/post"
                                        className={`font-medium text-lg ${pathname === '/post' ? 'text-purple-700 font-semibold' : 'text-gray-700'} hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all`}
                                    >
                                        자유게시판
                                    </Link>
                                    <Link
                                        href="/post?type=popular"
                                        className={`font-medium text-lg ${pathname === '/post' && pathname.includes('type=popular') ? 'text-purple-700 font-semibold' : 'text-gray-700'} hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all`}
                                    >
                                        인기글
                                    </Link>
                                    <Link
                                        href="/calendar"
                                        className={`font-medium text-lg ${pathname === '/calendar' ? 'text-purple-700 font-semibold' : 'text-gray-700'} hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all`}
                                    >
                                        캘린더
                                    </Link>
                                    {pathname?.startsWith('/myinfo') && (
                                        <Link
                                            href="/myinfo"
                                            className="font-medium text-lg text-purple-700 font-semibold hover:text-gray-900 whitespace-nowrap transition-all"
                                        >
                                            내정보
                                        </Link>
                                    )}
                                </>
                            )}
                            {/* 관리자 메뉴 - 관리자 권한이 있을 때만 표시 */}
                            {isAdmin && (
                                <Link
                                    href="/admin/admins"
                                    className={`font-medium text-lg ${pathname?.startsWith('/admin') ? 'text-red-700 font-semibold' : 'text-red-600'} hover:text-red-800 whitespace-nowrap hover:font-semibold transition-all flex items-center`}
                                >
                                    <span className="mr-1">👑</span>
                                    관리자
                                </Link>
                            )}
                        </nav>
                    </div>

                    {/* 오른쪽: 검색과 로그인/로그아웃 */}
                    <div className="flex items-center space-x-2 md:space-x-3">
                        {/* 검색 입력창 - 관리자가 아닐 때만 표시 */}
                        {!isAdmin && (
                            <div className="relative w-full max-w-[180px] md:max-w-[220px]">
                                <form onSubmit={handleSearchSubmit}>
                                    <div className="relative">
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
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <button type="submit" className="hidden" aria-label="검색하기">
                                            검색
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* 로그인 상태 디버깅 표시 */}
                        <div className="hidden">
                            로그인 상태: {isLogin ? '로그인됨' : '로그인 안됨'}, ID: {loginMember?.userName || 'None'},
                            Token: {localStorage.getItem('accessToken') ? '있음' : '없음'}
                        </div>

                        {/* 로그인 상태에 따른 버튼 표시 */}
                        {isLogin ? (
                            <>
                                {/* 로그아웃 버튼 */}
                                <button
                                    onClick={() => logoutAndHome()}
                                    className="bg-[#9C50D4] hover:bg-purple-500 text-white font-medium py-2 px-4 md:px-5 rounded-md text-sm whitespace-nowrap h-[36px]"
                                >
                                    로그아웃
                                </button>

                                {/* 프로필 이미지 */}
                                <Link href="/myinfo" className="flex items-center">
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                                        {loginMember.profileImageUrl ? (
                                            <img
                                                src={loginMember.profileImageUrl}
                                                alt="프로필"
                                                className="min-w-full min-h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.src = 'https://via.placeholder.com/40?text=사용자'
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-purple-50 flex items-center justify-center">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-6 w-6 text-[#9C50D4]"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </>
                        ) : (
                            /* 로그인 버튼 */
                            <Link href="/login">
                                <button className="bg-[#9C50D4] hover:bg-purple-500 text-white font-medium py-2 px-4 md:px-5 rounded-md text-sm whitespace-nowrap h-[36px]">
                                    로그인
                                </button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* 모바일 메뉴 - 햄버거 메뉴 클릭 시 표시됨 */}
                {isMenuOpen && (
                    <div className="mt-3 md:hidden">
                        <nav className="flex flex-col space-y-2 py-2">
                            {!isAdmin && (
                                <>
                                    <Link
                                        href="/home"
                                        className="font-medium text-base text-gray-700 hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100"
                                    >
                                        홈
                                    </Link>
                                    <Link
                                        href={isLogin && loginMember?.academyId ? `/post/notice/${loginMember.academyId}` : '/post/notice'}
                                        className="font-medium text-lg text-gray-700 hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all"
                                    >
                                        공지사항
                                    </Link>
                                    <Link
                                        href="/post"
                                        className="font-medium text-lg text-gray-700 hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all"
                                    >
                                        자유게시판
                                    </Link>
                                    <Link
                                        href="/post?type=popular"
                                        className="font-medium text-lg text-gray-700 hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all"
                                    >
                                        인기글
                                    </Link>
                                    <Link
                                        href="/community"
                                        className="font-medium text-base text-gray-700 hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100"
                                    >
                                        캘린더
                                    </Link>
                                    {pathname?.startsWith('/myinfo') && (
                                        <Link
                                            href="/myinfo"
                                            className="font-medium text-base text-purple-700 hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100"
                                        >
                                            내정보
                                        </Link>
                                    )}
                                </>
                            )}
                            {/* 모바일 관리자 메뉴 - 관리자 권한이 있을 때만 표시 */}
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className="font-medium text-base text-red-600 hover:text-red-800 px-2 py-2 rounded-md hover:bg-gray-100 flex items-center"
                                >
                                    <span className="mr-1">👑</span>
                                    관리자
                                </Link>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    )
}
