'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 전역 로그인 상태 관리 훅 import 추가
import { useGlobalLoginMember } from '@/stores/auth/loginMember'

// API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8090'

// 게시물 타입 정의
interface Post {
    id: number
    title: string
    content: string
    createdAt: string
    nickname: string
    likeCount: number
    commentCount: number
    viewCount: number
}

// API 응답 타입 정의
interface PostResponseDto {
    id: number
    title: string
    content: string
    nickname: string
    likeCount: number
    commentCount: number
    viewCount: number
    userId: number
    creationTime: string
    modificationTime: string
    status: string
}

export default function MyPostsPage() {
    const router = useRouter()
    // 전역 로그인 상태 추가
    const { isLogin } = useGlobalLoginMember()
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // 날짜 포맷팅 함수
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')

        return `${year}-${month}-${day} ${hours}:${minutes}`
    }

    // 게시물 데이터 가져오기
    const fetchPosts = async () => {
        setIsLoading(true)
        setError(null)

        try {
            // boards/my 엔드포인트는 현재 로그인한 사용자의 ID와 게시물의 user_id를 비교해서 조회함
            const response = await fetch(`${API_BASE_URL}/api/v1/boards/my?sort=creationTime,desc`, {
                // 쿠키 기반 인증을 위해 credentials: 'include' 추가
                credentials: 'include',
            })

            if (response.status === 401 || response.status === 403) {
                // 인증 실패 또는 권한 없음 시 로그인 페이지로 리다이렉트
                console.error('인증이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.')
                router.push('/login?redirect=my-posts')
                return
            }

            if (!response.ok) {
                console.error('API 응답 오류:', response.status, response.statusText)
                throw new Error('게시물 목록을 불러오는데 실패했습니다.')
            }

            // 응답 텍스트 확인 (디버깅용)
            const responseText = await response.text()
            console.log('API 응답:', responseText)

            // 빈 응답 체크
            if (!responseText || responseText.trim() === '') {
                console.warn('API가 빈 응답을 반환했습니다.')
                setPosts([])
                return
            }

            // JSON 파싱
            const data = JSON.parse(responseText)
            const content = Array.isArray(data) ? data : data.content || []

            // API 응답 데이터를 컴포넌트에서 사용하는 형식으로 변환
            const mappedPosts = content.map((item: PostResponseDto) => {
                console.log('서버로부터 받은 게시물 데이터:', item)
                return {
                    id: item.id,
                    title: item.title || '(제목 없음)',
                    content: item.content || '',
                    createdAt: item.creationTime,
                    nickname: item.nickname || '익명',
                    likeCount: item.likeCount || 0,
                    commentCount: item.commentCount || 0,
                    viewCount: item.viewCount || 0,
                }
            })

            setPosts(mappedPosts)
        } catch (err) {
            console.error('게시물 목록 조회 오류:', err)

            // 네트워크 오류나 기타 예외 상황인 경우
            if (err instanceof Error) {
                setError(err.message || '게시물 목록을 불러오는데 실패했습니다.')
            } else {
                setError('알 수 없는 오류가 발생했습니다.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    // 초기 데이터 로드 및 로그인 상태 확인
    useEffect(() => {
        // 로그인 상태 확인 (전역 상태 사용)
        if (!isLogin) {
            console.log('로그인이 필요합니다.')
            router.push('/login?redirect=my-posts')
            return
        }

        fetchPosts()
    }, [router, isLogin])

    // 게시글로 이동
    const handleGoToPost = (postId: number | null) => {
        console.log('이동 시도 중인 게시글 ID:', postId)

        // postId가 없는 경우 예외 처리
        if (!postId) {
            console.error('게시글 ID가 없습니다.')
            alert('게시글 정보를 찾을 수 없습니다.')
            return
        }

        try {
            // 동적 라우팅을 사용하여 post/[id] 페이지로 이동
            router.push(`/post/${postId}`)
        } catch (error) {
            console.error('게시글 이동 중 오류 발생:', error)
            alert('게시글로 이동할 수 없습니다. 다시 시도해주세요.')
        }
    }

    // 게시물 내용 요약 함수
    const summarizeContent = (content: string, maxLength: number = 100) => {
        if (!content) return ''
        if (content.length <= maxLength) return content
        return content.substring(0, maxLength) + '...'
    }

    return (
        <div className="px-4 py-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-800 mb-8">내가 작성한 게시글</h1>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C4FF2]"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-100 p-4 rounded-lg text-red-600 dark:text-red-700">
                        <p>{error}</p>
                        <p className="mt-2 text-sm">개발자 도구 콘솔(F12)에서 자세한 오류 정보를 확인할 수 있습니다.</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-100 rounded-2xl p-10 shadow-md text-center">
                        <p className="text-xl text-gray-600 dark:text-gray-700">작성한 게시글이 없습니다 🥲</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {posts.map((post) => (
                            <div key={post.id} className="bg-white dark:bg-slate-100 rounded-2xl p-6 shadow-md">
                                <div
                                    className="cursor-pointer hover:underline text-lg font-semibold text-gray-800 dark:text-gray-800 mb-3"
                                    onClick={() => {
                                        console.log('게시글 제목 클릭:', post.id)
                                        handleGoToPost(post.id)
                                    }}
                                >
                                    <span className="text-[#8C4FF2]">📝</span> {post.title}
                                </div>
                                <div className="flex items-center mb-2 text-sm text-gray-500">
                                    <span className="mr-3">작성자: {post.nickname}</span>
                                    <span className="mr-3">👁️ {post.viewCount}</span>
                                    <span className="mr-3">❤️ {post.likeCount}</span>
                                    <span>💬 {post.commentCount}</span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-700 mb-4 whitespace-pre-line">
                                    {summarizeContent(post.content)}
                                </p>
                                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-600">
                                    <span>🕒 {formatDate(post.createdAt)}</span>
                                    <button
                                        onClick={() => {
                                            console.log('게시글 보기 버튼 클릭:', post.id)
                                            handleGoToPost(post.id)
                                        }}
                                        className="text-[#8C4FF2] hover:underline"
                                    >
                                        🔗 게시글 상세보기
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
