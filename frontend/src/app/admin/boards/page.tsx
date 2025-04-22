'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// 게시글 상태 타입
type Status = 'ACTIVE' | 'INACTIVE' | 'PENDING';

// 백엔드에서 받아오는 게시글 정보 인터페이스
interface Board {
  id: number;
  title: string;
  author: string;
  viewCount: number;
  status: Status;
  academyCode: string;
  createdAt: string; // "yyyy-MM-dd HH:mm:ss" 형식
}

export default function AdminBoardsPage() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 필터링 상태
  const [statusFilter, setStatusFilter] = useState<Status | ''>('');
  const [academyCodeFilter, setAcademyCodeFilter] = useState('');
  const [sortBy, setSortBy] = useState('creationTime');
  const [direction, setDirection] = useState('desc');
  
  const PAGE_SIZE = 10;

  useEffect(() => {
    // 컴포넌트 마운트 시 관리자 권한 확인
    checkAdmin();
  }, [router]);

  // 관리자 권한 확인
  const checkAdmin = async () => {
    try {
      const response = await fetch(`http://localhost:8090/api/v1/admin/check`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        router.push('/'); // 권한이 없으면 홈으로 리다이렉트
        return;
      }

      const isAdminResult = await response.json();
      
      if (isAdminResult === true) {
        setIsAdmin(true);
        fetchBoards(); // 관리자면 게시글 목록 로드
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('관리자 권한 확인 중 오류 발생:', error);
      router.push('/');
    }
  };

  // 게시글 목록 로드
  const fetchBoards = async () => {
    setLoading(true);
    try {
      // 필터 파라미터 구성
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', PAGE_SIZE.toString());
      params.append('sortBy', sortBy);
      params.append('direction', direction);
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      if (academyCodeFilter) {
        params.append('academyCode', academyCodeFilter);
      }
      
      const response = await fetch(
        `http://localhost:8090/api/v1/admin/boards?${params.toString()}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다');
      }

      const data = await response.json();
      setBoards(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('게시글 데이터 로드 중 오류 발생:', error);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // 검색어, 상태 필터, 학원 코드 필터 변경 시 자동으로 목록 다시 로드
  useEffect(() => {
    if (isAdmin) {
      fetchBoards();
    }
  }, [currentPage, statusFilter, academyCodeFilter, sortBy, direction, isAdmin]);

  // 게시글 상태를 한글로 변환
  const getStatusText = (status: Status) => {
    switch (status) {
      case 'ACTIVE': return '활성';
      case 'INACTIVE': return '비활성';
      case 'PENDING': return '삭제 대기';
      default: return status;
    }
  };

  // 게시글 상태별 배경색 지정
  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 날짜 형식 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\. /g, '-').replace('.', '');
  };

  if (loading && !boards.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">게시글 관리</h1>
        <Link href="/admin" className="text-purple-600 hover:underline">
          관리자 홈으로
        </Link>
      </div>

      {/* 필터링 컨트롤 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-auto">
            <select
              id="statusFilter"
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | '')}
            >
              <option value="">모든 상태</option>
              <option value="ACTIVE">활성</option>
              <option value="INACTIVE">비활성</option>
              <option value="PENDING">삭제 대기</option>
            </select>
          </div>
          
          <div className="w-auto">
            <input
              type="text"
              id="academyCodeFilter"
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 w-40"
              placeholder="학원 코드"
              value={academyCodeFilter}
              onChange={(e) => setAcademyCodeFilter(e.target.value)}
            />
          </div>
          
          <div className="flex w-auto">
            <select
              id="sortBy"
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="creationTime">등록일</option>
              <option value="viewCount">조회수</option>
              <option value="title">제목</option>
            </select>
            <select
              id="direction"
              className="px-3 py-1.5 text-sm border-l-0 border border-gray-300 rounded-r-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="desc">내림차순</option>
              <option value="asc">오름차순</option>
            </select>
          </div>
          
          <button
            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            onClick={() => {
              setStatusFilter('');
              setAcademyCodeFilter('');
              setSortBy('creationTime');
              setDirection('desc');
              setCurrentPage(1);
            }}
          >
            초기화
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : boards.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조회수</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학원 코드</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {boards.map((board) => (
                <tr key={board.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap">{board.id}</td>
                  <td className="py-3 px-4">
                    <Link 
                      href={`/post/${board.id}`} 
                      className="text-purple-600 hover:underline cursor-pointer"
                    >
                      {board.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{board.author}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{board.viewCount}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{formatDate(board.createdAt)}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{board.academyCode}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(board.status)}`}>
                      {getStatusText(board.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">게시글이 없습니다.</p>
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
                  disabled={currentPage === 1}
                  className={`mx-1 px-3 py-1 rounded ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  이전
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <li key={page}>
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`mx-1 px-3 py-1 rounded ${
                      currentPage === page ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`mx-1 px-3 py-1 rounded ${
                    currentPage === totalPages
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