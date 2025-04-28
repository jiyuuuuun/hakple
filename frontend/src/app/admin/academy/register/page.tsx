'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AcademyRegisterPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [submitStatus, setSubmitStatus] = useState<{
    loading: boolean;
    success: boolean;
    message: string;
    academyCode?: string;
  }>({
    loading: false,
    success: false,
    message: ''
  });

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

  // 입력 필드 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 해당 필드의 오류 메시지 삭제
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // 학원 이름 검사
    if (!formData.name) {
      newErrors.name = '학원 이름은 필수입니다.';
    }
    
    // 전화번호 검사
    if (!formData.phone) {
      newErrors.phone = '전화번호는 필수입니다.';
    } else if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(formData.phone)) {
      newErrors.phone = '전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // 오류가 없으면 true
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!validateForm()) {
      return;
    }
    
    setSubmitStatus({
      loading: true,
      success: false,
      message: '학원을 등록 중입니다...'
    });
    
    try {
      
      // API 요청
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/academies/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        // 오류 응답 처리
        let errorMessage = '학원 등록에 실패했습니다.';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData?.message || errorMessage;
          } else {
            errorMessage = await response.text() || errorMessage;
          }
        } catch (e) {
          console.error('응답 처리 중 오류:', e);
        }
        throw new Error(errorMessage);
      }
      
      // 성공 처리 - 응답이 JSON이 아닐 수 있으므로 주의
      let academyCode = '';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          academyCode = typeof result === 'string' ? result : '';
        } else {
          const textResult = await response.text();
          if (textResult) academyCode = textResult;
        }
      } catch (e) {
        console.error('응답 데이터 처리 중 오류:', e);
      }
      
      setSubmitStatus({
        loading: false,
        success: true,
        message: '학원이 성공적으로 등록되었습니다.',
        academyCode: academyCode
      });
      
    } catch (error) {
      console.error('학원 등록 중 오류:', error);
      setSubmitStatus({
        loading: false,
        success: false,
        message: error instanceof Error ? error.message : '학원 등록 중 오류가 발생했습니다.'
      });
    }
  };

  // 새 학원 등록 시작
  const handleNewAcademy = () => {
    setSubmitStatus({
      loading: false,
      success: false,
      message: ''
    });
    setFormData({
      name: '',
      phone: ''
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
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🏫 학원 등록</h1>
          <Link href="/admin" className="text-[#8C4FF2] hover:underline">
            관리자 홈으로 돌아가기
          </Link>
        </div>

        {submitStatus.success && submitStatus.academyCode ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-center mb-4">
              <span className="text-5xl">✅</span>
            </div>
            <h2 className="text-xl font-semibold text-center mb-4">학원 등록 완료</h2>
            <p className="text-center text-gray-600 mb-6">
              학원이 성공적으로 등록되었습니다.
            </p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">학원 코드</h3>
              <div className="flex items-center justify-between bg-white border border-gray-300 rounded-lg p-3">
                <p className="font-mono text-lg">{submitStatus.academyCode}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(submitStatus.academyCode || '');
                    alert('학원 코드가 클립보드에 복사되었습니다.');
                  }}
                  className="text-[#8C4FF2] hover:text-[#7340C2]"
                >
                  복사
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                학원 코드는 학원 구성원들에게 공유해 주세요. 이 코드로 학원에 가입할 수 있습니다.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleNewAcademy}
                className="px-6 py-2 bg-white border border-[#8C4FF2] text-[#8C4FF2] rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                새 학원 등록하기
              </button>
              <Link 
                href="/admin/academy/list"
                className="px-6 py-2 bg-[#8C4FF2] text-white rounded-lg font-medium hover:bg-[#7340C2] transition-colors"
              >
                학원 목록 보기
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleSubmit}>
              {/* 학원 이름 */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                  학원 이름
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-[#8C4FF2]/20'
                  }`}
                  placeholder="예: 한빛학원"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* 전화번호 */}
              <div className="mb-6">
                <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                  전화번호
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-[#8C4FF2]/20'
                  }`}
                  placeholder="예: 010-1234-5678"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              {/* 제출 상태 메시지 */}
              {submitStatus.message && !submitStatus.success && (
                <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700">
                  {submitStatus.message}
                </div>
              )}

              {/* 제출 버튼 */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitStatus.loading}
                  className={`px-6 py-2 bg-[#8C4FF2] text-white rounded-lg font-medium
                    ${submitStatus.loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#7340C2]'}
                  `}
                >
                  {submitStatus.loading ? '처리 중...' : '학원 등록하기'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 