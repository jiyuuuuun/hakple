'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ReportedComment {
  reportId: number;
  commentId: number;
  commentContent: string;
  reportedUserId: number;
  boardId: number;
  userReportedCount: number;
  commentReportedCount: number;
  reportedAt: string;
}

type SearchType = 'commentId' | 'commentContent' | 'reportedUserId';
type SortBy = 'reportedAt.desc' | 'commentReportedCount.desc' | 'commentReportedCount.asc' | 'reportedAt.asc';

export default function ReportedCommentsPage() {
  const router = useRouter();
  const [comments, setComments] = useState<ReportedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [token, setToken] = useState<string | null>(null);
  
  // 검색 및 정렬 관련 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('commentContent');
  const [sortBy, setSortBy] = useState<SortBy>('reportedAt.desc');
  const [originalComments, setOriginalComments] = useState<ReportedComment[]>([]);
  
  // 삭제 확인 모달 관련 상태 추가
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  
  const PAGE_SIZE = 10;

  useEffect(() => {
    checkAdmin();
  }, [router]);

  const checkAdmin = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/check`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        router.push('/');
        return;
      }

      // 응답 데이터 처리
      const isAdminResult = await response.json();
      
      // boolean 값을 확인하여 관리자 권한 설정
      if (isAdminResult === true) {
        setIsAdmin(true);
        fetchComments(0);
      } else {
        // 관리자가 아니면 홈으로 이동
        router.push('/');
      }
    } catch (error) {
      console.error('관리자 권한 확인 중 오류 발생:', error);
      router.push('/');
    }
  };

  const fetchComments = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/report/comments?page=${page}&size=${PAGE_SIZE}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다');
      }

      const data = await response.json();
      const fetchedComments = data.content || [];
      setComments(fetchedComments);
      setOriginalComments(fetchedComments); // 원본 데이터 저장
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error('댓글 데이터 로드 중 오류 발생:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 0 || page >= totalPages) return;
    fetchComments(page);
  };

  const handleDeleteComment = async (commentId: number) => {
    if (processingIds.includes(commentId) || !token) return;
    
    setProcessingIds(prev => [...prev, commentId]);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/comments/${commentId}/pending`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        }
      );

      if (!response.ok) {
        throw new Error('댓글 삭제 처리 중 오류가 발생했습니다');
      }

      // 성공 후 목록에서 해당 댓글 제거
      setComments(prev => prev.filter(comment => comment.commentId !== commentId));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('댓글 삭제 처리 중 오류:', error);
      alert('댓글 삭제 처리에 실패했습니다.');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== commentId));
    }
  };

  // 검색 기능
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setComments(originalComments);
      return;
    }

    const filtered = originalComments.filter(comment => {
      if (searchType === 'commentId') {
        return comment.commentId.toString().includes(searchTerm);
      } else if (searchType === 'commentContent') {
        return comment.commentContent.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (searchType === 'reportedUserId') {
        return comment.reportedUserId.toString().includes(searchTerm);
      }
      return false;
    });

    setComments(filtered);
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    
    // 검색어가 비어있으면 원본 데이터로 복원
    if (!e.target.value.trim()) {
      setComments(originalComments);
    }
  };

  // 정렬 기능
  const handleSort = (value: SortBy) => {
    setSortBy(value);
    
    const sortedComments = [...comments];
    
    if (value === 'reportedAt.desc') {
      sortedComments.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
    } else if (value === 'commentReportedCount.desc') {
      sortedComments.sort((a, b) => b.commentReportedCount - a.commentReportedCount);
    } else if (value === 'commentReportedCount.asc') {
      sortedComments.sort((a, b) => a.commentReportedCount - b.commentReportedCount);
    } else if (value === 'reportedAt.asc') {
      sortedComments.sort((a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime());
    }
    
    setComments(sortedComments);
  };

  // 삭제 확인 모달 표시 함수
  const confirmDelete = (commentId: number) => {
    setCommentToDelete(commentId);
    setShowDeleteModal(true);
  };
  
  // 삭제 취소 함수
  const cancelDelete = () => {
    setCommentToDelete(null);
    setShowDeleteModal(false);
  };

  if (loading && !comments.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C4FF2]"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const displayPage = currentPage + 1;
  const displayTotalPages = totalPages;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">신고된 댓글 관리</h1>
        <Link href="/admin" className="text-[#8C4FF2] hover:underline">
          관리자 홈으로
        </Link>
      </div>

      {/* 검색 및 정렬 컨트롤 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-3/5 flex">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as SearchType)}
              className="px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2]/20 min-w-[160px]"
            >
              <option value="commentId">댓글 ID</option>
              <option value="commentContent">댓글 내용</option>
              <option value="reportedUserId">작성자 ID</option>
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="w-full px-4 py-2 border-y border-r border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8C4FF2]/20"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="w-full md:w-1/5">
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value as SortBy)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2]/20 min-w-[180px]"
            >
              <option value="reportedAt.desc">신고일시 최근순</option>
              <option value="commentReportedCount.desc">신고횟수 많은 순</option>
              <option value="commentReportedCount.asc">신고횟수 적은 순</option>
              <option value="reportedAt.asc">신고일시 오래된 순</option>
            </select>
          </div>
          
          <div className="w-full md:w-1/5">
            <button
              onClick={handleSearch}
              className="w-full px-6 py-2 bg-[#8C4FF2] text-white rounded-lg font-medium hover:bg-[#7340C2]"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8C4FF2]"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신고 ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">댓글 ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">댓글 내용</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자 ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유저 신고 횟수</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">댓글 신고 횟수</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신고 일시</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comments.map((comment) => (
                <tr key={comment.reportId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap">{comment.reportId}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{comment.commentId}</td>
                  <td className="py-3 px-4 max-w-xs truncate">
                    <Link 
                      href={`/post/${comment.boardId}`} 
                      className="text-[#8C4FF2] hover:underline"
                    >
                      {comment.commentContent}
                    </Link>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Link 
                      href={`/admin/users/${comment.reportedUserId}`} 
                      className="text-[#8C4FF2] hover:underline"
                    >
                      {comment.reportedUserId}
                    </Link>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{comment.userReportedCount}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{comment.commentReportedCount}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {new Date(comment.reportedAt).toLocaleString('ko-KR')}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      onClick={() => confirmDelete(comment.commentId)}
                      disabled={processingIds.includes(comment.commentId)}
                      className={`px-3 py-1 rounded text-white ${
                        processingIds.includes(comment.commentId)
                          ? 'bg-gray-400'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      {processingIds.includes(comment.commentId) ? '처리 중...' : '삭제'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">신고된 댓글이 없습니다.</p>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">댓글 삭제 확인</h3>
            <p className="mb-6 text-gray-600">정말로 이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                취소
              </button>
              <button
                onClick={() => commentToDelete && handleDeleteComment(commentToDelete)}
                className="px-4 py-2 bg-[#8C4FF2] text-white rounded-lg hover:bg-[#7340C2]"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav>
            <ul className="flex">
              <li>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className={`mx-1 px-3 py-1 rounded ${
                    currentPage === 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  이전
                </button>
              </li>
              {Array.from({ length: displayTotalPages }, (_, i) => i).map((page) => (
                <li key={page}>
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`mx-1 px-3 py-1 rounded ${
                      currentPage === page ? 'bg-[#8C4FF2] text-white' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {page + 1}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className={`mx-1 px-3 py-1 rounded ${
                    currentPage === totalPages - 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  다음
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
} 