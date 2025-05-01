'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { fetchApi } from '@/utils/api'
import { BellIcon } from '@heroicons/react/24/outline'
import { formatRelativeTime } from '@/utils/dateUtils'

interface Notification {
    id: number;
    notificationType: 'POST_LIKE' | 'POST_COMMENT' | 'POPULAR_POST';
    message: string;
    link: string;
    isRead: boolean;
    creationTime: string;
}

interface Page<T> {
    content: T[];
    totalElements: number;
}

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [isLoadingCount, setIsLoadingCount] = useState(false);
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()
    const notificationRef = useRef<HTMLDivElement>(null);

    const { isLogin, logoutAndHome, loginMember } = useGlobalLoginMember()

    const isAuthPage = pathname === '/login' || pathname === '/signup'

    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(loginMember?.profileImageUrl || null);
    
    useEffect(() => {
        setProfileImageUrl(loginMember?.profileImageUrl || null);
    }, [loginMember]);
    
    useEffect(() => {
        if (isLogin) {

            fetchApi('/api/v1/myInfos', {
                method: 'GET',
            })
            .then(res => {
                if (!res.ok) return null;
                return res.json();
            })
            .then(data => {
                if (data && data.profileImageUrl) {

                    setProfileImageUrl(data.profileImageUrl);
                }
            })
            .catch(err => {
                console.error('프로필 이미지 정보 가져오기 실패:', err);
            });
        }
    }, [isLogin]);

    useEffect(() => {
        if (isAuthPage || !isLogin) return
        checkAdminPermission()
    }, [isAuthPage, isLogin])

    useEffect(() => {
        if (isAuthPage || !isLogin) {
            setIsAdmin(false)
            return
        }
        checkAdminPermission()
    }, [isLogin, loginMember, isAuthPage])

    useEffect(() => {
        if (isAuthPage || !isLogin) {
            setIsAdmin(false)
            return
        }

        if (pathname?.startsWith('/admin')) {
            checkAdminPermission()
        }
    }, [pathname, isLogin, isAuthPage])

    const checkAdminPermission = async () => {
        try {
            const response = await fetchApi('/api/v1/admin/check', {
                method: 'GET',
            })

            if (response.status === 401 || response.status === 403) {
                
                setIsAdmin(false)
                return
            }

            if (!response.ok) {
                
                setIsAdmin(false)
                return
            }

            const isAdminResult = await response.json()

            if (isAdminResult === true) {
                setIsAdmin(true)
            } else {
                setIsAdmin(false)
            }
        } catch (error) {
            console.error('관리자 권한 확인 중 오류 발생:', error)
            setIsAdmin(false)
        }
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        if (!isLogin) {
            alert('로그인이 필요합니다')
            router.push('/login')
            return
        }

        router.push(
            `/post?keyword=${encodeURIComponent(searchQuery.trim())}&sortType=${encodeURIComponent(
                '등록일순',
            )}&filterType=${encodeURIComponent('제목')}`,
        )

        setSearchQuery('')
    }

    const toggleNotificationDropdown = () => {
        const newState = !isNotificationOpen;
        setIsNotificationOpen(newState);
        if (newState) {
            fetchNotifications();
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };
        if (isNotificationOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNotificationOpen]);

    const markNotificationAsRead = async (notificationId: number) => {


        try {
            const response = await fetchApi(`/api/v1/notifications/my/${notificationId}/read`, {
                method: 'PATCH',
                credentials: 'include',
            });

            if (!response.ok) {
                console.error(`API 호출 실패: ${response.status}`);
                return;
            }



            setNotifications(prev => {
                const newState = prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
                return newState;
            });
            setNotificationCount(prev => {
                const newCount = Math.max(0, prev - 1);

                return newCount;
            });

        } catch (error) {
            console.error(`알림 ${notificationId} 읽음 처리 API 호출 중 오류 발생:`, error);
        }
    };

    const fetchNotifications = async (page = 0, size = 10, loadMore = false) => {

        if (!isLogin) return;
        setIsLoadingNotifications(true);
        try {
            const response = await fetchApi(`/api/v1/notifications/my?page=${page}&size=${size}&sort=creationTime,desc`);
            if (!response.ok) {
                console.error('알림 목록 가져오기 실패:', response.status);
                setNotifications([]);
                setNotificationCount(0);
                return;
            }
            const data: Page<Notification> = await response.json();

            setNotifications(data.content || []);

        } catch (error) {
            console.error('알림 목록 가져오기 중 오류 발생:', error);
            setNotifications([]);
            setNotificationCount(0);
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    const fetchUnreadCount = async () => {

        if (!isLogin) return;
        setIsLoadingCount(true);
        try {
            const response = await fetchApi('/api/v1/notifications/my/unread-count');
            if (!response.ok) throw new Error('Failed to fetch unread count');
            const data: { unreadCount: number } = await response.json();


            const newCount = data.unreadCount || 0;

            setNotificationCount(newCount);

        } catch (error) {
            console.error('읽지 않은 알림 개수 가져오기 오류:', error);
            setNotificationCount(0);
        } finally {
             setIsLoadingCount(false);
        }
    };

    useEffect(() => {

        if (isLogin) {
            const timer = setTimeout(() => {

                fetchUnreadCount();
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setNotifications([]);
            setNotificationCount(0);
            setIsNotificationOpen(false);
        }
    }, [isLogin]);

    const handleRefresh = () => {

        fetchUnreadCount();
        if (isNotificationOpen) {
            fetchNotifications(0, 10);
        }
    };

    if (isAuthPage) {
        return null
    }

    return (
        <header className="bg-[#f2edf4] py-3 sticky top-0 z-50 shadow-sm">
            <div className="w-full px-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 md:space-x-8">
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

                        {isAdmin ? (
                            <div className="flex items-center flex-shrink-0 cursor-default">
                                <img src="/logo.png" alt="HAKPLE" width={55} height={55} className="logo" />
                            </div>
                        ) : (
                            <Link href="/" className="flex items-center flex-shrink-0">
                                <img src="/logo.png" alt="HAKPLE" width={55} height={55} className="logo" />
                            </Link>
                        )}

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
                                        className={`font-medium text-lg ${pathname === '/post' && !searchParams.get('type') ? 'text-purple-700 font-semibold' : 'text-gray-700'} hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all`}
                                    >
                                        자유게시판
                                    </Link>
                                    <Link
                                        href="/post?type=popular"
                                        className={`font-medium text-lg ${pathname === '/post' && searchParams.get('type') === 'popular' ? 'text-purple-700 font-semibold' : 'text-gray-700'} hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all`}
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
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className={`font-medium text-lg ${pathname?.startsWith('/admin') ? 'text-red-700 font-semibold' : 'text-red-600'} hover:text-red-800 whitespace-nowrap hover:font-semibold transition-all flex items-center`}
                                >
                                    <span className="mr-1">👑</span>
                                    관리자
                                </Link>
                            )}
                        </nav>
                    </div>

                    <div className="flex items-center space-x-2 md:space-x-3">
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

                        {isLogin && !isAdmin && (
                            <div className="relative" ref={notificationRef}>
                                <button
                                    onClick={toggleNotificationDropdown}
                                    className="relative p-1 mr-[10px] text-gray-600 hover:text-gray-800 focus:outline-none"
                                    aria-label="알림"
                                >
                                    <BellIcon className="h-6 w-6" />
                                    {notificationCount > 0 && (
                                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                            {notificationCount > 99 ? '99+' : notificationCount}
                                        </span>
                                    )}
                                </button>

                                {isNotificationOpen && (
                                    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
                                        <div className="py-2 px-3 text-sm font-semibold text-gray-700 border-b flex justify-between items-center">
                                            <span>알림 목록</span>
                                            <button
                                                onClick={handleRefresh}
                                                disabled={isLoadingCount || isLoadingNotifications}
                                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                aria-label="알림 새로고침"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${(isLoadingCount || isLoadingNotifications) ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0115.357-2m0 0H15" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="py-1 max-h-80 overflow-y-auto">
                                            {isLoadingNotifications ? (
                                                <div className="px-4 py-3 text-sm text-gray-500 text-center">로딩 중...</div>
                                            ) : notifications.length > 0 ? (
                                                notifications.map((notification) => (
                                                    <Link
                                                        key={notification.id}
                                                        href={notification.link}
                                                        className={`block px-4 py-3 text-sm hover:bg-gray-100 ${notification.isRead ? 'text-gray-500' : 'text-gray-800 font-medium'}`}
                                                        onClick={() => {
                                                            if (!notification.isRead) {
                                                                markNotificationAsRead(notification.id);
                                                            }
                                                            setIsNotificationOpen(false);
                                                        }}
                                                    >
                                                        {notification.message}
                                                        <span className="block text-xs text-gray-400 mt-1">
                                                             {formatRelativeTime(notification.creationTime)}
                                                        </span>
                                                    </Link>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                    새로운 알림이 없습니다.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {isLogin ? (
                            <>
                                <button
                                    onClick={() => logoutAndHome()}
                                    className="bg-[#9C50D4] hover:bg-purple-500 text-white font-medium py-2 px-4 md:px-5 rounded-md text-sm whitespace-nowrap h-[36px]"
                                >
                                    로그아웃
                                </button>

                                {isAdmin ? (
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center cursor-default">
                                        {profileImageUrl ? (
                                            <img
                                                src={profileImageUrl}
                                                alt="프로필"
                                                className="min-w-full min-h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.onerror = null
                                                    target.style.display = 'none'
                                                    target.parentElement!.innerHTML = `
                                                        <div class="w-full h-full bg-purple-50 flex items-center justify-center">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                class="h-6 w-6 text-[#9C50D4]"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke-width="1.5"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    stroke-linecap="round"
                                                                    stroke-linejoin="round"
                                                                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                                                />
                                                            </svg>
                                                        </div>
                                                    `
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
                                ) : (
                                    <Link href="/myinfo" className="flex items-center">
                                        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                                            {profileImageUrl ? (
                                                <img
                                                    src={profileImageUrl}
                                                    alt="프로필"
                                                    className="min-w-full min-h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.onerror = null
                                                        target.style.display = 'none'
                                                        target.parentElement!.innerHTML = `
                                                            <div class="w-full h-full bg-purple-50 flex items-center justify-center">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    class="h-6 w-6 text-[#9C50D4]"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke-width="1.5"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        `
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
                                )}
                            </>
                        ) : (
                            <Link href="/login">
                                <button className="bg-[#9C50D4] hover:bg-purple-500 text-white font-medium py-2 px-4 md:px-5 rounded-md text-sm whitespace-nowrap h-[36px]">
                                    로그인
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="mt-3 md:hidden">
                    <nav className="flex flex-col space-y-2 py-2">
                        {!isAdmin && (
                            <>
                                <Link
                                    href="/home"
                                    className={`font-medium text-base ${pathname === '/home' ? 'text-purple-700' : 'text-gray-700'} hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100`}
                                >
                                    홈
                                </Link>
                                <Link
                                    href={isLogin && loginMember?.academyCode ? `/post/notice/${loginMember.academyCode}` : '/post/notice'}
                                    className={`font-medium text-base ${pathname?.startsWith('/post/notice') ? 'text-purple-700' : 'text-gray-700'} hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100`}
                                >
                                    공지사항
                                </Link>
                                <Link
                                    href="/post"
                                    className={`font-medium text-base ${pathname === '/post' && !searchParams.get('type') ? 'text-purple-700' : 'text-gray-700'} hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100`}
                                >
                                    자유게시판
                                </Link>
                                <Link
                                    href="/post?type=popular"
                                    className={`font-medium text-base ${pathname === '/post' && searchParams.get('type') === 'popular' ? 'text-purple-700' : 'text-gray-700'} hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100`}
                                >
                                    인기글
                                </Link>
                                <Link
                                    href="/calendar"
                                    className={`font-medium text-base ${pathname === '/calendar' ? 'text-purple-700' : 'text-gray-700'} hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100`}
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
        </header>
    );
}