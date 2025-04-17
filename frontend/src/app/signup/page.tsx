'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // 로그인 로직 구현
    console.log('로그인 시도:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="w-full max-w-md space-y-8">
        {/* 로고 */}
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="Hakple"
            width={64}
            height={64}
            className="h-16 w-16"
          />
        </div>

        {/* 타이틀 */}
        <h2 className="mt-2 text-center text-2xl font-semibold text-purple-600">
          Hakple에 오신 것을 환영합니다
        </h2>

        {/* 로그인 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 이메일 입력 */}
            <div>
              <label htmlFor="email" className="text-sm text-gray-700">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                placeholder="이메일 주소를 입력하세요"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="text-sm text-gray-700">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Image
                    src="/eye.svg"
                    alt="비밀번호 보기"
                    width={20}
                    height={20}
                    className="text-gray-500"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 로그인 상태 유지 & 비밀번호 찾기 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">
                로그인 상태 유지
              </label>
            </div>
            <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-purple-500">
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="w-full rounded-md bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            로그인
          </button>

          {/* 카카오 로그인 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">카카오 계정으로 로그인</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full rounded-md bg-yellow-300 py-3 text-sm font-semibold text-gray-900 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            카카오 계정으로 로그인
          </button>

          {/* 회원가입 링크 */}
          <div className="text-center">
            <span className="text-sm text-gray-500">아직 회원이 아니신가요?</span>{' '}
            <Link href="/signup" className="text-sm font-medium text-gray-900 hover:text-purple-600">
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}