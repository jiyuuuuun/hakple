'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function SignupSuccess() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9FE] px-4 pt-0">
            <div className="w-full max-w-[600px] bg-white rounded-3xl p-12 shadow-lg mt-[-180px]">
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="cursor-pointer">
                        <Image src="/logo.png" alt="Hakple 로고" width={120} height={120} className="mb-3" />
                    </Link>
                    <h1 className="text-3xl font-bold text-center mb-3">
                        <span className="text-[#9C50D4]">회원가입</span>
                        <span className="text-black">이 완료되었습니다!</span>
                    </h1>
                </div>

                {/* 체크 아이콘 */}
                <div className="flex justify-center mb-6">
                    <div className="bg-[#9C50D4] rounded-full p-4 w-20 h-20 flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* 서브 메시지 */}
                <p className="text-lg text-gray-700 text-center mb-8">
                    이제 학플의 모든 서비스를 이용하실 수 있습니다.
                </p>

                {/* 로그인 버튼 */}
                <Link
                    href="/login"
                    className="block w-full py-3 text-lg bg-[#9C50D4] text-white rounded-lg hover:bg-[#8a45bc] transition-colors mb-6 text-center font-medium"
                >
                    로그인하러 가기
                </Link>

                {/* 홈으로 가기 링크 */}
                <div className="text-center">
                    <Link href="/" className="text-base text-gray-600 hover:text-[#9C50D4]">
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    )
}
