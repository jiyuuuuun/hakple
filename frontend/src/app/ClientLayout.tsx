'use client'

import { useEffect } from 'react'
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

    // 로그인이 필요없는 페이지 목록
    const publicPages = ['/login', '/signup', '/', '/about', '/signup/success','/forgot-username','/forgot-password','/reset-password', '/home']

    const specialPages = ['/login', '/admin']
    // 로그인이 필요한 경로를 명시적으로 정의
    const protectedPaths = ['/myinfo', '/my-posts', '/my-comments', '/my-likes']
    
    // 루트 경로용 로그인 상태 확인 함수 (리다이렉트 방지)
    const checkLoginStatusForRoot = async (): Promise<boolean> => {
        try {
            const response = await fetchApi('/api/v1/auth/me', {
                method: 'GET',
            }, true) // preventRedirectOn401: true
            const isLoggedIn = response.ok;
            if (!isLoggedIn) {
                setNoLoginMember()
                setIsLogin(false)
            } else {
                const data = await response.json()
                setLoginMember(data)
                setIsLogin(true)
            }
            return isLoggedIn;
        } catch (err) {
            console.error('[ClientLayout] Error checking login status for root:', err);
            setNoLoginMember()
            setIsLogin(false)
            return false
        }
    }

    useEffect(() => {
        // 페이지 경로별 플래그 계산
        const isPublicPage = publicPages.some((page) => pathname?.startsWith(page))
        const isSpecialPage = specialPages.some((page) => pathname?.startsWith(page))
        const isProtectedPath = protectedPaths.some((path) => pathname?.startsWith(path))

        console.log(`[ClientLayout] useEffect triggered for path: ${pathname}`);

        // 로그인 페이지에서는 API 호출하지 않음
        if (pathname === '/login') {
            console.log('[ClientLayout] Handling /login path. Setting no login member.');
            setNoLoginMember()
            setIsLogin(false)
            return
        }
        
        // 루트 경로('/')인 경우 별도 처리
        if (pathname === '/') {
            console.log('[ClientLayout] Handling root path ('/'). Checking login status without redirect.');
            // 로그인 체크는 수행하되, 결과에 관계없이 홈 페이지 접근 허용
            checkLoginStatusForRoot().then(isLoggedInRoot => {
                console.log(`[ClientLayout] Root path login check result: ${isLoggedInRoot}`);
            });
            // 로딩 상태 해제 로직 추가 (만약 필요하다면)
            if (isLoginMemberPending) {
                const event = new CustomEvent('loginMemberLoaded')
                window.dispatchEvent(event)
            }
            return // 루트 경로는 여기서 로직 종료
        }

        // --- 이하 로직은 루트 경로가 아닐 때만 실행됨 --- 
        console.log(`[ClientLayout] Handling non-root path: ${pathname}`);

        // 로그인 상태 확인 및 리다이렉트 처리
        const checkLoginStatusForRedirect = async () => { // 다른 이름의 함수 사용
            console.log('[ClientLayout] Checking login status for redirect...');
            try {
                // 여기서는 리다이렉트 방지 옵션 불필요 (기본값 false)
                const response = await fetchApi('/api/v1/auth/me', {
                    method: 'GET',
                })
                const isLoggedIn = response.ok;
                console.log(`[ClientLayout] Login status for redirect check: ${isLoggedIn}`);
                if (!isLoggedIn) {
                    setNoLoginMember()
                    setIsLogin(false)
                } else {
                    const data = await response.json()
                    setLoginMember(data)
                    setIsLogin(true)
                }
                return isLoggedIn;
            } catch (err) {
                console.error('[ClientLayout] Error checking login status for redirect:', err);
                setNoLoginMember()
                setIsLogin(false)
                return false
            }
        }
        
        checkLoginStatusForRedirect()
            .then((isLoggedIn) => {
                console.log(`[ClientLayout] After redirect check, isLoggedIn: ${isLoggedIn}`);
                console.log(`[ClientLayout] Path info: isPublic=${isPublicPage}, isSpecial=${isSpecialPage}, isProtected=${isProtectedPath}`);
                // 로그인이 필요한 페이지인데 로그인이 안 되어 있으면 로그인 페이지로 리다이렉트
                const shouldRedirectToLogin = (!isPublicPage && !isSpecialPage && !isLoggedIn) || (isProtectedPath && !isLoggedIn);
                console.log(`[ClientLayout] Should redirect to login? ${shouldRedirectToLogin}`);
                
                if (shouldRedirectToLogin) {
                    if (pathname !== '/login') {  // 현재 페이지가 이미 로그인 페이지가 아닐 때만 리다이렉트
                        console.log(`[ClientLayout] Redirecting to /login from ${pathname}`);
                        router.replace("/login")
                    }
                } else if (pathname === '/login' && isLoggedIn) { // 로그인 페이지인데 로그인 된 경우
                     console.log(`[ClientLayout] Redirecting to /home from /login because already logged in`);
                     router.replace("/home")
                } else if (isLoggedIn && pathname?.startsWith('/myinfo')) { // 관리자가 /myinfo 접근 시
                    // ... (기존 관리자 체크 로직) ...
                }
            })
            // .finally 제거 또는 다른 처리
            
        // 로딩 상태 해제 (여기서 처리)
        if (isLoginMemberPending) {
            console.log('[ClientLayout] Dispatching loginMemberLoaded event');
            const event = new CustomEvent('loginMemberLoaded')
            window.dispatchEvent(event)
        }
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
            } catch {
            
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
