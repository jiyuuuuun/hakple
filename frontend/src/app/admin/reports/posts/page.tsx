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
  
  const PAGE_SIZE = 10;

  useEffect(() => {
    // 컴포넌트 마운트 시 토큰 가져오기
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.push('/login');
      return;
    }
    
    setToken(accessToken);
    checkAdmin(accessToken);
  }, [router]);

  const checkAdmin = async (accessToken: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/check`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
      });

      if (!response.ok) {
        router.push('/');
        return;
      }

      const isAdminResult = await response.json();
      
      if (isAdminResult === true) {
        setIsAdmin(true);
        fetchPosts(0, accessToken);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('관리자 권한 확인 중 오류 발생:', error);
      router.push('/');
    }
  };

  const fetchPosts = async (page: number, accessToken: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/report/boards?page=${page}&size=${PAGE_SIZE}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
        }
      );

      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다');
      }

      const data = await response.json();
      setPosts(data.content || []);
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
    fetchPosts(page, token);
  };

  const handleDeletePost = async (boardId: number) => {
    if (processingIds.includes(boardId) || !token) return;
    
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
    } catch (error) {
      console.error('게시글 삭제 처리 중 오류:', error);
      alert('게시글 삭제 처리에 실패했습니다.');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== boardId));
    }
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
        <Link href="/admin" className="text-blue-600 hover:underline">
          관리자 홈으로
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : posts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 border-b text-left">신고 ID</th>
                <th className="py-2 px-3 border-b text-left">게시글 ID</th>
                <th className="py-2 px-3 border-b text-left">게시글 제목</th>
                <th className="py-2 px-3 border-b text-left">작성자 ID</th>
                <th className="py-2 px-3 border-b text-left">해당 유저 총 신고 횟수</th>
                <th className="py-2 px-3 border-b text-left">해당 게시글 신고 횟수</th>
                <th className="py-2 px-3 border-b text-left">신고 일시</th>
                <th className="py-2 px-3 border-b text-left">관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.reportId} className="hover:bg-gray-50">
                  <td className="py-2 px-3 border-b">{post.reportId}</td>
                  <td className="py-2 px-3 border-b">{post.boardId}</td>
                  <td className="py-2 px-3 border-b max-w-xs truncate">
                    <Link 
                      href={`/post/${post.boardId}`} 
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      {post.boardTitle}
                    </Link>
                  </td>
                  <td className="py-2 px-3 border-b">
                    <Link 
                      href={`/admin/users/${post.reportedUserId}`} 
                      className="text-blue-600 hover:underline"
                    >
                      {post.reportedUserId}
                    </Link>
                  </td>
                  <td className="py-2 px-3 border-b">{post.userReportedCount}</td>
                  <td className="py-2 px-3 border-b">{post.boardReportedCount}</td>
                  <td className="py-2 px-3 border-b">
                    {new Date(post.reportedAt).toLocaleString('ko-KR')}
                  </td>
                  <td className="py-2 px-3 border-b">
                    <button
                      onClick={() => handleDeletePost(post.boardId)}
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
        <div className="text-center py-8">
          <p className="text-gray-500">신고된 게시글이 없습니다.</p>
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
                      currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
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