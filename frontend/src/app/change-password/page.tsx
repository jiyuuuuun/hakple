'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// API 기본 URL
const API_BASE_URL = 'http://localhost:8090'; // 실제 서버 URL로 변경 필요

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // 비밀번호 유효성 검사
  const validatePassword = (password: string) => {
    return password.length >= 8;
  };
  
  // 비밀번호 확인 일치 검사
  useEffect(() => {
    if (newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        setConfirmError('비밀번호가 일치하지 않습니다.');
      } else {
        setConfirmError('');
      }
    } else {
      setConfirmError('');
    }
  }, [newPassword, confirmPassword]);
  
  // 비밀번호 유효성 실시간 검사
  useEffect(() => {
    if (newPassword) {
      if (!validatePassword(newPassword)) {
        setPasswordError('비밀번호는 8자 이상이어야 합니다.');
      } else {
        setPasswordError('');
      }
    } else {
      setPasswordError('');
    }
  }, [newPassword]);
  
  // 제출 버튼 활성화 여부
  const isSubmitDisabled = () => {
    return (
      !currentPassword || 
      !newPassword || 
      !confirmPassword || 
      passwordError !== '' || 
      confirmError !== '' || 
      isLoading
    );
  };
  
  // 비밀번호 변경 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력값 검증
    if (!currentPassword) {
      setPasswordError('현재 비밀번호를 입력해주세요.');
      return;
    }
    
    if (!validatePassword(newPassword)) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setConfirmError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    setIsLoading(true);
    setPasswordError('');
    setConfirmError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/usernames/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, // JWT 토큰 헤더에 추가
        },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword,
          newPasswordConfirm: confirmPassword
        }),
      });
      
      if (response.status === 401) {
        setPasswordError('현재 비밀번호가 올바르지 않습니다.');
        return;
      }
      
      if (!response.ok) {
        throw new Error('비밀번호 변경에 실패했습니다.');
      }
      
      // 비밀번호 변경 성공 메시지 표시
      setSuccessMessage('비밀번호가 성공적으로 변경되었습니다.');
      
      // 폼 리셋
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // 3초 후 메인 페이지로 이동
      setTimeout(() => {
        router.push('/');
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
          <h1 className="text-3xl font-bold text-gray-900">비밀번호 변경</h1>
          <p className="text-gray-700 mt-3 font-medium">현재 비밀번호 확인 후 새 비밀번호를 설정해주세요.</p>
        </div>
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-600 font-medium">{successMessage}</p>
            <p className="text-green-600 text-sm mt-1">잠시 후 메인 페이지로 이동합니다...</p>
          </div>
        )}
        
        {passwordError && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600 font-medium">{passwordError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="current-password" className="block text-lg font-semibold mb-3 text-gray-800">
              현재 비밀번호
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="현재 비밀번호 입력"
              className="w-full px-6 py-5 text-lg text-black border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2] focus:border-transparent bg-white shadow-sm"
              disabled={isLoading || !!successMessage}
            />
          </div>
          
          <div>
            <label htmlFor="new-password" className="block text-lg font-semibold mb-3 text-gray-800">
              새 비밀번호
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
              }}
              placeholder="새 비밀번호 입력"
              className={`w-full px-6 py-5 text-lg text-black border-2 ${
                passwordError ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2] focus:border-transparent bg-white shadow-sm`}
              disabled={isLoading || !!successMessage}
            />
            <p className={`text-sm mt-2 ${validatePassword(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
              비밀번호는 8자 이상이어야 합니다.
            </p>
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
              }}
              placeholder="새 비밀번호 다시 입력"
              className={`w-full px-6 py-5 text-lg text-black border-2 ${
                confirmError ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2] focus:border-transparent bg-white shadow-sm`}
              disabled={isLoading || !!successMessage}
            />
            {confirmError && (
              <p className="text-red-500 text-sm mt-2">
                {confirmError}
              </p>
            )}
          </div>
          
          <div className="flex space-x-4 mt-12">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 px-6 py-5 bg-white border-2 border-gray-300 text-black text-center rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium"
              disabled={isLoading || !!successMessage}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled()}
              className={`flex-1 px-6 py-5 ${
                isSubmitDisabled() 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-[#8C4FF2] hover:bg-[#7340C2]'
              } text-white rounded-lg transition-colors text-lg font-medium`}
            >
              {isLoading ? '처리 중...' : '변경하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 