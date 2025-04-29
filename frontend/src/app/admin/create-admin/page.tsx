'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/utils/api';

export default function CreateAdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    nickName: '관리자',
    phoneNumber: '',
    userName: '',
    password: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [submitStatus, setSubmitStatus] = useState<{
    loading: boolean;
    success: boolean;
    message: string;
  }>({
    loading: false,
    success: false,
    message: ''
  });

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      try {
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
    
    // nickName은 변경하지 않음
    if (name === 'nickName') return;
    
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
    
    // 닉네임 검사 - 이미 '관리자'로 고정되어 있으므로 검사 생략
    
    // 전화번호 검사
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = '전화번호는 필수 입력값입니다.';
    } else if (!/^01[0-9]{1}-?[0-9]{3,4}-?[0-9]{4}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = '전화번호는 10~11자리 숫자만 입력 가능합니다.';
    }
    
    // 아이디 검사
    if (!formData.userName) {
      newErrors.userName = '아이디는 필수 입력값입니다.';
    } else if (formData.userName.length < 4 || formData.userName.length > 15) {
      newErrors.userName = '아이디는 최소 4자 최대 15자까지 입력 가능합니다.';
    }
    
    // 비밀번호 검사
    if (!formData.password) {
      newErrors.password = '비밀번호는 필수 입력값입니다.';
    } else if (formData.password.length < 8 || formData.password.length > 15) {
      newErrors.password = '비밀번호는 최소 8자 이상 15자까지 입력 가능합니다.';
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
      message: '관리자 계정을 생성 중입니다...'
    });
    
    try {
      
      // API 요청
      const response = await fetchApi('/api/v1/admin/register', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        // 오류 응답 처리
        let errorMessage = '관리자 계정 생성에 실패했습니다.';
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
      let resultMessage = '관리자 계정이 성공적으로 생성되었습니다.';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          resultMessage = typeof result === 'string' ? result : resultMessage;
        } else {
          const textResult = await response.text();
          if (textResult) resultMessage = textResult;
        }
      } catch (e) {
        console.error('응답 데이터 처리 중 오류:', e);
      }
      
      setSubmitStatus({
        loading: false,
        success: true,
        message: resultMessage
      });
      
      // 성공 메시지 표시 후 관리자 페이지로 이동
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
      
    } catch (error) {
      console.error('관리자 계정 생성 중 오류:', error);
      setSubmitStatus({
        loading: false,
        success: false,
        message: error instanceof Error ? error.message : '관리자 계정 생성 중 오류가 발생했습니다.'
      });
    }
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
          <h1 className="text-3xl font-bold text-gray-800">👑 관리자 계정 생성</h1>
          <Link href="/admin" className="text-[#8C4FF2] hover:underline">
            관리자 홈으로 돌아가기
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit}>
            {/* 닉네임 */}
            <div className="mb-4">
              <label htmlFor="nickName" className="block text-gray-700 font-medium mb-2">
                닉네임
              </label>
              <input
                type="text"
                id="nickName"
                name="nickName"
                value={formData.nickName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-gray-100 ${
                  errors.nickName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-[#8C4FF2]/20'
                }`}
                placeholder="관리자"
                disabled
                readOnly
              />
              <p className="text-gray-500 text-sm mt-1">관리자 계정의 닉네임은 '관리자'로 고정됩니다.</p>
            </div>

            {/* 전화번호 */}
            <div className="mb-4">
              <label htmlFor="phoneNumber" className="block text-gray-700 font-medium mb-2">
                전화번호
              </label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.phoneNumber ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-[#8C4FF2]/20'
                }`}
                placeholder="01012345678 (숫자만 입력)"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
              )}
            </div>

            {/* 아이디 */}
            <div className="mb-4">
              <label htmlFor="userName" className="block text-gray-700 font-medium mb-2">
                아이디
              </label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.userName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-[#8C4FF2]/20'
                }`}
                placeholder="4~15자 사이의 아이디"
              />
              {errors.userName && (
                <p className="text-red-500 text-sm mt-1">{errors.userName}</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-[#8C4FF2]/20'
                }`}
                placeholder="8~15자 사이의 비밀번호"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* 제출 상태 메시지 */}
            {submitStatus.message && (
              <div className={`mb-4 p-3 rounded-lg ${
                submitStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {submitStatus.message}
              </div>
            )}

            {/* 제출 버튼 */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitStatus.loading || submitStatus.success}
                className={`px-6 py-2 bg-[#8C4FF2] text-white rounded-lg font-medium
                  ${(submitStatus.loading || submitStatus.success) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#7340C2]'}
                `}
              >
                {submitStatus.loading ? '처리 중...' : submitStatus.success ? '생성 완료!' : '관리자 계정 생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 