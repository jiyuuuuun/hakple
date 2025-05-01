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

    // 링크 클릭 처리 함수 추가
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isLogin && !loginMember?.academyCode) {
            e.preventDefault(); // 기본 링크 동작 방지
            alert('학원코드를 먼저 등록하세요');
            router.push('/myinfo/academyRegister');
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
                                        onClick={handleLinkClick}
                                    >
                                        공지사항
                                    </Link>
                                    <Link
                                        href="/post"
                                        className={`font-medium text-lg ${pathname === '/post' && !searchParams.get('type') ? 'text-purple-700 font-semibold' : 'text-gray-700'} hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all`}
                                        onClick={handleLinkClick}
                                    >
                                        자유게시판
                                    </Link>
                                    <Link
                                        href="/post?type=popular"
                                        className={`font-medium text-lg ${pathname === '/post' && searchParams.get('type') === 'popular' ? 'text-purple-700 font-semibold' : 'text-gray-700'} hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all`}
                                        onClick={handleLinkClick}
                                    >
                                        인기글
                                    </Link>
                                    <Link
                                        href="/calendar"
                                        className={`font-medium text-lg ${pathname === '/calendar' ? 'text-purple-700 font-semibold' : 'text-gray-700'} hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all`}
                                        onClick={handleLinkClick}
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
                                    className="relative p-2 text-gray-600 hover:text-[#9C50D4] focus:outline-none transition-colors rounded-full hover:bg-purple-50"
                                    aria-label="알림"
                                >
                                    <BellIcon className="h-6 w-6" />
                                    {notificationCount > 0 && (
                                        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white transform translate-x-1/3 -translate-y-1/3 bg-[#9C50D4] rounded-full ring-2 ring-white">
                                            {notificationCount > 99 ? '99+' : notificationCount}
                                        </span>
                                    )}
                                </button>

                                {isNotificationOpen && (
                                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl overflow-hidden z-20 border border-gray-200 transform origin-top-right transition-all duration-200">
                                        <div className="py-3 px-4 bg-gradient-to-r from-[#9C50D4]/10 to-purple-100/30 flex justify-between items-center border-b border-gray-200">
                                            <span className="font-medium text-gray-800 flex items-center">
                                                <BellIcon className="h-5 w-5 mr-2 text-[#9C50D4]" />
                                                알림
                                            </span>
                                            <button
                                                onClick={handleRefresh}
                                                disabled={isLoadingCount || isLoadingNotifications}
                                                className="p-1.5 text-gray-500 hover:text-[#9C50D4] disabled:opacity-50 rounded-full hover:bg-purple-50 transition-colors"
                                                aria-label="알림 새로고침"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${(isLoadingCount || isLoadingNotifications) ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0115.357-2m0 0H15" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="py-1 max-h-96 overflow-y-auto">
                                            {isLoadingNotifications ? (
                                                <div className="py-8 flex flex-col items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9C50D4] mb-2"></div>
                                                    <p className="text-sm text-gray-500">알림을 가져오는 중...</p>
                                                </div>
                                            ) : notifications.length > 0 ? (
                                                notifications.map((notification) => {
                                                    // 알림 타입에 따른 아이콘 선택
                                                    let icon;
                                                    
                                                    switch(notification.notificationType) {
                                                        case 'POST_LIKE':
                                                            icon = (
                                                                <div className="bg-red-50 rounded-full p-2 flex-shrink-0">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            );
                                                            break;
                                                        case 'POST_COMMENT':
                                                            icon = (
                                                                <div className="bg-blue-50 rounded-full p-2 flex-shrink-0">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            );
                                                            break;
                                                        case 'POPULAR_POST':
                                                            icon = (
                                                                <div className="bg-yellow-50 rounded-full p-2 flex-shrink-0">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                </div>
                                                            );
                                                            break;
                                                        default:
                                                            icon = (
                                                                <div className="bg-purple-50 rounded-full p-2 flex-shrink-0">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#9C50D4]" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                                                    </svg>
                                                                </div>
                                                            );
                                                    }
                                                    
                                                    return (
                                                        <Link
                                                            key={notification.id}
                                                            href={notification.link}
                                                            className={`flex items-start px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${notification.isRead ? 'bg-white' : 'bg-purple-50/30'}`}
                                                            onClick={() => {
                                                                if (!notification.isRead) {
                                                                    markNotificationAsRead(notification.id);
                                                                }
                                                                setIsNotificationOpen(false);
                                                            }}
                                                        >
                                                            {icon}
                                                            <div className="ml-3 flex-1">
                                                                <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-1 flex items-center">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    {formatRelativeTime(notification.creationTime)}
                                                                </p>
                                                            </div>
                                                            {!notification.isRead && (
                                                                <span className="h-2 w-2 bg-[#9C50D4] rounded-full flex-shrink-0 mt-1.5"></span>
                                                            )}
                                                        </Link>
                                                    )
                                                })
                                            ) : (
                                                <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                                                    <div className="bg-purple-50 rounded-full p-4 mb-3">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#9C50D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-gray-500 font-medium mb-1">새로운 알림이 없습니다</p>
                                                    <p className="text-xs text-gray-400">새로운 소식이 있으면 여기에 알려드릴게요!</p>
                                                </div>
                                            )}
                                        </div>
                                        {notifications.length > 0 && (
                                            <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-center">
                                                <button
                                                    className="text-xs text-[#9C50D4] hover:text-purple-600 transition-colors"
                                                    onClick={() => {
                                                        // 모든 알림을 읽음 처리하는 로직을 추가할 수 있음
                                                        setIsNotificationOpen(false);
                                                    }}
                                                >
                                                    모든 알림 닫기
                                                </button>
                                            </div>
                                        )}
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