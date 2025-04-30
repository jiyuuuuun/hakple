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

    // State to track if profile image fetch attempt was made
    const [profileImageFetchAttempted, setProfileImageFetchAttempted] = useState(false);

    useEffect(() => {
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

    const pathname = usePathname()

    const hideHeaderFooterPages = [
        '/login',
        '/signup',
        '/forgot-username',
        '/forgot-password',
        '/reset-password'
    ]

    const shouldHideHeaderFooter = hideHeaderFooterPages.some(page =>
        pathname?.startsWith(page)
    )
    const shouldHideFooter = pathname === '/' || shouldHideHeaderFooter;

    const publicPages = ['/login', '/signup', '/', '/about', '/signup/success','/forgot-username','/forgot-password','/reset-password', '/home']
    const protectedPaths = ['/myinfo', '/my-posts', '/my-comments', '/my-likes']

    useEffect(() => {
        const checkLoginAndHandleRedirect = async () => {
            let isLoggedIn = false;
            let userData = null;

            try {
                console.log(`[ClientLayout] Checking login status for ${pathname}...`);
                const response = await fetchApi('/api/v1/auth/me', { method: 'GET' }, true);
                isLoggedIn = response.ok;

                if (isLoggedIn) {
                    userData = await response.json();
                    setLoginMember(userData);
                    setIsLogin(true);
                    console.log(`[ClientLayout] User is logged in on ${pathname}.`);
                } else {
                    setNoLoginMember();
                    setIsLogin(false);
                    console.log(`[ClientLayout] User is not logged in on ${pathname} (Status: ${response.status}).`);
                }
            } catch (err) {
                console.error('[ClientLayout] Error checking login status:', err);
                setNoLoginMember();
                setIsLogin(false);
                isLoggedIn = false;
            } finally {
                 console.log('[ClientLayout] Dispatching loginMemberLoaded event (if needed).');
                 const event = new CustomEvent('loginMemberLoaded')
                 window.dispatchEvent(event)
            }

            const isPublicPage = publicPages.some((page) => pathname?.startsWith(page));
            const isLoginPage = pathname === '/login';
            const isSignupPage = pathname === '/signup';
            const isProtectedPath = protectedPaths.some((path) => pathname?.startsWith(path));

            console.log(`[ClientLayout] Redirection logic: isLoggedIn=${isLoggedIn}, pathname=${pathname}, isPublic=${isPublicPage}, isProtected=${isProtectedPath}, isLogin=${isLoginPage}, isSignup=${isSignupPage}`);

            if (!isLoggedIn) {
                if (isProtectedPath) {
                    console.log('[ClientLayout] Accessing protected path while logged out. Redirecting to /login.');
                    router.replace("/login");
                }
                else {
                     console.log('[ClientLayout] Accessing non-protected path while logged out. Allowing access.');
                }
            } else {
                if (isLoginPage || isSignupPage) {
                    console.log(`[ClientLayout] Accessing ${pathname} while logged in. Redirecting to /home.`);
                    router.replace("/home");
                }
                else {
                     console.log('[ClientLayout] Accessing allowed path while logged in.');
                }
            }
        };

        checkLoginAndHandleRedirect();

    }, [pathname, router, setLoginMember, setNoLoginMember, setIsLogin]);

    useEffect(() => {
        if (isLogin && !loginMember.profileImageUrl && !profileImageFetchAttempted) {
            console.log('[ClientLayout] Attempting to fetch profile image...');
            setProfileImageFetchAttempted(true);

            const fetchUserInfoAndUpdate = async () => {
                try {
                    const response = await fetchApi('/api/v1/myInfos', { method: 'GET' }, true);

                    if (!response.ok) {
                        console.warn('[ClientLayout] Could not fetch user info to update profile image.');
                        return;
                    }

                    const data = await response.json();

                    if (data.profileImageUrl) {
                        console.log('[ClientLayout] Profile image found, updating loginMember state.');
                        setLoginMember(data);
                    } else {
                         console.log('[ClientLayout] Fetched user info, but profile image is still missing.');
                    }
                } catch(err) {
                    console.error('[ClientLayout] Error fetching user info for profile image:', err);
                }
            };
            fetchUserInfoAndUpdate();
        }

        if (!isLogin && profileImageFetchAttempted) {
            console.log('[ClientLayout] User logged out, resetting profile image fetch flag.');
            setProfileImageFetchAttempted(false);
        }

    }, [isLogin, loginMember.profileImageUrl, profileImageFetchAttempted]);

    if (isLoginMemberPending) {
        return (
            <div className="flex justify-center items-center h-screen">
                로그인 확인 중...
            </div>
        )
    }

    return (
        <LoginMemberContext.Provider value={loginMemberContextValue}>
            <div className="flex flex-col min-h-screen">
                {!shouldHideHeaderFooter && <Header />}
                <div className="flex-grow">{children}</div>
                {!shouldHideFooter && <Footer />}
                {!shouldHideHeaderFooter && <MobileBottomNav />}
            </div>
        </LoginMemberContext.Provider>
    )
}
