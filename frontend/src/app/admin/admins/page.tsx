'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Admin {
  id: number;
  userName: string;
  phoneNum: string;
  creationTime: string;
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export default function AdminListPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  
  // 페이지네이션 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // 관리자 권한 확인
  useEffect(() => {
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
        
        if (isAdminResult === true) {
          setIsAdmin(true);
          fetchAdmins(currentPage, pageSize);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('관리자 권한 확인 중 오류 발생:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router, currentPage, pageSize]);

  // 관리자 목록 가져오기
  const fetchAdmins = async (page: number, size: number) => {
    try {
      console.log('관리자 목록 조회 API 요청 시작');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/admins?page=${page}&size=${size}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('관리자 목록 조회 실패:', response.status, response.statusText);
        throw new Error('관리자 목록을 가져오는데 실패했습니다.');
      }
      
      const data: PageResponse<Admin> = await response.json();
      console.log('관리자 목록 조회 성공:', data);
      
      setAdmins(data.content);
      setFilteredAdmins(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error('관리자 목록 조회 중 오류:', error);
      setError('관리자 목록을 가져오는데 실패했습니다.');
    }
  };

  // 페이지 변경 처리
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 페이지 크기 변경 처리
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1); // 페이지 크기 변경 시 첫 페이지로 이동
  };

  // 검색어 처리
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredAdmins(admins);
      return;
    }
    
    const filtered = admins.filter(admin => 
      admin.userName.toLowerCase().includes(term.toLowerCase()) ||
      admin.phoneNum.includes(term)
    );
    
    setFilteredAdmins(filtered);
  };

  // 날짜 포맷
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C4FF2]"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🔰 관리자 목록 조회</h1>
          <Link href="/admin" className="text-[#8C4FF2] hover:underline">
            관리자 홈으로 돌아가기
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 mb-6">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="w-full md:w-64">
                <input
                  type="text"
                  placeholder="아이디 또는 전화번호로 검색"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2]/20"
                />
              </div>
              <div>
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2]/20"
                >
                  <option value={10}>10개씩</option>
                  <option value={20}>20개씩</option>
                  <option value={50}>50개씩</option>
                </select>
              </div>
            </div>
            
            <div>
              <Link 
                href="/admin/create-admin" 
                className="whitespace-nowrap px-6 py-2 bg-[#8C4FF2] text-white rounded-lg font-medium hover:bg-[#7340C2] inline-flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                관리자 생성
              </Link>
            </div>
          </div>
          
          {error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
          ) : filteredAdmins.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 관리자가 없습니다.'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        아이디
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        전화번호
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        생성일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{admin.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{admin.userName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{admin.phoneNum || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(admin.creationTime)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 페이지네이션 UI */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      이전
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // 현재 페이지 주변의 페이지만 표시
                          return (
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 2
                          );
                        })
                        .map((page, index, array) => {
                          // 페이지 번호 사이에 간격이 있는 경우 ... 표시
                          if (index > 0 && array[index - 1] !== page - 1) {
                            return (
                              <div key={`ellipsis-${page}`} className="flex items-center">
                                <span className="px-1">...</span>
                                <button
                                  onClick={() => handlePageChange(page)}
                                  className={`px-3 py-1 rounded-md ${
                                    currentPage === page
                                      ? 'bg-[#8C4FF2] text-white'
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {page}
                                </button>
                              </div>
                            );
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 rounded-md ${
                                currentPage === page
                                  ? 'bg-[#8C4FF2] text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      다음
                    </button>
                  </nav>
                </div>
              )}
              
              {/* 페이지 정보 표시 */}
              <div className="text-sm text-gray-500 text-center mt-4">
                전체 {totalElements}개 항목 중 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalElements)}개 표시
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 