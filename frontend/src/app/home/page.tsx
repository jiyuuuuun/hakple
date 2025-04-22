'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
// API 유틸리티 추가
import { fetchApi } from '@/utils/api'
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import '@/app/calendar/calendar.css'; // ➕ 커스텀 스타일 적용할 파일

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

export default function HomePage() {
    const router = useRouter()
    const { isLogin } = useGlobalLoginMember()
    const [academyName, setAcademyName] = useState<string | null>(null)
    const [academyCode, setAcademyCode] = useState<string | null>(null)
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [events, setEvents] = useState<EventItem[]>([])

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
            // fetch 대신 fetchApi 유틸리티 함수 사용
            const response = await fetchApi('/api/v1/myInfos', {
                method: 'GET',
                credentials: 'include',
            })

            if (response.ok) {
                const data = await response.json()

                // 백엔드에서 받은 학원 정보 활용
                if (data.academyCode) {
                    // 백엔드에 학원 정보가 있으면 로컬 스토리지 업데이트
                    if (data.academyName) {
                        localStorage.setItem('academyName', data.academyName)
                        setAcademyName(data.academyName)
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

    // 최신 게시글 가져오기
    const fetchLatestPosts = async () => {
        setLoading(true)
        try {
            // API 요청 URL 구성 (size=5로 최신 5개 게시글만 가져옴)
            const url = `/api/v1/posts?page=1&size=5&sortType=creationTime,desc`

            // API 유틸리티 함수 사용
            const response = await fetchApi(url, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                credentials: 'include', // 쿠키 기반 인증
            })

            if (!response.ok) {
                setPosts([])
                return
            }

            const data = (await response.json()) as ApiResponse

            // 응답 데이터 처리
            if (data && Array.isArray(data.content)) {
                setPosts(
                    data.content.map((post: Post) => ({
                        ...post,
                        commentCount: post.commentCount || (post.boardComments ? post.boardComments.length : 0),
                        likeCount: post.likeCount || (post.boardLikes ? post.boardLikes.length : 0),
                    })),
                )
            } else {
                setPosts([])
            }
        } catch (error) {
            setPosts([])
        } finally {
            setLoading(false)
        }
    }

    // 일정 데이터 가져오기
    const fetchEvents = async () => {
        try {
            const res = await fetchApi('/api/v1/schedules', {
                credentials: 'include',
            })
            if (!res.ok) return

            const data = await res.json()
            const mappedEvents = data.map((item: any) => ({
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

    useEffect(() => {
        // 로그인 확인 및 리다이렉트
        if (!isLogin) {
            router.push('/login')
            return
        }

        // 학원 정보 검증
        verifyAcademyInfo()

        // 학원 정보 확인 및 업데이트
        checkAndUpdateAcademyInfo()

        // 게시글과 일정 데이터 가져오기
        fetchLatestPosts()
        fetchEvents()

        // 페이지가 포커스를 받을 때마다 학원 정보 다시 확인 (다른 페이지에서 등록 후 돌아온 경우)
        const handleFocus = () => {
            checkAndUpdateAcademyInfo()
        }

        window.addEventListener('focus', handleFocus)
        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            window.removeEventListener('focus', handleFocus)
        }
    }, [isLogin, router])

    // 날짜 형식 변환 함수
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

        if (diffMinutes < 60) {
            return `${diffMinutes}분 전`
        } else if (diffMinutes < 24 * 60) {
            return `${Math.floor(diffMinutes / 60)}시간 전`
        } else {
            return `${date.toLocaleDateString()}`
        }
    }

    // 로그인하지 않은 경우 로딩 화면 대신 로그인 페이지로 리다이렉트
    if (!isLogin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow">
                    <p className="text-lg mb-4">로그인이 필요한 페이지입니다.</p>
                    <Link
                        href="/login"
                        className="inline-block px-6 py-2 bg-[#9C50D4] text-white rounded-md hover:bg-purple-500 transition-colors"
                    >
                        로그인 페이지로 이동
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-[1600px] mx-auto px-1 sm:px-2 md:px-3 py-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* 왼쪽 사이드바 - 학원 목록 */}
                    <aside className="w-full md:w-64 shrink-0">
                        <div className="bg-white rounded-lg shadow p-4 mb-6 mt-8">
                            <h2 className="text-lg font-semibold mb-4 text-gray-800">현재 학원</h2>
                            <div className="space-y-2">
                                {academyName && academyCode ? (
                                    <div className="p-2 rounded-md flex items-center justify-between">
                                        <span className="text-gray-700 text-lg font-medium">{academyName}</span>
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
                            <div className="bg-white rounded-lg shadow p-10 text-center text-lg">
                                <div className="animate-pulse text-gray-500">게시글을 불러오는 중...</div>
                            </div>
                        ) : posts.length > 0 ? (
                            posts.map((post) => (
                                <div key={post.id} className="bg-white rounded-lg shadow overflow-hidden mb-8 transition-all duration-200 hover:shadow-lg hover:bg-gray-50">
                                    <div className="p-6">
                                        {/* 작성자 정보 */}
                                        <div className="flex justify-between items-center mb-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
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
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{post.nickname}</span>
                                                    <span className="text-gray-500 text-sm">•</span>
                                                    <span className="text-sm text-gray-500">{formatDate(post.creationTime)}</span>
                                                </div>
                                            </div>
                                            <button className="text-gray-400 hover:text-[#9C50D4] transition-colors">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-6 w-6"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                                                    />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* 게시글 제목 및 내용 */}
                                        <Link href={`/post/${post.id}`} className="no-underline group">
                                            <h3 className="text-lg font-semibold mb-2 group-hover:text-[#9C50D4] transition-colors">
                                                {post.title}
                                            </h3>
                                            <p className="mb-4 text-gray-700 line-clamp-3">
                                                {post.content.replace(/<[^>]*>?/gm, '')}
                                            </p>
                                        </Link>

                                        {/* 게시글 이미지 영역 (옵션) */}
                                        {post.content.includes('<img') && (
                                            <div className="bg-gray-100 rounded-md h-48 flex items-center justify-center mb-4 overflow-hidden">
                                                <img
                                                    src={post.content.match(/<img[^>]+src="([^">]+)"/)?.[1] || ''}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* 해시태그 */}
                                        {post.tags && post.tags.length > 0 && (
                                            <div className="flex gap-2 mb-4 flex-wrap">
                                                {post.tags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-sm text-[#9C50D4] bg-purple-50 px-2 py-1 rounded-full hover:bg-purple-100 transition-colors"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* 좋아요 및 댓글 수 */}
                                        <div className="flex items-center gap-6 text-gray-600">
                                            <div className="flex items-center gap-2 hover:text-[#9C50D4] transition-colors cursor-pointer">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-6 w-6"
                                                    fill="none"
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
                                                <span>{post.likeCount}</span>
                                            </div>
                                            <div className="flex items-center gap-2 hover:text-[#9C50D4] transition-colors cursor-pointer">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-6 w-6"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                    />
                                                </svg>
                                                <span>{post.commentCount}</span>
                                            </div>
                                            <div className="flex items-center gap-2 ml-auto">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-6 w-6"
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
                                                <span>{post.viewCount}</span>
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

                    {/* 오른쪽 사이드바 - 캘린더 */}
                    <aside className="w-full md:w-80 shrink-0">
                        <div className="bg-white rounded-lg shadow p-4 mb-6 mt-8 sticky top-20">
                            <h2 className="text-lg font-semibold mb-4 text-gray-800">캘린더</h2>
                            <div className="mini-calendar">
                                <FullCalendar
                                    plugins={[dayGridPlugin]}
                                    initialView="dayGridMonth"
                                    headerToolbar={{
                                        left: '',
                                        center: 'title',
                                        right: 'prev,next'
                                    }}
                                    contentHeight={300}
                                    fixedWeekCount={false}
                                    dayHeaderContent={(args) => {
                                        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                                        return days[args.date.getDay()];
                                    }}
                                    events={events}
                                    eventContent={() => ({ html: '•' })}
                                    eventDisplay="block"
                                    dayMaxEvents={3}
                                    moreLinkContent={(args) => `+${args.num}`}
                                />
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    )
}
