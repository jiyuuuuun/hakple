'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/utils/api';

// 아카데미 타입 정의
interface Academy {
  academyCode: string;
  academyName: string;
  phoneNum?: string;
  userCount?: number;
  creationTime?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  
  // 아카데미 관련 상태
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<string>('');

  useEffect(() => {
    const checkAdmin = async () => {
  try {
    const apiUrl = '/api/v1/admin/check'; // BASE_URL은 fetchApi 안에서 붙는다고 가정
    console.log('Checking admin status, API URL:', apiUrl);

    const response = await fetchApi(apiUrl, {
      method: 'GET',
    });

    console.log('Admin check response status:', response.status);

    if (!response.ok) {
      console.log('Admin check failed, status:', response.status);
      setDebugInfo({ 
        error: 'Admin check failed', 
        status: response.status,
        statusText: response.statusText 
      });
      router.push('/');
      return;
    }

    const isAdminResult = await response.json();
    console.log('Admin check result:', isAdminResult);

    if (isAdminResult === true) {
      console.log('User is admin, showing admin page');
      setIsAdmin(true);
      setDebugInfo({ isAdmin: true, message: 'Admin permissions confirmed' });
      fetchAcademies();
    } else {
      console.log('User is not admin, redirecting to home');
      setDebugInfo({ isAdmin: false, message: 'Not an admin user' });
      router.push('/');
    }
  } catch (error) {
    console.error('관리자 권한 확인 중 오류 발생:', error);
    setDebugInfo({ error: 'Error checking admin status', details: error });
    router.push('/');
  } finally {
    setLoading(false);
  }
};


    checkAdmin();
  }, [router]);

  // 아카데미 목록 가져오기
  const fetchAcademies = async () => {
  try {
    const response = await fetchApi('/api/v1/admin/academies', {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('아카데미 목록 조회 실패:', response.status);
      setAcademies([]);
      return;
    }

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
      console.log('파싱된 아카데미 데이터:', data);

      if (data && Array.isArray(data.content)) {
        setAcademies(data.content);
      } else if (Array.isArray(data)) {
        setAcademies(data);
      } else {
        console.error('유효한 아카데미 데이터 형식이 아닙니다:', data);
        setAcademies([]);
      }
    } catch (error) {
      console.error('아카데미 데이터 파싱 오류:', error);
      setAcademies([]);
    }
  } catch (error) {
    console.error('아카데미 목록 조회 중 오류:', error);
    setAcademies([]);
  }
};


  // 공지사항 페이지로 이동
  const handleMoveToNotice = () => {
    if (selectedAcademy) {
      const academy = academies.find(a => a.academyCode === selectedAcademy);
      if (academy) {
        router.push(`/post/notice/${selectedAcademy}`);
      }
    } else {
      alert('아카데미를 선택해주세요');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 디버깅 정보 표시
  if (debugInfo && !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">관리자 권한 확인 실패</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <pre className="whitespace-pre-wrap overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        <div className="mt-4">
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">🔑 관리자 페이지</h1>
      
      
      {/* 관리자 계정 관련 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-[#8C4FF2]">👤 관리자 계정 관리</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/admins" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">🔰 관리자 목록 조회</h2>
            <p className="text-gray-600">모든 관리자 계정 목록을 확인합니다</p>
          </Link>
          
          <Link href="/admin/create-admin" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">👑 관리자 생성</h2>
            <p className="text-gray-600">새로운 관리자 계정을 생성합니다</p>
          </Link>
        </div>
      </div>

      {/* 게시글 관련 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-[#8C4FF2]">📝 게시글 관리</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/boards" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">📑 게시글 목록 조회</h2>
            <p className="text-gray-600">모든 게시글 목록을 조회합니다</p>
          </Link>
          
          <Link href="/admin/reports/posts" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">📃 신고된 게시글 관리</h2>
            <p className="text-gray-600">신고된 게시글을 검토하고 관리합니다</p>
          </Link>
          
          <Link href="/admin/reports/comments" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">💬 신고된 댓글 관리</h2>
            <p className="text-gray-600">신고된 댓글을 검토하고 관리합니다</p>
          </Link>
        </div>
      </div>

      {/* 학원 관련 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-[#8C4FF2]">🏫 학원 관리</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/academy/list" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">📋 학원 목록 조회</h2>
            <p className="text-gray-600">등록된 학원 목록을 조회합니다</p>
          </Link>
          
          <Link href="/admin/academy/register" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">➕ 학원 등록</h2>
            <p className="text-gray-600">새로운 학원을 등록합니다</p>
          </Link>

          <div className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">📢 학원 별 공지사항 관리</h2>
            <div className="flex items-center space-x-2 mt-2">
              <select
                value={selectedAcademy}
                onChange={(e) => setSelectedAcademy(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8C4FF2] text-sm"
              >
                <option value="">아카데미 선택</option>
                {Array.isArray(academies) && academies.map((academy) => (
                  <option key={academy.academyCode} value={academy.academyCode}>
                    {academy.academyName}
                  </option>
                ))}
              </select>
              <button
                onClick={handleMoveToNotice}
                className="px-2 py-1 bg-[#8C4FF2] text-white rounded-lg text-sm hover:bg-[#7340C2]"
              >
                GO
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 회원 관련 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-[#8C4FF2]">👥 회원 관리</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/users" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">📊 회원 목록 조회</h2>
            <p className="text-gray-600">등록된 모든 회원을 조회합니다</p>
          </Link>
        </div>
      </div>
    </div>
  );
} 