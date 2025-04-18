'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// TODO : 나중에 배포시 
const socialLoginForKakaoUrl = 'http://localhost:8090/oauth2/authorization/kakao';
const redirectUrlAfterSocialLogin = 'http://localhost:3000';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:8090/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }, 
        body: JSON.stringify({
          username,
          password,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('로그인에 실패했습니다.');
      }

      const data = await response.json();
      console.log('로그인 성공:', data);
      
  
      router.push('/');
      
    } catch (error) {
      console.error('로그인 에러:', error);
      // TODO: 에러 처리 (예: 에러 메시지 표시)
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9FE] px-4">
      <div className="w-full max-w-[600px] bg-white rounded-3xl p-12 shadow-lg">
        <div className="flex flex-col items-center mb-12">
          <Link href="/" className="cursor-pointer">
            <Image
              src="/logo.png"
              alt="Hakple 로고"
              width={60}
              height={60}
              className="mb-6"
            />
          </Link>
          <h1 className="text-4xl font-bold">
            <span className="text-[#8C4FF2]">Hakple</span>
            <span className="text-black">에 오신 것을 환영합니다</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label htmlFor="username" className="block text-gray-700 text-lg">
              아이디
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="w-full px-5 py-4 text-lg text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="password" className="block text-gray-700 text-lg">
              비밀번호
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-5 py-4 text-lg text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                <Image
                  src={showPassword ? "/images/eye-off.svg" : "/images/eye.svg"}
                  alt={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  width={28}
                  height={28}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="remember" className="ml-3 text-base text-gray-600">
              로그인 상태 유지가 될 것 같아보임?
            </label>
            <Link href="/forgot-password" className="ml-auto text-base text-gray-600 hover:text-purple-600">
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-4 text-lg bg-[#8C4FF2] text-white rounded-lg hover:bg-[#7340C2] transition-colors"
          >
            로그인
          </button>

  
            <Link href={`${socialLoginForKakaoUrl}?redirectUrl=${redirectUrlAfterSocialLogin}`}
            className="w-full py-4 text-lg bg-[#FFE500] text-black rounded-lg hover:bg-[#FFD700] transition-colors flex items-center justify-center"
            >
            카카오 계정으로 로그인
          </Link>

          <p className="text-center text-base text-gray-600">
            아직 회원이 아니신가요?{' '}
            <Link href="/signup" className="text-[#8C4FF2] hover:underline">
              회원가입
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}