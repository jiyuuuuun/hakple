'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { usePathname, useRouter } from 'next/navigation'

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
        if (isAuthPage) return;
        
        console.log('Header - 컴포넌트 마운트, 로그인 상태:', isLogin)
        if (localStorage.getItem('accessToken')) {
            console.log('Header - 액세스 토큰 존재, 관리자 권한 확인 시작')
            checkAdminPermission()
        }
    }, [isAuthPage, isLogin])

    // 로그인 상태 변경 감지를 위한 효과
    useEffect(() => {
        if (isAuthPage) return;
        
        console.log('Header - 로그인 상태 감지:', isLogin, loginMember)
        
        // 로그인 상태일 때 관리자 권한 확인
        if (isLogin) {
            console.log('Header - 로그인 상태이므로 관리자 권한 확인 시작')
            checkAdminPermission()
        } else {
            console.log('Header - 로그인되지 않음, 관리자 권한 없음')
            setIsAdmin(false)
        }
    }, [isLogin, loginMember, isAuthPage])
    
    // 현재 경로가 바뀔 때 관리자 권한 다시 확인 (특히 /admin 페이지 방문 시)
    useEffect(() => {
        if (isAuthPage) return;
        
        if (pathname && pathname.startsWith('/admin') && isLogin) {
            console.log('Header - 관리자 페이지 방문, 권한 재확인')
            checkAdminPermission()
        }
    }, [pathname, isLogin, isAuthPage])
    
    // 관리자 권한 확인 함수
    const checkAdminPermission = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken')
            console.log('Header - 액세스 토큰 확인:', !!accessToken)
            
            if (!accessToken) {
                setIsAdmin(false)
                return
            }
            
            console.log('Header - 관리자 권한 확인 API 요청')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/check`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
            })
            
            console.log('Header - 관리자 권한 확인 응답 상태:', response.status)
            if (!response.ok) {
                setIsAdmin(false)
                return
            }
            
            // boolean 값으로 응답이 오므로 이를 처리
            const isAdminResult = await response.json()
            console.log('Header - 관리자 권한 확인 결과:', isAdminResult)
            
            if (isAdminResult === true) {
                console.log('Header - 관리자 권한 있음')
                setIsAdmin(true)
            } else {
                console.log('Header - 관리자 권한 없음')
                setIsAdmin(false)
            }
        } catch (error) {
            console.error('관리자 권한 확인 중 오류:', error)
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
        console.log('검색 시작 - 로그인된 사용자 ID:', loginMember?.id)
        
        // 검색 페이지로 이동 (등록일순, 제목 검색 조건 포함)
        router.push(`/post?keyword=${encodeURIComponent(searchQuery.trim())}&sortType=${encodeURIComponent('등록일순')}&filterType=${encodeURIComponent('제목')}`)
        
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
                        <Link href="/" className="flex items-center flex-shrink-0">
                            <img src="/logo.png" alt="HAKPLE" width={55} height={55} className="logo" />
                        </Link>

                        {/* 데스크탑 메뉴 */}
                        <nav className="hidden md:flex space-x-5 lg:space-x-8">
                            {!isAdmin && (
                                <>
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
                                        href="/post?minLikes=10"
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
                                </>
                            )}
                            {/* 관리자 메뉴 - 관리자 권한이 있을 때만 표시 */}
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className="font-medium text-lg text-red-600 hover:text-red-800 whitespace-nowrap hover:font-semibold transition-all flex items-center"
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
                                        <button
                                            type="submit"
                                            className="hidden"
                                            aria-label="검색하기"
                                        >
                                            검색
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}


                        {/* 로그인 상태 디버깅 표시 */}
                        <div className="hidden">
                            로그인 상태: {isLogin ? '로그인됨' : '로그인 안됨'}, 
                            ID: {loginMember?.id || 'None'}, 
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
                                        <img
                                            src="/profile.png"
                                            alt="프로필"
                                            className="min-w-full min-h-full object-cover"
                                        />
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
                                        href="/post"
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
