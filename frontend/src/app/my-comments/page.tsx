'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8090';

// 댓글 타입 정의
interface Comment {
  id: number;
  content: string;
  createdAt: string;
  postTitle: string;
  postUrl: string;
  postId: number | null; // null 허용
}

// API 응답 타입 정의
interface CommentResponseDto {
  id: number;
  content: string;
  creationTime: string; // API 응답 필드명에 맞게 수정
  postId: number;
  postTitle: string;
  postUrl: string;
}

// 페이지네이션 응답 타입
interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  empty: boolean;
}

export default function MyCommentsPage() {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  
  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };
  
  // 댓글 데이터 가져오기
  const fetchComments = async (pageNum: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // pageable 파라미터 적용 (size=10, sort=creationTime, direction=DESC)
      const response = await fetch(`${API_BASE_URL}/api/v1/comments/my?page=${pageNum - 1}&size=10&sort=creationTime,desc`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, // JWT 토큰 헤더에 추가
        },
      });
      
      if (response.status === 401) {
        // 인증 실패 시 로그인 페이지로 리다이렉트
        router.push('/login');
        return;
      }
      
      if (!response.ok) {
        throw new Error('댓글 목록을 불러오는데 실패했습니다.');
      }
      
      const data: PageResponse<CommentResponseDto> = await response.json();
      
      // 페이지네이션 정보 설정
      setTotalPages(data.totalPages);
      setHasMore(!data.last);
      
      // API 응답 데이터를 컴포넌트에서 사용하는 형식으로 변환
      const mappedComments = data.content.map(item => {
        console.log('서버로부터 받은 댓글 데이터:', item);
        return {
          id: item.id,
          content: item.content,
          createdAt: item.creationTime, // 필드명 매핑
          postTitle: item.postTitle,
          postUrl: item.postUrl,
          postId: item.postId || null // null로 기본값 설정
        };
      });
      
      // 첫 페이지면 데이터 교체, 아니면 기존 데이터에 추가
      if (pageNum === 1) {
        setComments(mappedComments);
      } else {
        setComments(prev => [...prev, ...mappedComments]);
      }
    } catch (err) {
      console.error('댓글 목록 조회 오류:', err);
      setError('댓글 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 초기 데이터 로드
  useEffect(() => {
    fetchComments(1);
  }, []);
  
  // 더 보기 클릭 시
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchComments(nextPage);
    }
  };
  
  // 게시글로 이동
  const handleGoToPost = (postId: number | undefined) => {
    console.log('이동 시도 중인 게시글 ID:', postId);
    
    // postId가 없거나 undefined인 경우 예외 처리
    if (!postId) {
      console.error('게시글 ID가 없습니다.');
      alert('게시글 정보를 찾을 수 없습니다.');
      return;
    }
    
    try {
      // 동적 라우팅을 사용하여 post/[id] 페이지로 이동
      router.push(`/post/${postId}`);
    } catch (error) {
      console.error('게시글 이동 중 오류 발생:', error);
      alert('게시글로 이동할 수 없습니다. 다시 시도해주세요.');
    }
  };
  
  return (
    <div className="px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-800 mb-8">내가 작성한 댓글</h1>
        
        {isLoading && page === 1 ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C4FF2]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-100 p-4 rounded-lg text-red-600 dark:text-red-700">
            {error}
          </div>
        ) : comments.length === 0 ? (
          <div className="bg-white dark:bg-slate-100 rounded-2xl p-10 shadow-md text-center">
            <p className="text-xl text-gray-600 dark:text-gray-700">작성한 댓글이 없습니다 🥲</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white dark:bg-slate-100 rounded-2xl p-6 shadow-md">
                <div 
                  className="cursor-pointer hover:underline text-lg font-semibold text-gray-800 dark:text-gray-800 mb-3"
                  onClick={() => {
                    console.log('게시글 제목 클릭:', comment.postId);
                    comment.postId ? handleGoToPost(comment.postId) : null;
                  }}
                >
                  <span className="text-[#8C4FF2]">📄</span> {comment.postTitle}
                </div>
                <p className="text-gray-700 dark:text-gray-700 mb-4 whitespace-pre-line">{comment.content}</p>
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-600">
                  <span>🕒 {formatDate(comment.createdAt)}</span>
                  <button 
                    onClick={() => {
                      console.log('원본 글 보기 버튼 클릭:', comment.postId);
                      comment.postId ? handleGoToPost(comment.postId) : null;
                    }}
                    className="text-[#8C4FF2] hover:underline"
                  >
                    🔗 원본 글 보기
                  </button>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-lg ${
                    isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#8C4FF2] hover:bg-[#7340C2]'
                  } text-white transition-colors font-medium`}
                >
                  {isLoading ? '로딩 중...' : '더 보기'}
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* 페이지네이션 */}
        {comments.length > 0 && totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setPage(i + 1);
                  fetchComments(i + 1);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  page === i + 1
                    ? 'bg-[#8C4FF2] text-white'
                    : 'bg-white dark:bg-slate-100 text-gray-700 dark:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 