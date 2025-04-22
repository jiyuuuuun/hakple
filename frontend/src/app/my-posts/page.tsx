'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
    const { isLogin } = useGlobalLoginMember()
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const pageSize = 10

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
    const fetchPosts = async (page = currentPage) => {
        setIsLoading(true)
        setError(null)

        try {
            const url = `${API_BASE_URL}/api/v1/posts/my?page=${page}&size=${pageSize}&sort=creationTime,desc`

            // API 요청
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                credentials: 'include', // 쿠키를 포함하여 요청
            })

            if (response.status === 401 || response.status === 403) {
                router.push('/login?redirect=my-posts')
                return
            }

            if (!response.ok) {
                throw new Error(`게시물 목록을 불러오는데 실패했습니다. (${response.status})`)
            }

            // 응답 텍스트
            const responseText = await response.text()

            // 빈 응답 체크
            if (!responseText || responseText.trim() === '') {
                setPosts([])
                return
            }

            // JSON 파싱
            let data
            try {
                data = JSON.parse(responseText)
            } catch {
                throw new Error('API 응답을 파싱하는데 실패했습니다. 잘못된 형식의 데이터입니다.')
            }

            // 페이지네이션 정보 추출
            if (data && typeof data === 'object' && 'content' in data) {
                // Spring Data의 Page 객체 형식인 경우
                setTotalPages(data.totalPages || 0)
                setTotalElements(data.totalElements || 0)
                setCurrentPage(data.number || 0)
                const content = data.content || []

                // API 응답 데이터를 컴포넌트에서 사용하는 형식으로 변환
                const mappedPosts = content.map((item: PostResponseDto) => ({
                    id: item.id,
                    title: item.title || '(제목 없음)',
                    content: item.content || '',
                    createdAt: item.creationTime,
                    nickname: item.nickname || '익명',
                    likeCount: item.likeCount || 0,
                    commentCount: item.commentCount || 0,
                    viewCount: item.viewCount || 0,
                }))

                setPosts(mappedPosts)
            } else {
                // 배열로 직접 반환된 경우 (기존 로직 유지)
                const content = Array.isArray(data) ? data : []

                // API 응답 데이터를 컴포넌트에서 사용하는 형식으로 변환
                const mappedPosts = content.map((item: PostResponseDto) => ({
                    id: item.id,
                    title: item.title || '(제목 없음)',
                    content: item.content || '',
                    createdAt: item.creationTime,
                    nickname: item.nickname || '익명',
                    likeCount: item.likeCount || 0,
                    commentCount: item.commentCount || 0,
                    viewCount: item.viewCount || 0,
                }))

                setPosts(mappedPosts)
            }
        } catch (err) {
            console.error('게시물 목록 조회 오류:', err)

            if (err instanceof Error) {
                setError(err.message || '게시물 목록을 불러오는데 실패했습니다.')
            } else {
                setError('알 수 없는 오류가 발생했습니다.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    // 페이지 변경 핸들러
    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage)
            fetchPosts(newPage)
        }
    }

    // 초기 데이터 로드 및 로그인 상태 확인
    useEffect(() => {
        if (!isLogin) {
            router.push('/login?redirect=my-posts')
            return
        }

        fetchPosts(0) // 초기 로드 시 첫 페이지부터 시작
    }, [router, isLogin])

    // 게시글로 이동
    const handleGoToPost = (postId: number | null) => {
        if (!postId) {
            alert('게시글 정보를 찾을 수 없습니다.')
            return
        }

        try {
            router.push(`/post/${postId}`)
        } catch (error) {
            console.error('게시글 이동 중 오류 발생:', error)
            alert('게시글로 이동할 수 없습니다. 다시 시도해주세요.')
        }
    }

    // 게시물 내용 요약 함수
    const summarizeContent = (content: string, maxLength: number = 100) => {
        if (!content) return ''

        // HTML 태그 제거
        const textContent = content.replace(/<[^>]*>/g, '')

        if (textContent.length <= maxLength) return textContent
        return textContent.substring(0, maxLength) + '...'
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
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-100 rounded-2xl p-10 shadow-md text-center">
                        <p className="text-xl text-gray-600 dark:text-gray-700">작성한 게시글이 없습니다 🥲</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            {posts.map((post) => (
                                <div key={post.id} className="bg-white dark:bg-slate-100 rounded-2xl p-6 shadow-md">
                                    <div
                                        className="cursor-pointer hover:underline text-lg font-semibold text-gray-800 dark:text-gray-800 mb-3"
                                        onClick={() => handleGoToPost(post.id)}
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
                                            onClick={() => handleGoToPost(post.id)}
                                            className="text-[#8C4FF2] hover:underline"
                                        >
                                            🔗 게시글 상세보기
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 페이지네이션 컨트롤 */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-8 space-x-2">
                                <button
                                    onClick={() => handlePageChange(0)}
                                    disabled={currentPage === 0}
                                    className={`px-3 py-1 rounded ${
                                        currentPage === 0
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#8C4FF2] text-white hover:bg-[#7A43D6]'
                                    }`}
                                >
                                    처음
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 0}
                                    className={`px-3 py-1 rounded ${
                                        currentPage === 0
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#8C4FF2] text-white hover:bg-[#7A43D6]'
                                    }`}
                                >
                                    이전
                                </button>

                                <span className="px-3 py-1">
                                    {currentPage + 1} / {totalPages}
                                </span>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages - 1}
                                    className={`px-3 py-1 rounded ${
                                        currentPage === totalPages - 1
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#8C4FF2] text-white hover:bg-[#7A43D6]'
                                    }`}
                                >
                                    다음
                                </button>
                                <button
                                    onClick={() => handlePageChange(totalPages - 1)}
                                    disabled={currentPage === totalPages - 1}
                                    className={`px-3 py-1 rounded ${
                                        currentPage === totalPages - 1
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#8C4FF2] text-white hover:bg-[#7A43D6]'
                                    }`}
                                >
                                    마지막
                                </button>
                            </div>
                        )}

                        {totalElements > 0 && (
                            <div className="text-center mt-4 text-sm text-gray-500">총 {totalElements}개의 게시글</div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
