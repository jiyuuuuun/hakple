'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ReportedPost {
  reportId: number;
  boardId: number;
  boardTitle: string;
  reportedUserId: number;
  userReportedCount: number;
  boardReportedCount: number;
  reportedAt: string;
}

export default function ReportedPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<ReportedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [token, setToken] = useState<string | null>(null);
  
  // 검색 및 정렬 관련 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('boardTitle'); // 'boardId', 'boardTitle', 'reportedUserId'
  const [sortType, setSortType] = useState('reportedAt.desc'); // 'reportedAt.desc', 'boardReportedCount.desc', 'boardReportedCount.asc', 'reportedAt.asc'
  const [originalPosts, setOriginalPosts] = useState<ReportedPost[]>([]);
  
  // 삭제 확인 모달 관련 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  
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

      const isAdminResult = await response.json();
      
      if (isAdminResult === true) {
        setIsAdmin(true);
        fetchPosts(0);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('관리자 권한 확인 중 오류 발생:', error);
      router.push('/');
    }
  };

  const fetchPosts = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/report/boards?page=${page}&size=${PAGE_SIZE}`,
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
      const fetchedPosts = data.content || [];
      setPosts(fetchedPosts);
      setOriginalPosts(fetchedPosts); // 원본 데이터 저장
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error('게시글 데이터 로드 중 오류 발생:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 0 || page >= totalPages || !token) return;
    fetchPosts(page);
  };

  const handleDeletePost = async (boardId: number) => {
    if (processingIds.includes(boardId)) return;
    
    setProcessingIds(prev => [...prev, boardId]);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/boards/${boardId}/pending`,
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
        throw new Error('게시글 삭제 처리 중 오류가 발생했습니다');
      }

      // 성공 후 목록에서 해당 게시글 제거
      setPosts(prev => prev.filter(post => post.boardId !== boardId));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('게시글 삭제 처리 중 오류:', error);
      alert('게시글 삭제 처리에 실패했습니다.');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== boardId));
    }
  };

  // 검색 기능
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setPosts(originalPosts);
      return;
    }

    const filtered = originalPosts.filter(post => {
      if (searchType === 'boardId') {
        return post.boardId.toString().includes(searchTerm);
      } else if (searchType === 'boardTitle') {
        return post.boardTitle.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (searchType === 'reportedUserId') {
        return post.reportedUserId.toString().includes(searchTerm);
      }
      return false;
    });

    setPosts(filtered);
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    
    // 검색어가 비어있으면 원본 데이터로 복원
    if (!e.target.value.trim()) {
      setPosts(originalPosts);
    }
  };

  // 정렬 기능
  const handleSort = (value: string) => {
    setSortType(value);
    
    const sortedPosts = [...posts];
    
    if (value === 'reportedAt.desc') {
      sortedPosts.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
    } else if (value === 'boardReportedCount.desc') {
      sortedPosts.sort((a, b) => b.boardReportedCount - a.boardReportedCount);
    } else if (value === 'boardReportedCount.asc') {
      sortedPosts.sort((a, b) => a.boardReportedCount - b.boardReportedCount);
    } else if (value === 'reportedAt.asc') {
      sortedPosts.sort((a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime());
    }
    
    setPosts(sortedPosts);
  };

  // 삭제 확인 모달 표시 함수
  const confirmDelete = (boardId: number) => {
    setPostToDelete(boardId);
    setShowDeleteModal(true);
  };
  
  // 삭제 취소 함수
  const cancelDelete = () => {
    setPostToDelete(null);
    setShowDeleteModal(false);
  };

  if (loading && !posts.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        <h1 className="text-2xl font-bold">신고된 게시글 관리</h1>
        <Link href="/admin" className="text-[#8C4FF2] hover:underline">
          관리자 홈으로
        </Link>
      </div>

      {/* 검색 및 정렬 컨트롤 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-3/5 flex">
            <select
              id="searchType"
              className="px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2]/20 min-w-[160px]"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="boardId">게시글 ID</option>
              <option value="boardTitle">게시글 제목</option>
              <option value="reportedUserId">작성자 ID</option>
            </select>
            <input
              type="text"
              id="searchTerm"
              className="w-full px-4 py-2 border-y border-r border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2]/20"
              placeholder="검색어를 입력하세요"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="w-full md:w-1/5">
            <select
              id="sortType"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2]/20 min-w-[180px]"
              value={sortType}
              onChange={(e) => handleSort(e.target.value)}
            >
              <option value="reportedAt.desc">신고일시 최근순</option>
              <option value="boardReportedCount.desc">신고횟수 많은 순</option>
              <option value="boardReportedCount.asc">신고횟수 적은 순</option>
              <option value="reportedAt.asc">신고일시 오래된 순</option>
            </select>
          </div>
          
          <div className="w-full md:w-1/5">
            <button
              className="w-full px-6 py-2 bg-[#8C4FF2] text-white rounded-lg font-medium hover:bg-[#7340C2]"
              onClick={handleSearch}
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
      ) : posts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신고 ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">게시글 ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">게시글 제목</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자 ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유저 신고 횟수</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">게시글 신고 횟수</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신고 일시</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.reportId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap">{post.reportId}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{post.boardId}</td>
                  <td className="py-3 px-4 max-w-xs truncate">
                    <Link 
                      href={`/post/${post.boardId}`} 
                      className="text-[#8C4FF2] hover:underline cursor-pointer"
                    >
                      {post.boardTitle}
                    </Link>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {post.reportedUserId}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{post.userReportedCount}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{post.boardReportedCount}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {new Date(post.reportedAt).toLocaleString('ko-KR')}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      onClick={() => confirmDelete(post.boardId)}
                      disabled={processingIds.includes(post.boardId)}
                      className={`px-3 py-1 rounded text-white ${
                        processingIds.includes(post.boardId)
                          ? 'bg-gray-400'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      {processingIds.includes(post.boardId) ? '처리 중...' : '삭제'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">신고된 게시글이 없습니다.</p>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">게시글 삭제 확인</h3>
            <p className="mb-6 text-gray-600">정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                취소
              </button>
              <button
                onClick={() => postToDelete && handleDeletePost(postToDelete)}
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
      
      {/* 페이지 정보 표시 */}
      {posts.length > 0 && (
        <div className="text-sm text-gray-500 text-center mt-4">
          전체 {totalPages * PAGE_SIZE}개 항목 중 {(currentPage) * PAGE_SIZE + 1} - {Math.min((currentPage + 1) * PAGE_SIZE, totalPages * PAGE_SIZE)}개 표시
        </div>
      )}
    </div>
  );
} 