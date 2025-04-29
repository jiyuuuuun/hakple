'use client'

import { useEffect, useState } from 'react'
import { useLoginMember, LoginMemberContext } from '@/stores/auth/loginMember'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MobileBottomNav from '@/components/MobileBottomNav'
import { useRouter, usePathname } from "next/navigation"
import { initDOMErrorPrevention } from '@/utils/domErrorFix'
import { fetchApi } from '@/utils/api'

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const {
        loginMember,
        setLoginMember,
        setNoLoginMember,
        isLoginMemberPending,
        isLogin,
        logout,
        logoutAndHome,
        checkAdminAndRedirect,
        setIsLogin
    } = useLoginMember()

    const router = useRouter()

    // DOM removeChild 오류 방지를 위한 초기화
    useEffect(() => {
        // 클라이언트 사이드에서만 실행
        if (typeof window !== 'undefined') {
            
            initDOMErrorPrevention();
        }
    }, []);

    const loginMemberContextValue = {
        loginMember,
        setLoginMember,
        setNoLoginMember,
        isLoginMemberPending,
        isLogin,
        setIsLogin,
        logout,
        logoutAndHome,
        checkAdminAndRedirect
    }

    // Next.js의 현재 경로 감지
    const pathname = usePathname()
    
    // 헤더와 푸터를 숨길 페이지 목록
    const hideHeaderFooterPages = [
        '/login', 
        '/signup', 
        '/forgot-username', 
        '/forgot-password',
        '/reset-password'
    ]
    
    // 현재 페이지에서 헤더와 푸터를 숨길지 여부 (Next.js의 pathname 사용)
    const shouldHideHeaderFooter = hideHeaderFooterPages.some(page => 
        pathname?.startsWith(page)
    )

    // 루트 페이지에서 푸터 숨김 여부
    const shouldHideFooter = pathname === '/' || shouldHideHeaderFooter;

    
    const checkLoginStatus = async () => {
    try {
        
        const response = await fetchApi('/api/v1/admin/check')

        

        if (response.ok) {
            const data = await response.json()
            

            const userInfoResponse = await fetchApi('/api/v1/myInfos')

            if (userInfoResponse.ok) {
                const userInfo = await userInfoResponse.json()
                console.log('추가 사용자 정보:', userInfo)
                setLoginMember(userInfo)
            } else {
                setLoginMember(data)
            }
        } else {
            setNoLoginMember()
        }
    } catch (error) {
        console.error('로그인 상태 확인 중 오류:', error)
        setNoLoginMember()
    }
}


    useEffect(() => {
        

        // 로그인이 필요없는 페이지 목록
        const publicPages = ['/login', '/signup', '/', '/about', '/signup/success','/forgot-username','/forgot-password','/reset-password', '/home']

        const specialPages = ['/login', '/admin']
        // 로그인이 필요한 경로를 명시적으로 정의
        const protectedPaths = ['/myinfo', '/my-posts', '/my-comments', '/my-likes']
        
        const isPublicPage = publicPages.some((page) => pathname?.startsWith(page))
        const isSpecialPage = specialPages.some((page) => pathname?.startsWith(page))
        // 현재 경로가 보호된 경로인지 확인
        const isProtectedPath = protectedPaths.some((path) => pathname?.startsWith(path))

        
        // 로그인 페이지에서는 API 호출하지 않음
        if (pathname === '/login') {
            setNoLoginMember()
            setIsLogin(false)
            return
        }

        const checkLoginStatus = async () => {
            try {
                const response = await fetchApi('/api/v1/auth/me', {
                    method: 'GET',
                })

                

                if (!response.ok) {
                    setNoLoginMember()
                    setIsLogin(false)
                    return false
                }

                const data = await response.json()
                
                setLoginMember(data)
                setIsLogin(true)
                return true
            } catch (error) {
                
                setNoLoginMember()
                setIsLogin(false)
                return false
            }
        }

        // 로그인 상태 확인 및 리다이렉트 처리
        checkLoginStatus()
            .then((isLoggedIn) => {
                // 로그인이 필요한 페이지인데 로그인이 안 되어 있으면 로그인 페이지로 리다이렉트
                if ((!isPublicPage && !isSpecialPage && !isLoggedIn) || (isProtectedPath && !isLoggedIn)) {
                    
                    if (pathname !== '/login') {  // 현재 페이지가 이미 로그인 페이지가 아닐 때만 리다이렉트
                        router.replace("/login")
                    }
                }
                
                // 로그인 페이지에 있을 경우 홈으로 리다이렉트
                if (pathname === '/login' && isLoggedIn) {
                    
                    router.replace("/home")
                }

                // 관리자인 경우 /myinfo 페이지 접근 제한
                if (isLoggedIn && pathname?.startsWith('/myinfo')) {
                    const checkAdminAndRedirect = async () => {
                        try {
                            const response = await fetchApi('/api/v1/admin/check', {
                                method: 'GET',
                            })

                            if (!response.ok) {
                                return false
                            }

                            const isAdmin = await response.json()

                            if (isAdmin === true) {
                                
                                router.replace("/admin")
                            }
                        } catch (error) {
                            
                        }
                    }

                    checkAdminAndRedirect()
                }
            })
            .finally(() => {
                
            })
    }, [pathname]) // pathname이 변경될 때마다 실행


    // ✅ 로그인 상태가 변경된 후 (렌더 기준) 로그 출력
    useEffect(() => {
        
        
        // 로그인 상태이고 프로필 이미지가 없는 경우 API에서 정보 다시 가져오기
        if (isLogin && !loginMember.profileImageUrl) {

            const fetchUserInfo = async () => {
            try {
            const response = await fetchApi('/api/v1/myInfos', {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('사용자 정보를 가져올 수 없습니다.');
            }

            const data = await response.json();
            

            if (data.profileImageUrl) {
                
                setLoginMember(data);
            }
            } catch (err) {
            
            }
        };

            fetchUserInfo();
        }
    }, [isLogin, loginMember]);

    if (isLoginMemberPending) {
        return (
            <div className="flex justify-center items-center h-screen">
                로그인 중...
            </div>
        )
    }

    return (
        <LoginMemberContext.Provider value={loginMemberContextValue}>
            <div className="flex flex-col min-h-screen">
                {!shouldHideHeaderFooter && <Header />}
                <div className="flex-grow">{children}</div>
                {!shouldHideFooter && <Footer />}
                {/* ✅ 모바일 하단 탭 추가 */}
                {!shouldHideHeaderFooter && <MobileBottomNav />}
            </div>
        </LoginMemberContext.Provider>
    )
}
