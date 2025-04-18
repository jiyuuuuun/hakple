'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// API 기본 URL
const API_BASE_URL = 'http://localhost:8090'; // 실제 서버 URL로 변경 필요

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneNumber = searchParams.get('phone') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // 휴대폰 번호가 없는 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!phoneNumber) {
      router.push('/login');
    }
  }, [phoneNumber, router]);
  
  // 비밀번호 유효성 검사
  const validatePassword = (password: string) => {
    // 최소 8자, 최대 15자
    if (password.length < 8 || password.length > 15) {
      return false;
    }
    return true;
  };
  
  // 비밀번호 변경 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력값 검증
    if (!password || !confirmPassword) {
      setPasswordError('비밀번호를 입력해주세요.');
      return;
    }
    
    if (!validatePassword(password)) {
      setPasswordError('비밀번호는 8~15자로 입력해주세요.');
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    setIsLoading(true);
    setPasswordError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/usernames/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: password,
          newPasswordConfirm: confirmPassword
        }),
      });
      
      if (response.status === 401) {
        setPasswordError('존재하지 않는 사용자입니다.');
        return;
      }
      
      if (!response.ok) {
        throw new Error('비밀번호 변경에 실패했습니다.');
      }
      
      // 비밀번호 변경 성공 메시지 표시
      setSuccessMessage('비밀번호가 성공적으로 변경되었습니다.');
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      setPasswordError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9FE] px-4">
      <div className="w-full max-w-[500px] bg-white rounded-2xl p-12 shadow-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">새 비밀번호 설정</h1>
          <p className="text-gray-700 mt-3 font-medium">새로운 비밀번호를 입력해주세요.</p>
        </div>
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-600 font-medium">{successMessage}</p>
            <p className="text-green-600 text-sm mt-1">잠시 후 로그인 페이지로 이동합니다...</p>
          </div>
        )}
        
        {passwordError && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600 font-medium">{passwordError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="password" className="block text-lg font-semibold mb-3 text-gray-800">
              새 비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="새 비밀번호 입력"
              className="w-full px-6 py-5 text-lg text-black border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2] focus:border-transparent bg-white shadow-sm"
              disabled={isLoading || !!successMessage}
            />
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-lg font-semibold mb-3 text-gray-800">
              새 비밀번호 확인
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="새 비밀번호 다시 입력"
              className="w-full px-6 py-5 text-lg text-black border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2] focus:border-transparent bg-white shadow-sm"
              disabled={isLoading || !!successMessage}
            />
          </div>
          
          <p className="text-sm text-gray-700 font-medium mt-2">
            비밀번호는 8~15자로 입력해주세요.
          </p>
          
          <div className="flex space-x-4 mt-12">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="flex-1 px-6 py-5 bg-white border-2 border-gray-300 text-black text-center rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium"
              disabled={isLoading || !!successMessage}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-5 bg-[#8C4FF2] text-white rounded-lg hover:bg-[#7340C2] transition-colors text-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={isLoading || !!successMessage}
            >
              {isLoading ? '처리 중...' : '완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 