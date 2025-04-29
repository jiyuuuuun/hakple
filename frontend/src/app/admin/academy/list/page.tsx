'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGlobalLoginMember } from '@/stores/auth/loginMember';
import { fetchApi } from '@/utils/api';

interface Academy {
  id?: number;             // 백엔드에서 제공할 수도 있음
  name: string;            // academyName
  phone: string;           // phoneNum
  code: string;            // academyCode
  userCount: number;       // 소속 유저 수
  creationTime: string;    // 생성 시간
}

// 페이지네이션을 위한 응답 인터페이스 추가
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

export default function AcademyListPage() {
  const router = useRouter();
  const { loginMember } = useGlobalLoginMember();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [filteredAcademies, setFilteredAcademies] = useState<Academy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  
  // 페이지네이션 관련 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        if (!loginMember) {
          router.push('/login')
          return
        }

        const response = await fetchApi('/api/v1/admin/check', {
          method: 'GET',
        });


        if (!response.ok) {
          router.push('/');
          return;
        }

        // 응답 데이터 처리
        const isAdminResult = await response.json();
        
        if (isAdminResult === true) {
          setIsAdmin(true);
          fetchAcademies();
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

  // 학원 목록 가져오기
  const fetchAcademies = async () => {
    try {
      console.log('학원 목록 조회 API 요청 시작');
      
      // 페이지네이션이 적용된 API 엔드포인트
      const apiUrl = `/api/v1/admin/academies?page=${currentPage}&size=${pageSize}`;
      console.log('요청 URL:', apiUrl);

      const response = await fetchApi(apiUrl, {
        method: 'GET',
      });
      console.log('응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          console.error('오류 응답 텍스트 읽기 실패', e);
        }
        
        console.error('학원 목록 조회 실패:', response.status, response.statusText, errorText);
        throw new Error(`학원 목록을 가져오는데 실패했습니다. 상태: ${response.status}, 메시지: ${errorText || response.statusText}`);
      }
      
      // Content-Type 확인 및 로깅
      const contentType = response.headers.get('content-type');
      console.log('응답 Content-Type:', contentType);
      
      // 응답 처리
      let data;
      try {
        const responseText = await response.text();
        console.log('원본 응답 데이터:', responseText);
        
        if (!responseText || responseText.trim() === '') {
          console.log('응답이 비어있습니다.');
          data = { content: [], totalPages: 0, totalElements: 0 };
        } else {
          try {
            data = JSON.parse(responseText);
            console.log('파싱된 데이터:', data);
          } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            data = { content: [], totalPages: 0, totalElements: 0 };
          }
        }
      } catch (error) {
        console.error('응답 데이터 처리 중 오류:', error);
        data = { content: [], totalPages: 0, totalElements: 0 };
      }
      
      // 페이지네이션 응답 형식 처리
      let academyList = [];
      if (Array.isArray(data)) {
        academyList = data;
        setTotalPages(1);
        setTotalElements(data.length);
      } else if (data && Array.isArray(data.content)) {
        academyList = data.content;
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || academyList.length);
      } else {
        academyList = [];
        setTotalPages(1);
        setTotalElements(0);
      }
      
      // Academy 인터페이스에 맞게 데이터 매핑
      const mappedData = academyList.map((item: any) => ({
        id: item.id || 0,
        name: item.academyName || '이름 없음',
        phone: item.phoneNum || '',
        code: item.academyCode || '',
        userCount: item.userCount || 0,
        creationTime: item.creationTime || item.createdAt || ''
      }));
      
      console.log('매핑된 학원 데이터:', mappedData);
      
      setAcademies(mappedData);
      setFilteredAcademies(mappedData);
      
      if (mappedData.length === 0) {
        console.log('불러온 학원 목록이 비어있습니다.');
      } else {
        console.log(`총 ${mappedData.length}개의 학원 정보를 가져왔습니다.`);
      }
    } catch (error) {
      console.error('학원 목록 조회 중 오류:', error);
      setError(error instanceof Error ? error.message : '학원 목록을 가져오는데 실패했습니다.');
    }
  };

  // 검색어 처리
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredAcademies(academies);
      return;
    }
    
    const filtered = academies.filter(academy => 
      academy.name.toLowerCase().includes(term.toLowerCase()) ||
      (academy.code && academy.code.toLowerCase().includes(term.toLowerCase())) ||
      (academy.phone && academy.phone.toLowerCase().includes(term.toLowerCase()))
    );
    
    setFilteredAcademies(filtered);
  };

  // 날짜 포맷
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      console.error('날짜 변환 오류:', e);
      return '-';
    }
  };

  // 페이지 변경 처리 함수 추가
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 페이지 크기 변경 처리 함수 추가
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1); // 페이지 크기 변경 시 첫 페이지로 이동
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
          <h1 className="text-3xl font-bold text-gray-800">📋 학원 목록 조회</h1>
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
                  placeholder="학원 이름, 코드 또는 전화번호로 검색"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2]/20"
                />
              </div>
              {/* 페이지 크기 선택 옵션 추가 */}
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
            
            <div className="flex space-x-2">
              <Link 
                href="/admin/academy/register" 
                className="whitespace-nowrap px-6 py-2 bg-[#8C4FF2] text-white rounded-lg font-medium hover:bg-[#7340C2] inline-flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                학원 등록
              </Link>
            </div>
          </div>
          
          {error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
          ) : filteredAcademies.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 학원이 없습니다.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학원 이름
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학원 코드
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전화번호
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록일
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      회원 수
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAcademies.map((academy, index) => (
                    <tr key={academy.code || `academy-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{academy.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 font-mono">{academy.code || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{academy.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(academy.creationTime)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{academy.userCount || 0}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* 페이지네이션 UI 추가 */}
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
        </div>
      </div>
    </div>
  );
} 