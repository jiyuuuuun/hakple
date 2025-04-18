'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLoginMember,  LoginMemberContext} from '@/stores/auth/loginMember';

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const {
        loginMember,
        setLoginMember,
        setNoLoginMember,
        isLoginMemberPending,
        isLogin,
        logout,
        logoutAndHome,
    } =useLoginMember();

    //전역 Store등록, context api기술을 썼다고 함
    const loginMemberContextValue = {
        loginMember,
        setLoginMember,
        setNoLoginMember,
        isLoginMemberPending,
        isLogin,
        logout,
        logoutAndHome,
    }

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    //[]최초 요청시 api를 보낸다, 요청시에도 저게 돌아간다고 한다
    useEffect(() => {
        fetch('http://localhost:8090/api/v1/auth/me', {
                //요청마다 헤더에 쿠키가 자동 실행된다고 한다
                credentials : 'include',
            })
            .then(res => res.json())
            .then(data => {
                //로그인 성공시
                setLoginMember(data);
            })
            .catch(err => {
                //로그인이 안되있다면
                setNoLoginMember();
            });
    }, []);

    if(isLoginMemberPending) {
        return <div className='flex justify-center items-center h-screen'>
            로그인 중...
            </div>;
    }


    return (
        //나중에 내부적으로 접근이 가능하게 된다, 그리고 value를 통하여 전역적으로 접근이 가능하게 된다
        <LoginMemberContext value={loginMemberContextValue}>
        <main>
      <header className="bg-[#f2edf4] py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-screen-lg mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* 왼쪽: 로고와 네비게이션 */}
            <div className="flex items-center space-x-4 md:space-x-8">
              {/* 모바일 메뉴 버튼 - 왼쪽으로 이동 */}
              <button
                className="md:hidden p-2 text-gray-500 rounded-md hover:bg-gray-100 focus:outline-none"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>

              <Link href="/" className="flex items-center flex-shrink-0">
                <img
                  src="logo.png"
                  alt="HAKPLE"
                  width={55}
                  height={55}
                  className="logo"
                />
              </Link>

              {/* 데스크탑 메뉴 */}
              <nav className="hidden md:flex space-x-5 lg:space-x-8">
                <Link
                  href="/home"
                  className="font-medium text-lg text-gray-700 hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all"
                >
                  홈
                </Link>
                <Link
                  href="/post"
                  className="font-medium text-lg text-gray-700 hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all"
                >
                  게시판
                </Link>
                <Link
                  href="/boad"
                  className="font-medium text-lg text-gray-700 hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all"
                >
                  인기글
                </Link>
                <Link
                  href="/community"
                  className="font-medium text-lg text-gray-700 hover:text-gray-900 whitespace-nowrap hover:font-semibold transition-all"
                >
                  캘린더
                </Link>
              </nav>
            </div>

            {/* 오른쪽: 검색과 로그인 */}
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="relative w-full max-w-[180px] md:max-w-[220px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5 text-gray-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="search"
                  className="block w-full pl-8 md:pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                  placeholder="검색어를 입력하세요"
                />
              </div>
              {isLogin ? (
                       <>
                       {/* TODO : 나중에 여기 눌러서 유저 정보 보기 */}
                       <div style={{ color: 'black' }}>{loginMember.nickname}</div>
                       <button onClick={() => logoutAndHome()} className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 md:px-6 rounded-md text-sm whitespace-nowrap h-[38px]">
                       로그아웃
                       </button>
                     
                     </>
              ) : (
                        <>
                           <Link href="/login">
                           <button className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 md:px-6 rounded-md text-sm whitespace-nowrap h-[38px]">
                             로그인
                           </button>
                         </Link>
                         </>
              )}
   
            </div>
          </div>

          {/* 모바일 메뉴 */}
          {isMenuOpen && (
            <div className="mt-3 md:hidden">
              <nav className="flex flex-col space-y-2 py-2">
                <Link
                  href="/home"
                  className="font-medium text-base text-gray-700 hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100"
                >
                  홈
                </Link>
                <Link
                  href="/academy"
                  className="font-medium text-base text-gray-700 hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100"
                >
                  게시판
                </Link>
                <Link
                  href="/boad"
                  className="font-medium text-base text-gray-700 hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100"
                >
                  인기글
                </Link>
                <Link
                  href="/community"
                  className="font-medium text-base text-gray-700 hover:text-gray-900 px-2 py-2 rounded-md hover:bg-gray-100"
                >
                  캘린더
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

            {children}
        </main>
        </LoginMemberContext>
    );
}
