'use client'

import { useEffect } from 'react'
import { useLoginMember, LoginMemberContext } from '@/stores/auth/loginMember'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { loginMember, setLoginMember, setNoLoginMember, isLoginMemberPending, isLogin, logout, logoutAndHome } =
        useLoginMember()

    //전역 Store등록, context api기술을 썼다고 함
    const loginMemberContextValue = {
        loginMember,
        setLoginMember,
        setNoLoginMember,
        isLoginMemberPending,
        isLogin,
        logout,
        logoutAndHome,
    }

    // // URL 쿼리 파라미터에서 토큰 확인
    // useEffect(() => {
    //     if (typeof window !== 'undefined') {
    //         // URL 쿼리 파라미터 파싱
    //         const urlParams = new URLSearchParams(window.location.search);
    //         const accessToken = urlParams.get('accessToken');
    //         const refreshToken = urlParams.get('refreshToken');
            
    //         // URL에 토큰이 있으면 저장
    //         if (accessToken) {
    //             console.log('URL에서 액세스 토큰 발견, 저장합니다');
    //             localStorage.setItem('accessToken', accessToken);
    //         }
            
    //         if (refreshToken) {
    //             console.log('URL에서 리프레시 토큰 발견, 저장합니다');
    //             localStorage.setItem('refreshToken', refreshToken);
    //         }
            
    //         // 토큰이 있었다면 현재 URL에서 토큰 파라미터 제거 (보안상 이유로)
    //         if (accessToken || refreshToken) {
    //             // 현재 URL에서 토큰 쿼리 파라미터를 제거하고 히스토리에 추가하지 않음
    //             const cleanUrl = window.location.pathname + window.location.hash;
    //             window.history.replaceState({}, document.title, cleanUrl);
    //         }
    //     }
    // }, []);

    //[]최초 요청시 api를 보낸다, 요청시에도 저게 돌아간다고 한다
    useEffect(() => {
        console.log('ClientLayout - 로그인 상태 확인 시작')
        
        // if (typeof window !== 'undefined') {
        //     // URL 쿼리 파라미터 파싱
        //     const urlParams = new URLSearchParams(window.location.search);
        //     const accessToken = urlParams.get('accessToken');
        //     const refreshToken = urlParams.get('refreshToken');
            
        //     // URL에 토큰이 있으면 저장
        //     if (accessToken) {
        //         console.log('URL에서 액세스 토큰 발견, 저장합니다');
        //         localStorage.setItem('accessToken', accessToken);
        //     }
            
        //     if (refreshToken) {
        //         console.log('URL에서 리프레시 토큰 발견, 저장합니다');
        //         localStorage.setItem('refreshToken', refreshToken);
        //     }
            
        //     // 토큰이 있었다면 현재 URL에서 토큰 파라미터 제거 (보안상 이유로)
        //     if (accessToken || refreshToken) {
        //         // 현재 URL에서 토큰 쿼리 파라미터를 제거하고 히스토리에 추가하지 않음
        //         const cleanUrl = window.location.pathname + window.location.hash;
        //         window.history.replaceState({}, document.title, cleanUrl);
        //     }
        // }

        
        // if (typeof window === 'undefined') {
        //     // 서버 사이드에서는 실행하지 않음
        //     return;
        // }

        
        // 로컬 스토리지에서 액세스 토큰 확인
        // const accessToken = localStorage.getItem('accessToken')
        // console.log('ClientLayout - 액세스 토큰 확인:', !!accessToken)
        
        // if (!accessToken) {
        //     console.log('ClientLayout - 액세스 토큰 없음, 로그인 상태 아님')
        //     setNoLoginMember()
        //     return
        // }

        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/me`, {
            //요청마다 헤더에 쿠키가 자동 실행된다고 한다
            credentials: 'include',
            // headers: {
            //     'Authorization': `Bearer ${accessToken}`,
            //     'Content-Type': 'application/json'
            // }
        })
            .then((res) => {
                console.log('로그인 상태 응답:', res.status)
                if (!res.ok) {
                    throw new Error('인증 실패')
                }
                return res.json()
            })
            .then((data) => {
                //로그인 성공시
                console.log('로그인 상태 성공 데이터:', data)
                setLoginMember(data)
            })
            .catch((error) => {
                //로그인이 안되있다면
                console.error('로그인 상태 확인 에러:', error)
                // 에러 발생 시 토큰 삭제
                localStorage.removeItem('accessToken')
                setNoLoginMember()
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
