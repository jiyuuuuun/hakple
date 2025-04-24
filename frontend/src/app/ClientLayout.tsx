'use client'

import { useEffect } from 'react'
import { useLoginMember, LoginMemberContext } from '@/stores/auth/loginMember'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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
        checkAdminAndRedirect,
        setIsLogin
    } = useLoginMember()

    //전역 Store등록, context api기술을 썼다고 함
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

    const router = useRouter()

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

                // 로그인된 경우 추가 정보 조회
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


    //[]최초 요청시 api를 보낸다, 요청시에도 저게 돌아간다고 한다
    useEffect(() => {
        console.log('ClientLayout - 로그인 상태 확인 시작')

        // 현재 페이지 경로 확인
        const currentPath = window.location.pathname

        // 로그인이 필요없는 페이지 목록
        const publicPages = ['/login', '/signup', '/', '/about', '/signup/success']

        // 로그인 검증을 우회할 특별 페이지들
        const specialPages = ['/login', '/admin']

        // 현재 페이지가 로그인이 필요없는 페이지인지 확인
        const isPublicPage = publicPages.some((page) => currentPath.startsWith(page))

        // 현재 페이지가 특별 페이지인지 확인
        const isSpecialPage = specialPages.some((page) => currentPath.startsWith(page))

        console.log('페이지 정보 - 현재 경로:', currentPath, '공개 페이지:', isPublicPage, '특별 페이지:', isSpecialPage)

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
                if (currentPath === '/login' && !isSpecialPage) {
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
                console.log('로그인 상태 확인 완료, 현재 로그인 상태:', isLogin, '현재 페이지:', currentPath, '공개 페이지 여부:', isPublicPage)
            })
    }, []) // 초기 로딩 시에만 실행

    if (isLoginMemberPending) {
        return (
          <div className="flex-1 flex justify-center items-center text-muted-foreground">
            로그인중...
          </div>
        );
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
