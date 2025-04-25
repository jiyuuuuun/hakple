'use client'

import { useEffect, useState } from 'react'
import { useLoginMember, LoginMemberContext } from '@/stores/auth/loginMember'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MobileBottomNav from '@/components/MobileBottomNav'
import { useRouter, usePathname } from "next/navigation"

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

    
    const checkLoginStatus = async () => {
        try {
            console.log('로그인 상태 확인 시작')
            const response = await fetch('http://localhost:8090/api/v1/admin/check', {
                credentials: 'include'
            })

            console.log('로그인 상태 응답:', response.status)

            if (response.ok) {
                const data = await response.json()
                console.log('로그인 상태 성공', data)

                const userInfoResponse = await fetch('http://localhost:8090/api/v1/myInfos', {
                    credentials: 'include',
                })

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
        console.log('ClientLayout - 로그인 상태 확인 시작')

        // 로그인이 필요없는 페이지 목록
        const publicPages = ['/login', '/signup', '/', '/about', '/signup/success','/forgot-username','/forgot-password','/reset-password', '/home']

        const specialPages = ['/login', '/admin']
        const isPublicPage = publicPages.some((page) => pathname?.startsWith(page))
        const isSpecialPage = specialPages.some((page) => pathname?.startsWith(page))

        console.log('페이지 정보 - 현재 경로:', pathname, '공개 페이지:', isPublicPage, '특별 페이지:', isSpecialPage)

        if (!isPublicPage) {
        // 로그인 상태 체크 API 호출
        fetch(`http://localhost:8090/api/v1/auth/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then((res) => {
                console.log('로그인 상태 응답:', res.status)
                if (!res.ok) {
                    setNoLoginMember()
                    setIsLogin(false)
                    return Promise.reject(new Error('인증 필요'))
                }
                return res.json()
            })
            .then((data) => {
                // 로그인 성공
                console.log('로그인 상태 성공', data)
                setLoginMember(data)
                setIsLogin(true)

                // 로그인 페이지에 있을 경우 홈으로 리다이렉트
                if (pathname === '/login' && !isSpecialPage) {
                    console.log('로그인 페이지에서 접속 - 홈으로 리다이렉트')
                    router.replace("/")
                }
            })
            .catch((error) => {
                console.log('로그인 되어있지 않음', error)
                setNoLoginMember()
                setIsLogin(false)

                // 로그인이 필요한 페이지인데 로그인이 안 되어 있으면 로그인 페이지로 리다이렉트
                if (!isPublicPage && !isSpecialPage) {
                    console.log('로그인 필요 페이지 접속 - 로그인으로 리다이렉트')
               //     router.replace("/login")
                }
            })
            checkLoginStatus()

            .finally(() => {
                console.log('✔️ 로그인 상태 확인 완료 - API 호출 완료됨 (상태 반영은 이후 렌더링에서 확인)');
            })
        } else {
        // 💡 공개 페이지에서는 로그인 체크를 하되, 리다이렉트는 하지 않음
        fetch(`http://localhost:8090/api/v1/auth/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then((res) => {
                if (!res.ok) {
                    setNoLoginMember()
                    setIsLogin(false)
                    return Promise.reject(new Error('인증 필요'))
                }
                return res.json()
            })
            .then((data) => {
                // 로그인 성공
                console.log('로그인 상태 성공 (공개 페이지)', data)
                setLoginMember(data)
                setIsLogin(true)
            })
            .catch((error) => {
                console.log('로그인 되어있지 않음 (공개 페이지)', error)
                setNoLoginMember()
                setIsLogin(false)
            })
        }

    }, [pathname]) // pathname이 변경될 때마다 실행


    // ✅ 로그인 상태가 변경된 후 (렌더 기준) 로그 출력
    useEffect(() => {
        console.log('✅ 렌더 기준 로그인 상태 변경됨');
        console.log('🔐 isLogin:', isLogin);
        console.log('👤 loginMember:', loginMember);
        
        // 로그인 상태이고 프로필 이미지가 없는 경우 API에서 정보 다시 가져오기
        if (isLogin && !loginMember.profileImageUrl) {
            console.log('프로필 이미지가 없어서 사용자 정보 다시 가져오기 시도');
            fetch('/api/v1/myInfos', {
                method: 'GET',
                credentials: 'include',
            })
                .then(res => {
                    if (!res.ok) {
                        return Promise.reject('사용자 정보를 가져올 수 없습니다.');
                    }
                    return res.json();
                })
                .then(data => {
                    console.log('추가 사용자 정보 조회 결과:', data);
                    if (data.profileImageUrl) {
                        console.log('프로필 이미지 URL 발견:', data.profileImageUrl);
                        setLoginMember(data);
                    }
                })
                .catch(err => {
                    console.log('추가 사용자 정보 조회 실패:', err);
                });
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
                {!shouldHideHeaderFooter && <Footer />}
                {/* ✅ 모바일 하단 탭 추가 */}
                {!shouldHideHeaderFooter && <MobileBottomNav />}
            </div>
        </LoginMemberContext.Provider>
    )
}
