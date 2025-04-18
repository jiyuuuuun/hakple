'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  console.log(process.env.NEXT_PUBLIC_API_BASE_URL);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      

      <main className="flex flex-col items-center justify-center py-12 px-4 max-w-screen-lg mx-auto">
        <section className="w-full text-center mb-15">
          <h1 className="text-3xl font-bold mb-4">
            학원 생활의 시작,
            <br />
            지금 학플과 함께하세요!
          </h1>
          <p className="text-gray-600 mb-9">
            3분 만에 가입하고
            <br />내 학원 정보와 커뮤니티를 무료로 이용해보세요
          </p>
          <button className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-8 rounded-md">
            3분 만에 회원가입 하기
          </button>
        </section>

        <section className="w-full mb-10 py-5">
          <h2 className="text-2xl font-bold text-center mb-12">
            회원가입 시 누릴 수 있는 혜택
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="p-7 mb-7 bg-purple-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-14 w-14 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">무료 커뮤니티 이용</h3>
              <p className="text-gray-600">
                학원생들과 자유롭게 소통하며 유용한 정보를 교환해보세요.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="p-7 mb-7 bg-purple-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-14 w-14 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">실시간 리뷰</h3>
              <p className="text-gray-600">
                실제 학생들의 생생한 학원 리뷰를 확인해보세요.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full text-center mb-10">
          <div className="mb-3">
            <div className="w-40 h-40 mx-auto flex items-center justify-center">
              <img
                src="logo.png"
                alt="지금 바로 시작하세요"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-gray-600 mb-6">
            더 이상 고민하지 마세요.
            <br />
            학플에서 여러분이 원하는 학원생활을 만들어보세요.
          </p>
        </section>
      </main>
    </>
  );
}
