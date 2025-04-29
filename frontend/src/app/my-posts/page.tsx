'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { fetchApi } from '@/utils/api'

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
interface PageResponse<T> {
    content: T[]
    totalPages: number
    totalElements: number
    size: number
    number: number
}

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
        if (!dateString) return ''
        
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        
        // 24시간 이내면 "X시간 전" 형식으로 표시
        if (diff < 24 * 60 * 60 * 1000) {
            const hours = Math.floor(diff / (60 * 60 * 1000))
            return hours > 0 ? `${hours}시간 전` : '방금 전'
        }
        
        // 그 외에는 "YYYY.MM.DD" 형식으로 표시
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
    }

    // 게시물 데이터 가져오기
    const fetchPosts = async (page = currentPage) => {
        setIsLoading(true)
        setError(null)

        if (!isLogin) {
            setError('로그인이 필요합니다.')
            setIsLoading(false)
            return
        }

        try {
            const url = `/api/v1/posts/my?page=${page}&size=10&sort=creationTime,desc`
            const response = await fetchApi(url, {
                method: 'GET',
            })

            if (response.ok) {
                const data = await response.json()
                
                setTotalPages(data.totalPages || 0)
                setTotalElements(data.totalElements || 0)
                setCurrentPage(data.number || 0)
                
                const formattedPosts: Post[] = data.content.map((post: PostResponseDto) => ({
                    id: post.id,
                    title: post.title || '(제목 없음)',
                    content: post.content || '',
                    createdAt: post.creationTime,
                    nickname: post.nickname || '익명',
                    likeCount: post.likeCount || 0,
                    commentCount: post.commentCount || 0,
                    viewCount: post.viewCount || 0
                }))
                
                setPosts(formattedPosts)
            } else {
                // 에러 처리
                if (response.status === 401) {
                    setError('로그인이 필요합니다.')
                } else {
                    const errorData = await response.json()
                    setError(errorData.message || '게시글을 불러오는 중 오류가 발생했습니다.')
                }
            }
        } catch (err) {
            console.error('게시글 로딩 에러:', err)
            setError('게시글을 불러오는 중 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    // 페이지 변경 핸들러
    const handlePageChange = (newPage: number) => {
        if (newPage !== currentPage && newPage >= 0 && newPage < totalPages) {
            fetchPosts(newPage)
        }
    }

    // 초기 데이터 로드 및 로그인 상태 확인
    useEffect(() => {
        if (isLogin) {
            fetchPosts(0) // 첫 페이지부터 로드
        } else {
            setError('로그인이 필요합니다.')
            setIsLoading(false)
        }
    }, [isLogin])

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
        <div className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="max-w-4xl mx-auto">
                {/* 헤더 섹션 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">내가 작성한 게시글</h1>
                    <p className="text-gray-600">
                        작성하신 게시글 목록입니다. 총 <span className="font-semibold">{totalElements}개</span>의 게시글이 있습니다.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C4FF2]"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-600">{error}</p>
                        </div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white rounded-xl p-10 shadow-md text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0h4" />
                        </svg>
                        <p className="text-xl text-gray-600 mb-2">작성한 게시글이 없습니다</p>
                        <p className="text-gray-500 mb-6">새로운 게시글을 작성해보세요!</p>
                        <button 
                            onClick={() => router.push('/post/create')} 
                            className="px-6 py-2 bg-[#9C50D4] text-white rounded-lg hover:bg-[#8440B5] transition-colors"
                        >
                            새 게시글 작성하기
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            {posts.map((post) => (
                                <div key={post.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                                    <div
                                        className="cursor-pointer text-xl font-semibold text-gray-800 mb-3 hover:text-[#9C50D4] transition-colors"
                                        onClick={() => handleGoToPost(post.id)}
                                    >
                                        {post.title}
                                    </div>
                                    
                                    <p className="text-gray-600 mb-4 line-clamp-2">{summarizeContent(post.content)}</p>
                                    
                                    <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>{formatDate(post.createdAt)}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                                <span>{post.likeCount}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M12 21a9 9 0 1 0-9-9c0 1.488.36 2.89 1 4.127L3 21l4.873-1C9.11 20.64 10.512 21 12 21z" />
                                                </svg>
                                                <span>{post.commentCount}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                <span>{post.viewCount}</span>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleGoToPost(post.id)} 
                                            className="ml-auto bg-[#F7F3FD] text-[#9C50D4] px-4 py-1.5 rounded-full hover:bg-[#EFE6FC] transition-colors flex items-center"
                                        >
                                            자세히 보기
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
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
                                    className={`px-4 py-2 rounded-lg ${
                                        currentPage === 0
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#F7F3FD] text-[#9C50D4] hover:bg-[#EFE6FC]'
                                    } transition-colors font-medium`}
                                >
                                    처음
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 0}
                                    className={`px-4 py-2 rounded-lg ${
                                        currentPage === 0
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#F7F3FD] text-[#9C50D4] hover:bg-[#EFE6FC]'
                                    } transition-colors font-medium`}
                                >
                                    이전
                                </button>

                                <div className="flex space-x-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        // 페이지 범위 계산
                                        const startPage = Math.max(0, Math.min(totalPages - 5, currentPage - 2));
                                        const pageNum = startPage + i;
                                        
                                        return pageNum < totalPages ? (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`w-10 h-10 rounded-lg ${
                                                    currentPage === pageNum
                                                        ? 'bg-[#9C50D4] text-white font-bold'
                                                        : 'bg-[#F7F3FD] text-[#9C50D4] hover:bg-[#EFE6FC]'
                                                } transition-colors`}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        ) : null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages - 1}
                                    className={`px-4 py-2 rounded-lg ${
                                        currentPage === totalPages - 1
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#F7F3FD] text-[#9C50D4] hover:bg-[#EFE6FC]'
                                    } transition-colors font-medium`}
                                >
                                    다음
                                </button>
                                <button
                                    onClick={() => handlePageChange(totalPages - 1)}
                                    disabled={currentPage === totalPages - 1}
                                    className={`px-4 py-2 rounded-lg ${
                                        currentPage === totalPages - 1
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#F7F3FD] text-[#9C50D4] hover:bg-[#EFE6FC]'
                                    } transition-colors font-medium`}
                                >
                                    마지막
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
