'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// Link는 사용하지 않으므로 import 제거

// 전역 로그인 상태 관리 훅 import 추가
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { fetchApi } from '@/utils/api'

// 댓글 타입 정의
interface Comment {
    id: number
    content: string
    createdAt: string
    boardId: number
    nickname: string
    likeCount: number
}

// API 응답 타입 정의
interface CommentResponseDto {
    id: number
    boardId: number
    content: string
    nickname: string
    likeCount: number
    userId: number
    creationTime: string
    modificationTime: string
    status: string
}

// 페이지네이션 응답 타입
interface PageResponse<T> {
    content: T[]
    pageable: {
        pageNumber: number
        pageSize: number
    }
    totalPages: number
    totalElements: number
    last: boolean
    size: number
    number: number
    empty: boolean
}

export default function MyCommentsPage() {
    const router = useRouter()
    // 전역 로그인 상태 추가
    const { isLogin } = useGlobalLoginMember()
    const [comments, setComments] = useState<Comment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
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

    // 댓글 데이터 가져오기
    const fetchComments = async (page = currentPage) => {
        setIsLoading(true)
        setError(null)

        try {
            // pageable 파라미터 적용 (size=10, sort=creationTime, direction=DESC)
            const response = await fetchApi(
                `/api/v1/comments/my?page=${page}&size=${pageSize}&sort=creationTime,desc`,
                {
                    method: 'GET',
                },
            )

            if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                router.push('/login?redirect=my-comments')
                return
            }
                throw new Error(`댓글 목록을 불러오는데 실패했습니다. (${response.status})`)
            }

            const data: PageResponse<CommentResponseDto> = await response.json()

            // 페이지네이션 정보 설정
            setTotalPages(data.totalPages || 0)
            setTotalElements(data.totalElements || 0)
            setCurrentPage(data.number || 0)

            // API 응답 데이터를 컴포넌트에서 사용하는 형식으로 변환
            const mappedComments = data.content.map((item) => ({
                id: item.id,
                content: item.content || '',
                createdAt: item.creationTime,
                boardId: item.boardId,
                nickname: item.nickname || '익명',
                likeCount: item.likeCount || 0,
            }))

                setComments(mappedComments)
        } catch (err) {
            console.error('댓글 목록 조회 오류:', err)

            // 네트워크 오류나 기타 예외 상황인 경우
            if (err instanceof Error) {
                setError(err.message || '댓글 목록을 불러오는데 실패했습니다.')
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
            fetchComments(newPage)
        }
    }

    // 초기 데이터 로드 및 로그인 상태 확인
    useEffect(() => {
        // 로그인 상태 확인 (전역 상태 사용)
        if (!isLogin) {
            router.push('/login?redirect=my-comments')
            return
        }

        fetchComments(0)
    }, [router, isLogin])

    // 게시글로 이동
    const handleGoToPost = (boardId: number | null) => {
        if (!boardId) {
            alert('게시글 정보를 찾을 수 없습니다.')
            return
        }

        try {
            router.push(`/post/${boardId}`)
        } catch (error) {
            console.error('게시글 이동 중 오류 발생:', error)
            alert('게시글로 이동할 수 없습니다. 다시 시도해주세요.')
        }
    }

    // HTML 태그 제거 함수
    const removeHtmlTags = (content: string) => {
        if (!content) return ''
        return content.replace(/<[^>]*>/g, '')
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="max-w-4xl mx-auto">
                {/* 헤더 섹션 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">내가 작성한 댓글</h1>
                    <p className="text-gray-600">
                        작성하신 댓글 목록입니다. 총 <span className="font-semibold">{totalElements}개</span>의 댓글이 있습니다.
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
                ) : comments.length === 0 ? (
                    <div className="bg-white rounded-xl p-10 shadow-md text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M12 21a9 9 0 1 0-9-9c0 1.488.36 2.89 1 4.127L3 21l4.873-1C9.11 20.64 10.512 21 12 21z" />
                        </svg>
                        <p className="text-xl text-gray-600 mb-2">작성한 댓글이 없습니다</p>
                        <p className="text-gray-500 mb-6">커뮤니티에 참여하여 의견을 나눠보세요!</p>
                        <button 
                            onClick={() => router.push('/')} 
                            className="px-6 py-2 bg-[#9C50D4] text-white rounded-lg hover:bg-[#8440B5] transition-colors"
                        >
                            커뮤니티로 이동하기
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {comments.map((comment) => (
                            <div key={comment.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                                <div className="flex items-center mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#9C50D4] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                    <span className="text-gray-700 font-medium">게시글에 작성한 댓글</span>
                                </div>
                                
                                <div className="border-l-4 border-[#EFE6FC] pl-4 py-2 mb-4">
                                    <p className="text-gray-700 whitespace-pre-line">{removeHtmlTags(comment.content)}</p>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-between text-sm text-gray-500">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>{formatDate(comment.createdAt)}</span>
                                        </div>
                                        
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            <span>{comment.likeCount}</span>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => handleGoToPost(comment.boardId)}
                                        className="bg-[#F7F3FD] text-[#9C50D4] px-4 py-1.5 rounded-full hover:bg-[#EFE6FC] transition-colors flex items-center"
                                    >
                                        게시글 확인하기
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}

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
                    </div>
                )}
            </div>
        </div>
    );
}
