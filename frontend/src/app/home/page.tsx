'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
// API 유틸리티 추가
import { fetchApi } from '@/utils/api'
import { handleLike } from '@/utils/likeHandler'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import '@/app/calendar/calendar.css' // ➕ 커스텀 스타일 적용할 파일
import PostListSkeleton from '@/components/PostListSkeleton'
import NoticeSkeleton from '@/components/NoticeSkeleton'
import ProfileSkeleton from '@/components/ProfileSkeleton'
import AcademySkeleton from '@/components/AcademySkeleton'
import { formatRelativeTime } from '@/utils/dateUtils'

// 스타일시트를 위한 import 추가 - CDN 방식으로 헤드에 추가는 layout에서 처리
// 대신 SVG 아이콘 컴포넌트를 직접 사용합니다

// 댓글 인터페이스
interface Comment {
    id: number
    content: string
    nickname: string
    creationTime: string
}

// 좋아요 인터페이스
interface Like {
    id: number
    nickname: string
}

// Post 인터페이스 정의
interface Post {
    id: number
    title: string
    content: string
    nickname: string
    creationTime: string
    modificationTime?: string
    viewCount: number
    commentCount: number
    likeCount: number
    tags: string[]
    boardComments?: Comment[]
    boardLikes?: Like[]
    isReported?: boolean
    isLiked?: boolean
    profileImageUrl?: string
    hasImage?: boolean
}

// API 응답 타입
interface ApiResponse {
    content: Post[]
    totalPages: number
    totalElements: number
    last: boolean
}

// 일정 인터페이스 추가
interface EventItem {
    id: string
    title: string
    start: string
    end: string
    color?: string
}

// 사용자 정보 타입 정의
type UserInfo = {
    nickName: string
    phoneNum: string
    userName: string
    creationTime: string
    academyCode: string
    academyName?: string
    profileImageUrl?: string
    email?: string
    postCount?: number
    commentCount?: number
    likeCount?: number
}

export default function HomePage() {
    const router = useRouter()
    const { isLogin } = useGlobalLoginMember()
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
    const [academyName, setAcademyName] = useState<string | null>(null)
    const [academyCode, setAcademyCode] = useState<string | null>(null)
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [events, setEvents] = useState<EventItem[]>([])
    const [showPostMenu, setShowPostMenu] = useState<number | null>(null)
    const [isReporting, setIsReporting] = useState(false)
    const postMenuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
    const [popularPosts, setPopularPosts] = useState<Post[]>([])
    const [popularTags, setPopularTags] = useState<{ name: string; count: number }[]>([])
    const [likingPosts, setLikingPosts] = useState<Set<number>>(new Set())
    const [noticePostsLoaded, setNoticePostsLoaded] = useState<boolean>(false)

    // 학원 이름 찾기 함수 (학원 코드로부터)
    const getAcademyNameFromCode = (code: string): string => {
        if (typeof window !== 'undefined') {
            // 로컬 스토리지에서 학원 이름 확인
            const storedAcademyName = localStorage.getItem('academyName')
            if (storedAcademyName && localStorage.getItem('academyCode') === code) {
                return storedAcademyName
            }
        }
        return code ? '등록된 학원' : ''
    }

    // localStorage 관련 디버깅 함수
    const checkAndUpdateAcademyInfo = () => {
        // typeof window !== 'undefined'는 클라이언트 사이드에서만 실행되도록 함
        if (typeof window !== 'undefined') {
            const storedAcademyName = localStorage.getItem('academyName')
            const storedAcademyCode = localStorage.getItem('academyCode')

            // 값이 변경된 경우에만 상태 업데이트
            if (academyName !== storedAcademyName) {
                setAcademyName(storedAcademyName)
            }

            if (academyCode !== storedAcademyCode) {
                setAcademyCode(storedAcademyCode)
            }

            // 학원 이름과 코드가 모두 있는지 확인
            return !!(storedAcademyName && storedAcademyCode)
        }
        return false
    }

    // 백엔드에서 사용자의 학원 정보 확인
    const verifyAcademyInfo = async () => {
        try {
            const response = await fetchApi('/api/v1/myInfos', {
                method: 'GET',
            })

            if (response.ok) {
                const data = await response.json()

                // 백엔드에서 받은 학원 정보 활용
                if (data.academyCode) {
                    // 백엔드에 학원 정보가 있으면 로컬 스토리지 업데이트
                    if (data.academyName) {
                        localStorage.setItem('academyName', data.academyName)
                        setAcademyName(data.academName)
                    }
                    localStorage.setItem('academyCode', data.academyCode)
                    setAcademyCode(data.academyCode)
                } else {
                    // 백엔드에 학원 정보가 없으면 로컬 스토리지 초기화
                    if (academyCode || localStorage.getItem('academyCode')) {
                        localStorage.removeItem('academyName')
                        localStorage.removeItem('academyCode')
                        setAcademyName(null)
                        setAcademyCode(null)
                    }
                }
            }
        } catch (error) {
            console.log('사용자 정보 확인 중 오류:', error)
        }
    }

    // 사용자 정보와 통계 가져오기
    const fetchUserInfoAndStats = async () => {
        try {
            // 사용자 기본 정보 가져오기
            const infoResponse = await fetchApi('/api/v1/myInfos', {
                method: 'GET',
            })

            if (infoResponse.ok) {
                const userData = await infoResponse.json()

                // 통계 정보 가져오기
                const [postsResponse, commentsResponse, likesResponse] = await Promise.all([
                    fetchApi('/api/v1/posts/my?page=0&size=1', { credentials: 'include' }),
                    fetchApi('/api/v1/comments/my?page=0&size=1', { credentials: 'include' }),
                    fetchApi('/api/v1/posts/my/likes?page=0&size=1', { credentials: 'include' }),
                ])

                const [postsData, commentsData, likesData] = await Promise.all([
                    postsResponse.ok ? postsResponse.json() : { totalElements: 0 },
                    commentsResponse.ok ? commentsResponse.json() : { totalElements: 0 },
                    likesResponse.ok ? likesResponse.json() : { totalElements: 0 },
                ])

                // 통계 정보 추가
                const userInfoWithStats = {
                    ...userData,
                    postCount: postsData.totalElements || 0,
                    commentCount: commentsData.totalElements || 0,
                    likeCount: likesData.totalElements || 0,
                }

                // 학원 정보 처리
                if (userInfoWithStats.academyCode) {
                    const academyName =
                        userInfoWithStats.academyName || getAcademyNameFromCode(userInfoWithStats.academyCode)
                    userInfoWithStats.academyName = academyName
                    localStorage.setItem('academyName', academyName)
                    localStorage.setItem('academyCode', userInfoWithStats.academyCode)
                }

                setUserInfo(userInfoWithStats)

                // 로컬 스토리지 업데이트
                if (userInfoWithStats.userName) {
                    localStorage.setItem('username', userInfoWithStats.userName)
                }
                if (userInfoWithStats.email) {
                    localStorage.setItem('email', userInfoWithStats.email)
                }
            }
        } catch (error) {
            console.error('사용자 정보 및 통계 조회 중 오류:', error)
        }
    }

    useEffect(() => {
        // 로그인 상태가 아닐 경우 API 호출 및 페이지 접근을 막음
        if (!isLogin) {
            // 로그인 페이지로 보내는 대신, 로딩 상태를 유지하거나
            // 혹은 비로그인 상태의 홈 화면을 보여줄 수 있음.
            // 여기서는 일단 로딩 상태만 해제하고 함수를 종료.
            setLoading(false);
            return;
        }

        // 이하 로직은 isLogin이 true일 때만 실행됨
        fetchUserInfoAndStats()
        fetchLatestPosts()
        fetchEvents()
        fetchPopularPosts()
        fetchPopularTags() // 인기 태그 가져오기 추가
        fetchNoticeBoards() // 공지사항 가져오기 추가

        // 페이지 포커스 이벤트 핸들러
        const handleFocus = () => {
            // 로그인 상태일 때만 실행
            if (isLogin) {
                checkAndUpdateAcademyInfo()
                fetchUserInfoAndStats() // 포커스 시 정보 다시 가져오기
            }
        }

        window.addEventListener('focus', handleFocus)
        return () => {
            window.removeEventListener('focus', handleFocus)
        };
    }, [isLogin]); // isLogin을 의존성 배열에 추가

    // 로딩 중 표시 강화
    if (loading && isLogin === null) { // isLogin 상태가 아직 결정되지 않았을 때
        return (
             <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                 <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#9C50D4]"></div>
             </div>
        );
    }

    // 로그인하지 않은 경우 (isLogin이 false로 확정된 경우)
    if (!isLogin) {
        // 비로그인 사용자를 위한 홈 화면 컴포넌트 또는 메시지 표시
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow">
                    <p className="text-lg mb-4">로그인이 필요한 서비스입니다.</p>
                    <Link
                        href="/login"
                        className="inline-block px-6 py-2 bg-[#9C50D4] text-white rounded-md hover:bg-purple-500 transition-colors"
                    >
                        로그인 페이지로 이동
                    </Link>
                </div>
            </div>
        );
    }

    // 외부 클릭 감지 - 메뉴 닫기
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // 메뉴 버튼 클릭은 무시
            const target = event.target as Element
            if (target.closest('.menu-button') || target.closest('.menu-item')) {
                return
            }

            // 활성화된 메뉴가 있을 때만 체크
            if (showPostMenu !== null) {
                const activeRef = postMenuRefs.current[showPostMenu]
                if (activeRef && !activeRef.contains(event.target as Node)) {
                    setShowPostMenu(null)
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showPostMenu])

    // 게시글 가져오기
    const fetchLatestPosts = async () => {
        setLoading(true)
        try {
            // API 요청 URL 구성 (size=5로 최신 5개 게시글만 가져옴)
            const url = `/api/v1/posts?page=1&size=5&sortType=creationTime,desc`

            // API 유틸리티 함수 사용
            const response = await fetchApi(url, {
                method: 'GET',
            })

            if (!response.ok) {
                setPosts([])
                return
            }

            const data = (await response.json()) as ApiResponse

            // 응답 데이터 처리
            if (data && Array.isArray(data.content)) {
                const posts = data.content.map((post: Post) => ({
                    ...post,
                    commentCount: post.commentCount || (post.boardComments ? post.boardComments.length : 0),
                    likeCount: post.likeCount || (post.boardLikes ? post.boardLikes.length : 0),
                }))

                // 각 게시글의 좋아요 상태 확인
                const postsWithLikeStatus = await Promise.all(
                    posts.map(async (post) => {
                        try {
                            const likeStatusResponse = await fetchApi(`/api/v1/posts/${post.id}/like-status`, {
                                credentials: 'include',
                            })
                            if (likeStatusResponse.ok) {
                                const { isLiked } = await likeStatusResponse.json()
                                return { ...post, isLiked }
                            }
                            return { ...post, isLiked: false }
                        } catch (error) {
                            console.error('좋아요 상태 확인 중 오류:', error)
                            return { ...post, isLiked: false }
                        }
                    }),
                )

                setPosts(postsWithLikeStatus)
            } else {
                setPosts([])
            }
        } catch (error) {
            console.error('게시글 로딩 중 오류:', error)
            setPosts([])
        } finally {
            setLoading(false)
        }
    }

    // 일정 데이터 가져오기
    const fetchEvents = async () => {
        try {
            const res = await fetchApi('/api/v1/schedules', {
                method: 'GET',
            })
            if (!res.ok) return

            const data = await res.json()

            // 서버 응답 타입 명시
            interface ScheduleItem {
                id: number | string
                title: string
                startDate: string
                endDate: string
                color?: string
            }

            const mappedEvents = (data as ScheduleItem[]).map((item) => ({
                id: String(item.id),
                title: item.title,
                start: item.startDate,
                end: item.endDate,
                color: item.color,
            }))

            setEvents(mappedEvents)
        } catch (err) {
            console.error('일정 로딩 중 오류:', err)
        }
    }

    // 인기글 가져오기 함수
    const fetchPopularPosts = async () => {
        try {
            // API 요청 URL 구성 (좋아요 10개 이상, 최대 5개 게시글)

            const url = `/api/v1/posts?type=popular&page=1&size=10&sortType=creationTime`


            const response = await fetchApi(url, {
                method: 'GET',
            })

            if (!response.ok) {
                setPopularPosts([])
                return
            }

            const data = await response.json()
            if (data && Array.isArray(data.content)) {
                // 각 게시글의 좋아요 상태 확인
                const postsWithLikeStatus = await Promise.all(
                    data.content.map(async (post: Post) => {
                        try {
                            const likeStatusResponse = await fetchApi(`/api/v1/posts/${post.id}/like-status`, {
                                credentials: 'include',
                            })
                            if (likeStatusResponse.ok) {
                                const { isLiked } = await likeStatusResponse.json()
                                return { ...post, isLiked }
                            }
                            return { ...post, isLiked: false }
                        } catch (error) {
                            console.error('좋아요 상태 확인 중 오류:', error)
                            return { ...post, isLiked: false }
                        }
                    })
                )
                setPopularPosts(postsWithLikeStatus)
            } else {
                setPopularPosts([])
            }
        } catch (error) {
            console.error('인기글 로딩 중 오류:', error)
            setPopularPosts([])
        }
    }

    // 인기 태그 가져오기 함수
    const fetchPopularTags = async () => {
        try {
            const response = await fetchApi('/api/v1/posts/tags/popular', {
                method: 'GET',            
            })

            if (!response.ok) {
                setPopularTags([])
                return
            }

            const data = await response.json()
            setPopularTags(data)
        } catch (error) {
            console.error('인기 태그 로딩 중 오류:', error)
            setPopularTags([])
        }
    }

    // 메뉴 토글 함수
    const togglePostMenu = (e: React.MouseEvent, postId: number) => {
        e.stopPropagation()
        e.preventDefault()
        setShowPostMenu(showPostMenu === postId ? null : postId)
    }

    // 게시글 신고 함수
    const handleReport = async (postId: number) => {
        if (!isLogin) {
            alert(' 기능입니다.')
            router.push('/login')
            return
        }

        if (isReporting) return

        const confirmed = window.confirm('정말로 이 게시글을 신고하시겠습니까?')
        if (!confirmed) return

        setIsReporting(true)

        try {
            const response = await fetchApi(`/api/v1/posts/${postId}/report`, {
                method: 'POST',
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || '게시글 신고에 실패했습니다.')
            }

            // 신고 상태 업데이트
            setPosts((prevPosts) =>
                prevPosts.map((post) => (post.id === postId ? { ...post, isReported: true } : post)),
            )

            alert('게시글이 신고되었습니다.')
            setShowPostMenu(null)
        } catch (error) {
            console.error('게시글 신고 중 오류:', error)
            alert(error instanceof Error ? error.message : '게시글 신고 중 오류가 발생했습니다.')
        } finally {
            setIsReporting(false)
        }
    }

    // 좋아요 처리 함수
    const handleLikeClick = async (post: Post, event: React.MouseEvent) => {
        event.preventDefault(); // Link 컴포넌트의 기본 동작 방지

        if (likingPosts.has(post.id)) return; // 이미 처리 중인 경우 중복 요청 방지

        const isLiked = post.isLiked || false;

        setLikingPosts(prev => new Set([...prev, post.id]));

        try {
            await handleLike({
                post,
                isLiked,
                isLogin,
                setIsLiked: (newLiked: boolean) => {
                    // 일반 게시글 목록 업데이트
                    setPosts((prevPosts) => prevPosts.map((p) => (p.id === post.id ? { ...p, isLiked: newLiked } : p)));
                    
                    // 인기글 목록도 업데이트
                    setPopularPosts((prevPosts) => prevPosts.map((p) => (p.id === post.id ? { ...p, isLiked: newLiked } : p)));
                },
                setPost: (updateFn: (prev: Post) => Post) => {
                    // 일반 게시글 목록 업데이트
                    setPosts((prevPosts) => prevPosts.map((p) => (p.id === post.id ? updateFn(p) : p)));
                    
                    // 인기글 목록도 업데이트
                    setPopularPosts((prevPosts) => prevPosts.map((p) => (p.id === post.id ? updateFn(p) : p)));
                },
                setIsLiking: () => {
                    setLikingPosts((prev) => {
                        const next = new Set(prev)
                        next.delete(post.id)
                        return next
                    })
                },
            })
        } catch (error) {
            console.error('좋아요 처리 중 오류:', error)
            setLikingPosts((prev) => {
                const next = new Set(prev)
                next.delete(post.id)
                return next
            })
        }
    }

    const [noticePosts, setNoticePosts] = useState<Post[]>([])

    const fetchNoticeBoards = async () => {
        try {
            const storedAcademyCode = localStorage.getItem('academyCode')
            if (!storedAcademyCode) {
                setNoticePosts([])
                return
            }

            // sortType을 백엔드가 처리할 수 있는 값으로 변경 (등록일순 -> creationTime)
            const response = await fetchApi(`/api/v1/posts/notice?page=1&size=3&sortType=creationTime&type=notice&academyCode=${storedAcademyCode}`, {
                method: 'GET',
            })

        
            if (!response.ok) {
                console.error('공지사항 로딩 실패:', response.status, '- 응답 상태:', response.statusText)
                
                // 응답 본문을 확인하여 추가 디버깅 정보 제공
                try {
                    const errorText = await response.text()
                    if (errorText) {
                        console.error('공지사항 로딩 에러 응답:', errorText)
                    }
                } catch (textError) {
                    console.error('응답 본문 확인 실패:', textError)
                }
                
                setNoticePosts([])
                return
            }

            const data = await response.json()
            setNoticePosts(data.content || [])
        } catch (err) {
            console.error('공지사항 로딩 중 오류:', err)
            setNoticePosts([])
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-[1600px] mx-auto px-1 sm:px-2 md:px-3 py-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* 왼쪽 사이드바 - 현재 학원 */}
                    <aside className="w-full md:w-64 shrink-0">
                        {/* 현재 학원 섹션 */}
                        {loading ? (
                            <AcademySkeleton />
                        ) : (
                            <div className="bg-white rounded-lg shadow p-4 mb-6 mt-8">
                                <h2 className="text-lg font-semibold mb-4 text-gray-800">현재 학원</h2>
                                <div className="space-y-2">
                                    {userInfo?.academyCode ? (
                                        <div className="p-2 rounded-md flex items-center justify-between">
                                            <span className="text-gray-700 text-lg font-medium">
                                                {userInfo.academyName || '등록된 학원'}
                                            </span>
                                            <div className="flex items-center text-[#9C50D4]">
                                                <span className="w-2 h-2 bg-[#9C50D4] rounded-full mr-1"></span>
                                                <span className="text-sm">활성</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <Link href="/myinfo/academyRegister" className="block">
                                            <div className="p-3 bg-purple-50 rounded-md flex items-center justify-between hover:bg-purple-100 transition-colors">
                                                <span className="text-[#9C50D4] font-medium">학원 등록하러 가기</span>
                                                <ChevronRightIcon className="h-5 w-5 text-[#9C50D4]" />
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 인기글 순위 섹션 */}
                        <div className="bg-white rounded-lg shadow p-4 mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">인기글 TOP 5</h2>
                            <div className="space-y-3">
                                {popularPosts.length > 0
                                    ? popularPosts.map((post, index) => (
                                        <Link key={post.id} href={`/post/${post.id}`}>
                                            <div className="group p-3 rounded-md hover:bg-purple-50 transition-colors">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className={`font-bold ${index < 3 ? 'text-[#9C50D4]' : 'text-gray-400'
                                                            }`}
                                                    >
                                                        {index + 1}
                                                    </span>
                                                    <h3 className="font-medium text-gray-900 group-hover:text-[#9C50D4] transition-colors line-clamp-1">
                                                        {post.title}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <div 
                                                        onClick={(e) => handleLikeClick(post, e)}
                                                        className={`flex items-center gap-1 cursor-pointer ${
                                                            post.isLiked ? 'text-[#9C50D4]' : ''
                                                        }`}
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className={`h-4 w-4 ${likingPosts.has(post.id) ? 'animate-pulse' : ''}`}
                                                            fill={post.isLiked ? 'currentColor' : 'none'}
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                            />
                                                        </svg>
                                                        {post.likeCount}
                                                    </div>
                                                    <span className="text-gray-300">•</span>
                                                    <div className="flex items-center gap-1">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                        </svg>
                                                        {post.viewCount}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                    : // 인기글이 없을 때 메시지 표시
                                    <div className="p-6 text-center">
                                        <p className="text-gray-500 text-md">인기글이 없습니다</p>
                                    </div>
                                }
                            </div>
                        </div>

                        {/* 공지사항 섹션 */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-800">공지사항</h2>
                            </div>

                            {loading ? (
                                <NoticeSkeleton count={3} />
                            ) : noticePosts.length > 0 ? (
                                <ul className="space-y-3">
                                    {noticePosts.map((notice) => (
                                        <li key={notice.id}>
                                            <Link
                                                href={`/post/${notice.id}?size=5`}
                                                className="group block p-4 bg-gray-50 rounded-lg hover:bg-[#f3eaff] transition-colors"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-medium text-gray-800 group-hover:text-[#9C50D4] truncate">
                                                        {notice.title}
                                                    </h3>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                                        {new Date(notice.creationTime).toLocaleDateString('ko-KR')}
                                                    </span>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 text-sm">📭 등록된 공지사항이 없습니다.</p>
                            )}
                        </div>
                    </aside>


                    {/* 메인 피드 영역 */}
                    <div className="flex-1">
                        {/* 글쓰기 버튼 */}
                        <div className="bg-white rounded-lg shadow p-6 mb-8 mt-8">
                            <Link href="/post/new">
                                <button className="w-full flex items-center justify-center gap-3 bg-[#9C50D4] hover:bg-purple-500 text-white py-4 px-6 rounded-lg transition text-lg">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    새 글쓰기
                                </button>
                            </Link>
                        </div>

                        {/* 게시글 목록 */}
                        {loading ? (
                            <PostListSkeleton count={5} />
                        ) : posts.length > 0 ? (
                            posts.map((post) => (
                                <div
                                    key={post.id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden mb-8 transition-all duration-200 hover:shadow-lg hover:bg-gray-50/50"
                                >
                                    <div className="p-6">
                                        {/* 작성자 정보 - 한 줄로 정리 */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                                {post.profileImageUrl ? (
                                                    <img
                                                        src={post.profileImageUrl}
                                                        alt={`${post.nickname}의 프로필 이미지`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-6 w-6 text-gray-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                        />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{post.nickname}</p>
                                                <p className="text-sm text-gray-500">{formatRelativeTime(post.creationTime)}</p>
                                            </div>
                                        </div>

                                        <Link href={`/post/${post.id}`} className="block no-underline">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-3 hover:text-[#9C50D4] transition-colors line-clamp-2">
                                                {post.title}
                                                {post.hasImage && (
                                                    <span className="material-icons text-base text-[#980ffa] ml-2 align-middle">image</span>
                                                )}
                                            </h3>
                                        </Link>

                                        <div className="flex flex-wrap gap-2 mb-4 min-h-[28px]">
                                            {post.tags?.length > 0 ? (
                                                post.tags.map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="text-sm text-[#9C50D4] bg-purple-50 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors cursor-pointer"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="invisible inline-block px-2 py-1 text-xs">#태그자리</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-6 text-gray-500">
                                            <div 
                                                onClick={(e) => handleLikeClick(post, e)}
                                                className={`flex items-center gap-2 group/like transition-all cursor-pointer ${
                                                    post.isLiked ? 'text-[#9C50D4]' : 'text-gray-500 hover:text-[#9C50D4]'
                                                }`}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className={`h-5 w-5 group-hover/like:scale-110 transition-transform ${
                                                        likingPosts.has(post.id) ? 'animate-pulse' : ''
                                                    }`}
                                                    fill={post.isLiked ? 'currentColor' : 'none'}
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                    />
                                                </svg>
                                                <span className="text-sm">{post.likeCount}</span>
                                            </div>
                                            <div className="flex items-center gap-2 group/comment hover:text-[#9C50D4] transition-all">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 group-hover/comment:scale-110 transition-transform"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M8 12h.01M12 12h.01M16 12h.01M12 21a9 9 0 1 0-9-9c0 1.488.36 2.89 1 4.127L3 21l4.873-1C9.11 20.64 10.512 21 12 21z"
                                                    />
                                                </svg>
                                                <span className="text-sm group-hover/comment:text-[#9C50D4]">{post.commentCount}</span>
                                            </div>
                                            <div className="flex items-center gap-2 ml-auto">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                    />
                                                </svg>
                                                <span className="text-sm">{post.viewCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <p className="text-gray-500">아직 게시글이 없습니다.</p>
                                <p className="text-gray-500 mt-2">새 글을 작성해보세요!</p>
                            </div>
                        )}

                        {/* 더 보기 버튼 */}
                        {posts.length > 0 && (
                            <div className="text-center mt-4 mb-8">
                                <Link
                                    href="/post"
                                    className="inline-block px-6 py-2 bg-[#9C50D4] text-white rounded-md hover:bg-purple-500 transition-colors"
                                >
                                    더 많은 글 보기
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* 오른쪽 사이드바 - 개인정보 및 캘린더 */}
                    <aside className="w-full md:w-80 shrink-0">
                        {/* 개인정보 섹션 */}
                        {loading ? (
                            <ProfileSkeleton />
                        ) : (
                            <div className="bg-white rounded-lg shadow-lg p-6 mb-6 mt-8">
                                {/* 프로필 섹션 */}
                                <div className="flex flex-col items-center pb-6 border-b border-gray-100">
                                    <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center mb-4 ring-4 ring-purple-100">
                                        {userInfo?.profileImageUrl ? (
                                            <img
                                                src={userInfo.profileImageUrl}
                                                alt="프로필 이미지"
                                                className="h-full w-full object-cover rounded-full"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.src = 'https://via.placeholder.com/96?text=사용자'
                                                }}
                                            />
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-12 w-12 text-[#9C50D4]"
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
                                        )}
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                        {userInfo?.nickName || '사용자'}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-sm text-gray-500">
                                            @{userInfo?.userName || '사용자 이름'}
                                        </span>
                                        <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                        <span className="text-sm text-[#9C50D4]">일반회원</span>
                                    </div>
                                    <Link
                                        href="/myinfo/update"
                                        className="text-sm px-4 py-2 bg-purple-50 text-[#9C50D4] rounded-full hover:bg-purple-100 transition-colors flex items-center gap-2"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                            />
                                        </svg>
                                        프로필 수정
                                    </Link>
                                </div>

                                {/* 활동 통계 */}
                                <div className="py-4 grid grid-cols-3 gap-4">
                                    <Link href="/my-posts" className="text-center group">
                                        <div className="font-semibold text-gray-900 group-hover:text-[#9C50D4] transition-colors">
                                            게시글
                                        </div>
                                        <div className="text-2xl font-bold text-[#9C50D4] group-hover:scale-110 transition-transform">
                                            {userInfo?.postCount || 0}
                                        </div>
                                    </Link>
                                    <Link href="/my-comments" className="text-center group">
                                        <div className="font-semibold text-gray-900 group-hover:text-[#9C50D4] transition-colors">
                                            댓글
                                        </div>
                                        <div className="text-2xl font-bold text-[#9C50D4] group-hover:scale-110 transition-transform">
                                            {userInfo?.commentCount || 0}
                                        </div>
                                    </Link>
                                    <Link href="/my-likes" className="text-center group">
                                        <div className="font-semibold text-gray-900 group-hover:text-[#9C50D4] transition-colors">
                                            좋아요
                                        </div>
                                        <div className="text-2xl font-bold text-[#9C50D4] group-hover:scale-110 transition-transform">
                                            {userInfo?.likeCount || 0}
                                        </div>
                                    </Link>
                                </div>

                                {/* 빠른 링크 */}
                                <div className="pt-4 border-t border-gray-100">
                                    <Link
                                        href="/calendar"
                                        className="flex items-center justify-between p-3 hover:bg-purple-50 rounded-lg group transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 text-[#9C50D4]"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                            </div>
                                            <span className="font-medium text-gray-700 group-hover:text-[#9C50D4]">
                                                내 일정
                                            </span>
                                        </div>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-[#9C50D4]" />
                                    </Link>
                                    <Link
                                        href="/myinfo"
                                        className="flex items-center justify-between p-3 hover:bg-purple-50 rounded-lg group transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 text-[#9C50D4]"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                    />
                                                </svg>
                                            </div>
                                            <span className="font-medium text-gray-700 group-hover:text-[#9C50D4]">
                                                내 정보 관리
                                            </span>
                                        </div>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-[#9C50D4]" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* 캘린더 섹션 */}
                        <div className="bg-white rounded-lg shadow p-4 mb-6">
                            <h2 className="text-lg font-semibold mb-4 text-gray-800">캘린더</h2>
                            <div className="mini-calendar">
                                <div className="mini-calendar-container">
                                    <FullCalendar
                                        plugins={[dayGridPlugin]}
                                        initialView="dayGridMonth"
                                        headerToolbar={{
                                            left: '',
                                            center: 'title',
                                            right: 'prev,next',
                                        }}
                                        contentHeight={300}
                                        fixedWeekCount={false}
                                        dayHeaderContent={(args) => {
                                            const days = ['일', '월', '화', '수', '목', '금', '토']
                                            return days[args.date.getDay()]
                                        }}
                                        events={[]}
                                        displayEventEnd={false}
                                    />
                                </div>
                            </div>

                            {/* 오늘의 일정 섹션 */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-4 text-gray-800">오늘의 일정</h3>
                                <div className="space-y-3">
                                    {events
                                        .filter((event) => {
                                            const today = new Date()
                                            const eventDate = new Date(event.start)
                                            return (
                                                eventDate.getDate() === today.getDate() &&
                                                eventDate.getMonth() === today.getMonth() &&
                                                eventDate.getFullYear() === today.getFullYear()
                                            )
                                        })
                                        .map((event) => (
                                            <div
                                                key={event.id}
                                                className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <div
                                                    className="w-2 h-2 mt-2 rounded-full shrink-0"
                                                    style={{ backgroundColor: event.color || '#9C50D4' }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 truncate">
                                                        {event.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(event.start).toLocaleTimeString('ko-KR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                        {event.end &&
                                                            ` - ${new Date(event.end).toLocaleTimeString('ko-KR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}`}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    {events.filter((event) => {
                                        const today = new Date()
                                        const eventDate = new Date(event.start)
                                        return (
                                            eventDate.getDate() === today.getDate() &&
                                            eventDate.getMonth() === today.getMonth() &&
                                            eventDate.getFullYear() === today.getFullYear()
                                        )
                                    }).length === 0 && (
                                            <div className="text-center py-4 text-gray-500">
                                                오늘 예정된 일정이 없습니다
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    )
}