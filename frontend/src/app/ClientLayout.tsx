'use client'

import { useEffect } from 'react'
import { useLoginMember, LoginMemberContext } from '@/stores/auth/loginMember'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MobileBottomNav from '@/components/MobileBottomNav'
import { useRouter } from "next/navigation";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const {
        loginMember,
        setLoginMember,
        setNoLoginMember,
        isLoginMemberPending,
        isLogin,
        logout,
        logoutAndHome,
        checkAdminAndRedirect
    } = useLoginMember()

    const router = useRouter()

    const loginMemberContextValue = {
        loginMember,
        setLoginMember,
        setNoLoginMember,
        isLoginMemberPending,
        isLogin,
        logout,
        logoutAndHome,
        checkAdminAndRedirect
    }

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

        const currentPath = window.location.pathname
        const publicPages = ['/login', '/signup', '/', '/about', '/signup/success']
        const specialPages = ['/login', '/admin']
        const isPublicPage = publicPages.some((page) => currentPath.startsWith(page))
        const isSpecialPage = specialPages.some((page) => currentPath.startsWith(page))

        console.log('페이지 정보 - 현재 경로:', currentPath, '공개 페이지:', isPublicPage, '특별 페이지:', isSpecialPage)

        checkLoginStatus()
            .finally(() => {
                console.log('✔️ 로그인 상태 확인 완료 - API 호출 완료됨 (상태 반영은 이후 렌더링에서 확인)');
            })
    }, [])

    // ✅ 로그인 상태가 변경된 후 (렌더 기준) 로그 출력
    useEffect(() => {
        console.log('✅ 렌더 기준 로그인 상태 변경됨');
        console.log('🔐 isLogin:', isLogin);
        console.log('👤 loginMember:', loginMember);
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
                <Header />
                <div className="flex-grow">{children}</div>
                <Footer />
                {/* ✅ 모바일 하단 탭 추가 */}
                <MobileBottomNav />
            </div>
        </LoginMemberContext.Provider>
    )
}
