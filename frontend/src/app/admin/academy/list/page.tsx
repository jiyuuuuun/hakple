'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Academy {
  id: number;
  name: string;           // academyName
  phone: string;          // phoneNum
  code: string;           // academyCode
  createdAt: string;      // creationTime
  memberCount?: number;   // 없음
}

export default function AcademyListPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [filteredAcademies, setFilteredAcademies] = useState<Academy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // 로컬 스토리지에서 액세스 토큰 가져오기
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          router.push('/login');
          return;
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/check`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
          fetchAcademies(token);
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
  }, [router]);

  // 학원 목록 가져오기
  const fetchAcademies = async (token: string) => {
    try {
      console.log('학원 목록 조회 API 요청 시작');
      
      // API 엔드포인트를 원래대로 수정
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/academies`;
      console.log('요청 URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      
      // 응답 처리 방식 개선
      let data;
      try {
        const responseText = await response.text();
        console.log('원본 응답 데이터:', responseText);
        
        if (!responseText || responseText.trim() === '') {
          console.log('응답이 비어있습니다.');
          data = [];
        } else {
          try {
            data = JSON.parse(responseText);
            console.log('파싱된 데이터:', data);
          } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            data = [];
          }
        }
      } catch (error) {
        console.error('응답 데이터 처리 중 오류:', error);
        data = [];
      }
      
      // 배열인지 확인
      if (!Array.isArray(data)) {
        console.error('API 응답이 배열이 아닙니다:', data);
        // 가능한 응답 형식 확인
        if (Array.isArray(data?.content)) {
          data = data.content;
        } else if (data && typeof data === 'object') {
          // 객체의 첫 번째 속성이 배열인지 확인
          const firstProp = Object.values(data)[0];
          if (Array.isArray(firstProp)) {
            data = firstProp;
          } else {
            // 그 외의 경우 빈 배열 반환
            data = [];
          }
        } else {
          data = [];
        }
        console.log('배열로 변환된 데이터:', data);
      }
      
      // Academy 인터페이스에 맞게 데이터 매핑
      const mappedData = data.map((item: any) => ({
        id: item.id || 0,
        name: item.academyName || '이름 없음',
        phone: item.phoneNum || '',
        code: item.academyCode || '',
        createdAt: item.creationTime || '',
        memberCount: 0 // 멤버 수 정보가 없음
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
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
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
          <h1 className="text-3xl font-bold text-gray-800">📋 학원 목록 조회</h1>
          <Link href="/admin" className="text-[#8C4FF2] hover:underline">
            관리자 홈으로 돌아가기
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex mb-6">
            <div className="w-full">
              <input
                type="text"
                placeholder="학원 이름, 코드 또는 전화번호로 검색"
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2]/20"
              />
            </div>
            <div className="ml-4">
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
                    {/* 회원 수 정보가 있는 경우 표시 */}
                    {filteredAcademies.some(a => a.memberCount !== undefined) && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        회원 수
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAcademies.map((academy) => (
                    <tr key={academy.id} className="hover:bg-gray-50">
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
                        <div className="text-sm text-gray-500">{formatDate(academy.createdAt)}</div>
                      </td>
                      {/* 회원 수 정보가 있는 경우 표시 */}
                      {filteredAcademies.some(a => a.memberCount !== undefined) && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{academy.memberCount || 0}</div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 