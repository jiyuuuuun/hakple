'use client'

import { useEffect } from 'react'
import { useLoginMember, LoginMemberContext } from '@/stores/auth/loginMember'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

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

    //전역 Store등록, context api기술을 썼다고 함
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

    //[]최초 요청시 api를 보낸다, 요청시에도 저게 돌아간다고 한다
    useEffect(() => {
        console.log('ClientLayout - 로그인 상태 확인 시작')

        // 현재 페이지 경로 확인
        const currentPath = window.location.pathname

        // 로그인이 필요없는 페이지 목록 (이 페이지들에서는 로그인 상태 체크만 건너뛰고, 로그인 되어있으면 그대로 유지함)
        const publicPages = ['/login', '/signup', '/', '/about', '/signup/success']

        // 현재 페이지가 로그인이 필요없는 페이지인지 확인
        const isPublicPage = publicPages.some((page) => currentPath.startsWith(page))

        // 로그인 상태 체크 API 호출
        fetch(`http://localhost:8090/api/v1/auth/me`, {
            credentials: 'include',
        })
            .then((res) => {
                console.log('로그인 상태 응답:', res.status)
                if (!res.ok) {
                    return Promise.reject(new Error('인증 필요'))
                }
                return res.json()
            })
            .then((data) => {
                // 로그인 성공
                console.log('로그인 상태 성공')

                // 로그인 상태 설정
                setLoginMember(data)

                // 로그인 페이지에 있을 경우 홈으로 리다이렉트
                if (currentPath === '/login') {
                    window.location.href = '/'
                }
            })
            .catch(() => {
                // 로그인 안됨
                console.log('로그인 되어있지 않음')

                // 로그인 상태 초기화
                setNoLoginMember()

                // 로그인이 필요한 페이지인데 로그인이 안 되어 있으면 로그인 페이지로 리다이렉트
                if (!isPublicPage) {
                    window.location.href = '/login'
                }
            })
            .finally(() => {
                console.log('로그인 상태 확인 완료, 현재 로그인 상태:', isLogin)
            })
    }, [])

    useEffect(() => {
        console.log('로그인 상태 변경:', isLogin, loginMember)
    }, [isLogin, loginMember])

    if (isLoginMemberPending) {
        return <div className="flex justify-center items-center h-screen">로그인 중...</div>
    }

    return (
        //나중에 내부적으로 접근이 가능하게 된다, 그리고 value를 통하여 전역적으로 접근이 가능하게 된다
        <LoginMemberContext.Provider value={loginMemberContextValue}>
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-grow">{children}</div>
                <Footer />
            </div>
        </LoginMemberContext.Provider>
    )
}
