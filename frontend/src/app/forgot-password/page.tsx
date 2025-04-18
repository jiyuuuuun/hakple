'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// API 기본 URL
const API_BASE_URL = 'http://localhost:8090'; // 실제 서버 URL로 변경 필요

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3분 타이머
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 인증번호 전송 처리
  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      setErrorMessage('휴대폰 번호를 입력해주세요.');
      return;
    }
    
    // 전화번호 형식 검증 (간단한 검증)
    if (phoneNumber.length < 10 || phoneNumber.length > 11) {
      setErrorMessage('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sms/send?phone=${phoneNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401) {
        setErrorMessage('존재하지 않는 사용자입니다.');
        return;
      }
      
      if (!response.ok) {
        throw new Error('인증번호 전송에 실패했습니다.');
      }
      
      // 성공적으로 전송됨
      setIsSent(true);
      setTimeLeft(180);
      setIsTimerActive(true);
      setIsExpired(false);
      setVerificationCode(''); // 재전송 시 인증번호 초기화
    } catch (error) {
      console.error('인증번호 전송 오류:', error);
      setErrorMessage('인증번호 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 인증 완료 처리
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode) {
      setErrorMessage('인증번호를 입력해주세요.');
      return;
    }
    
    if (verificationCode.length !== 6) {
      setErrorMessage('인증번호 6자리를 모두 입력해주세요.');
      return;
    }
    
    if (isExpired) {
      setErrorMessage('인증번호가 만료되었습니다. 인증번호를 재전송해주세요.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sms/verify?phone=${phoneNumber}&code=${verificationCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401) {
        setErrorMessage('존재하지 않는 사용자입니다.');
        return;
      }
      
      if (!response.ok) {
        throw new Error('인증번호 검증에 실패했습니다.');
      }
      
      // 인증 성공 시 다음 단계로 이동
      // 페이지 이동 시 phoneNumber를 state로 전달하여 비밀번호 재설정에 사용
      router.push(`/reset-password?phone=${encodeURIComponent(phoneNumber)}`);
    } catch (error) {
      console.error('인증 오류:', error);
      setErrorMessage('인증번호가 올바르지 않습니다. 다시 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 타이머 처리
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isTimerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      setIsExpired(true);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerActive, timeLeft]);
  
  // 타이머 포맷팅 (분:초)
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9FE] px-4">
      <div className="w-full max-w-[500px] bg-white rounded-2xl p-12 shadow-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">비밀번호 찾기</h1>
        </div>
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600 font-medium">{errorMessage}</p>
          </div>
        )}
        
        <div className="mb-8">
          <label htmlFor="phoneNumber" className="block text-lg font-semibold mb-3 text-gray-800">
            휴대폰 번호
          </label>
          <div className="flex flex-col space-y-3">
            <input
              id="phoneNumber"
              type="text"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''));
                setErrorMessage('');
              }}
              placeholder="휴대폰 번호를 입력하세요"
              className="w-full px-6 py-5 text-lg text-black border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2] focus:border-transparent bg-white shadow-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSendVerification}
              className={`w-full px-6 py-5 bg-white border-2 border-gray-300 text-black font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? '처리 중...' : isSent && isExpired ? '인증번호 재전송' : '인증번호 전송'}
            </button>
          </div>
          <p className="text-sm text-gray-700 mt-2 font-medium">- 숫자만 입력해주세요</p>
        </div>
        
        {isSent && (
          <div className={`mb-10 p-5 rounded-lg border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="verificationCode" className="block text-lg font-semibold text-gray-800">
                인증번호
              </label>
              {isTimerActive && !isExpired && <span className="text-red-500 font-bold text-lg">{formatTime()}</span>}
              {isExpired && <span className="text-red-500 font-bold text-lg">만료됨</span>}
            </div>
            <input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => {
                setVerificationCode(e.target.value.replace(/[^0-9]/g, ''));
                setErrorMessage('');
              }}
              placeholder="인증번호 6자리 입력"
              className={`w-full px-6 py-5 text-lg text-black border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2] focus:border-transparent bg-white shadow-sm ${isExpired ? 'border-red-300' : 'border-gray-300'}`}
              maxLength={6}
              inputMode="numeric"
              disabled={isExpired || isLoading}
            />
            {isExpired && (
              <p className="text-red-500 mt-2 font-medium">
                인증번호가 만료되었습니다. 인증번호를 재전송해주세요.
              </p>
            )}
          </div>
        )}
        
        <div className="flex space-x-4 mt-12">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="flex-1 px-6 py-5 bg-white border-2 border-gray-300 text-black text-center rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            onClick={handleVerify}
            disabled={!isSent || isExpired || isLoading}
            className="flex-1 px-6 py-5 bg-[#8C4FF2] text-white rounded-lg hover:bg-[#7340C2] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg font-medium"
          >
            {isLoading ? '확인 중...' : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
} 