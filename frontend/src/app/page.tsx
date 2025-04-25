import Image from 'next/image';
import Link from 'next/link';

export default function Home() {

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGM0LjQxOCAwIDgtMy41ODIgOC04cy0zLjU4Mi04LTgtOC04IDMuNTgyLTggOCAzLjU4MiA4IDggOHoiIHN0cm9rZT0iI0VERTlGRSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>

        <div className="max-w-[1400px] mx-auto px-4 h-full flex flex-col md:flex-row items-center justify-center gap-12">
          {/* Left Content */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              학원생들을 위한<br />특별한 커뮤니티
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              HakPle와 함께 성장하는 학습 여정을 시작하세요.<br />
              동료들과 함께 지식을 나누고, 경험을 공유하세요.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link
                href="/signup"
                className="inline-flex items-center px-8 py-3 rounded-full bg-[#9C50D4] text-white font-medium hover:bg-purple-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-purple-200"
              >
                지금 시작하기
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-3 rounded-full bg-white text-[#9C50D4] font-medium border-2 border-[#9C50D4] hover:bg-purple-50 transform hover:scale-105 transition-all duration-200"
              >
                로그인하기
              </Link>
            </div>
          </div>

          {/* Right Content - Floating Cards */}
          <div className="relative flex-1 h-[400px]">
            {/* Card 1 */}
            <div className="absolute top-0 left-[10%] w-[280px] bg-white rounded-2xl shadow-xl p-6 transform -rotate-6 hover:rotate-0 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="material-icons text-[#9C50D4]">school</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">학습 커뮤니티</h3>
                  <p className="text-sm text-gray-500">함께 성장하는 공간</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-purple-100 rounded-full w-3/4"></div>
                <div className="h-2 bg-purple-100 rounded-full w-1/2"></div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="absolute top-[30%] right-[10%] w-[280px] bg-white rounded-2xl shadow-xl p-6 transform rotate-6 hover:rotate-0 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="material-icons text-[#9C50D4]">forum</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">지식 공유</h3>
                  <p className="text-sm text-gray-500">경험과 노하우 공유</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-purple-100 rounded-full w-2/3"></div>
                <div className="h-2 bg-purple-100 rounded-full w-4/5"></div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="absolute bottom-0 left-[20%] w-[280px] bg-white rounded-2xl shadow-xl p-6 transform rotate-3 hover:rotate-0 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="material-icons text-[#9C50D4]">calendar_today</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">일정 관리</h3>
                  <p className="text-sm text-gray-500">체계적인 학습 계획</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-purple-100 rounded-full w-5/6"></div>
                <div className="h-2 bg-purple-100 rounded-full w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            HakPle만의 특별한 기능
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white rounded-2xl p-8 text-center hover:bg-purple-50 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="material-icons text-3xl text-[#9C50D4]">groups</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                학원별 커뮤니티
              </h3>
              <p className="text-gray-600 leading-relaxed">
                같은 학원 학생들과 소통하며<br />
                함께 성장할 수 있는 공간
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white rounded-2xl p-8 text-center hover:bg-purple-50 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="material-icons text-3xl text-[#9C50D4]">edit_note</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                지식 공유 게시판
              </h3>
              <p className="text-gray-600 leading-relaxed">
                학습 경험과 노하우를<br />
                자유롭게 공유하는 공간
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white rounded-2xl p-8 text-center hover:bg-purple-50 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="material-icons text-3xl text-[#9C50D4]">event_available</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                일정 관리
              </h3>
              <p className="text-gray-600 leading-relaxed">
                체계적인 학습 계획을<br />
                관리할 수 있는 캘린더
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-[1000px] mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            지금 바로 HakPle과 함께하세요
          </h2>
          <p className="text-lg text-gray-600 mb-12 leading-relaxed">
            새로운 배움의 여정을 시작하고, 동료들과 함께 성장하세요.<br />
            HakPle이 여러분의 성공적인 학습을 응원합니다.
          </p>

          <div className="flex flex-wrap gap-6 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-4 rounded-full bg-[#9C50D4] text-white font-medium hover:bg-purple-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-purple-200"
            >
              <span className="material-icons mr-2">person_add</span>
              회원가입
            </Link>
            <Link
              href="/post"
              className="inline-flex items-center px-8 py-4 rounded-full bg-white text-[#9C50D4] font-medium border-2 border-[#9C50D4] hover:bg-purple-50 transform hover:scale-105 transition-all duration-200"
            >
              <span className="material-icons mr-2">article</span>
              게시판 둘러보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
