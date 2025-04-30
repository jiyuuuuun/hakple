'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLoginMember } from '@/stores/auth/loginMember'

export default function Home() {
    // 타이핑 애니메이션을 위한 상태
    const [typedText, setTypedText] = useState('')
    const [currentTextIndex, setCurrentTextIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const texts = ['함께 성장하는', '함께 배우는', '함께 나누는', '함께 도전하는']
    const [typingSpeed, setTypingSpeed] = useState(150)

    // 로그인 상태를 useLoginMember 훅으로 가져옴
    const { isLogin } = useLoginMember()

    // 타이핑 효과 구현
    useEffect(() => {
        const typeText = () => {
            const currentText = texts[currentTextIndex]
            const shouldDelete = isDeleting ? typedText.length > 0 : typedText.length === currentText.length

            if (shouldDelete) {
                // 텍스트 삭제 중
                setIsDeleting(true)
                setTypingSpeed(50) // 삭제 속도 빠르게
                setTypedText(typedText.slice(0, -1))
            } else if (isDeleting && typedText.length === 0) {
                // 다음 텍스트로 이동
                setIsDeleting(false)
                setCurrentTextIndex((currentTextIndex + 1) % texts.length)
                setTypingSpeed(150)
            } else {
                // 텍스트 입력 중
                setTypedText(currentText.slice(0, typedText.length + 1))
            }
        }

        const timer = setTimeout(typeText, isDeleting ? typingSpeed / 2 : typingSpeed)
        return () => clearTimeout(timer)
    }, [typedText, currentTextIndex, isDeleting, typingSpeed, texts])

    return (
        <main className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-indigo-50">
            <style jsx global>{`
                @keyframes float {
                    0% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                    100% {
                        transform: translateY(0px);
                    }
                }

                @keyframes wave {
                    0% {
                        transform: translateX(0) translateZ(0) scaleY(1);
                    }
                    50% {
                        transform: translateX(-25%) translateZ(0) scaleY(0.85);
                    }
                    100% {
                        transform: translateX(-50%) translateZ(0) scaleY(1);
                    }
                }

                @keyframes spin-slow {
                    0% {
                        transform: translate(-50%, -50%) rotate(0deg);
                    }
                    100% {
                        transform: translate(-50%, -50%) rotate(360deg);
                    }
                }

                @keyframes blink {
                    0%,
                    100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0;
                    }
                }

                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }

                .animate-wave {
                    animation: wave 15s -3s linear infinite;
                }

                .animate-spin-slow {
                    animation: spin-slow 15s linear infinite;
                }

                .animate-blink {
                    animation: blink 1s step-end infinite;
                }

                /* 애니메이션 지연 클래스 추가 */
                .delay-500 {
                    animation-delay: 0.5s;
                }

                .delay-1000 {
                    animation-delay: 1s;
                }

                .delay-1500 {
                    animation-delay: 1.5s;
                }

                .delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>

            {/* 히어로 섹션 */}
            <section className="relative pt-20 pb-20 md:pt-28 md:pb-32 overflow-hidden">
                {/* 배경 효과 */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGM0LjQxOCAwIDgtMy41ODIgOC04cy0zLjU4Mi04LTgtOC04IDMuNTgyLTggOCAzLjU4MiA4IDggOHoiIHN0cm9rZT0iI0VERTlGRSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
                <div
                    className="absolute -bottom-32 -left-20 w-80 h-80 bg-indigo-200 rounded-full filter blur-3xl opacity-30 animate-pulse"
                    style={{ animationDelay: '2s' }}
                ></div>

                {/* 물결 효과 */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden">
                    <svg
                        className="relative block w-full h-[60px]"
                        data-name="Layer 1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1200 120"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                            className="fill-white/30 animate-wave"
                        ></path>
                    </svg>
                    <svg
                        className="relative block w-full h-[60px] -mt-[60px]"
                        data-name="Layer 2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1200 120"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                            className="fill-purple-200/50 animate-wave delay-2000"
                        ></path>
                    </svg>
                </div>

                {/* 중앙 장식 요소 */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-gradient-to-br from-purple-400/10 to-indigo-400/10 z-0 animate-spin-slow"></div>
                <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] md:w-[400px] md:h-[400px] rounded-full border-2 border-purple-300/20 z-0 animate-spin-slow"
                    style={{ animationDirection: 'reverse' }}
                ></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] md:w-[300px] md:h-[300px] rounded-full border border-indigo-300/30 z-0 animate-spin-slow"></div>

                {/* 부유하는 3D 오브젝트들 */}
                <div className="absolute top-[20%] left-[45%] z-10 hidden md:block">
                    <div className="relative w-12 h-12 animate-float">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-lg transform rotate-45"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                            <span className="material-icons">school</span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-[35%] right-[20%] z-10 hidden md:block">
                    <div className="relative w-10 h-10 animate-float delay-1000">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full shadow-lg"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                            <span className="material-icons text-sm">edit</span>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-[40%] left-[15%] z-10 hidden md:block">
                    <div className="relative w-14 h-14 animate-float delay-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg transform -rotate-12"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                            <span className="material-icons">menu_book</span>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1400px] mx-auto px-6 relative">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        {/* 왼쪽 콘텐츠 */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-block px-4 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-6 animate-bounce">
                                ✨ 새로운 학습 경험을 만나보세요
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-6 leading-tight">
                                학원생들을 위한
                                <br />
                                스마트 커뮤니티
                            </h1>
                            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                                HakPle와 <span className="text-purple-600 font-medium">{typedText}</span>
                                <span className="animate-blink">|</span> 특별한 공간입니다.
                                <br />
                                동료들과 함께 지식을 나누고, 경험을 공유하세요.
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                {isLogin ? (
                                    // 로그인된 사용자용 버튼
                                    <>
                                        <Link
                                            href="/post"
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-full bg-[#9C50D4] text-white font-medium hover:bg-purple-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-purple-300 group"
                                        >
                                            <span className="group-hover:scale-110 transition-transform">
                                                실시간 커뮤니티
                                            </span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                                />
                                            </svg>
                                        </Link>
                                        <Link
                                            href="/post?type=popular"
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-full bg-white text-[#9C50D4] font-medium border-2 border-[#9C50D4] hover:bg-purple-50 transform hover:scale-105 transition-all duration-200"
                                        >
                                            <span className="material-icons mr-2 text-[#9C50D4]">trending_up</span>
                                            인기 게시물
                                        </Link>
                                    </>
                                ) : (
                                    // 비로그인 사용자용 버튼
                                    <>
                                        <Link
                                            href="/signup"
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-full bg-[#9C50D4] text-white font-medium hover:bg-purple-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-purple-300 group"
                                        >
                                            <span className="group-hover:scale-110 transition-transform">
                                                지금 시작하기
                                            </span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                                />
                                            </svg>
                                        </Link>
                                        <Link
                                            href="/login"
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-full bg-white text-[#9C50D4] font-medium border-2 border-[#9C50D4] hover:bg-purple-50 transform hover:scale-105 transition-all duration-200"
                                        >
                                            로그인하기
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 오른쪽 콘텐츠 - 플로팅 카드 */}
                        <div className="relative flex-1 h-[350px] sm:h-[400px] md:h-[450px] mt-12 md:mt-0">
                            {/* 중앙 노트북/디바이스 이미지 */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px] bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-2xl z-30 rotate-12">
                                <div className="absolute inset-1 bg-white rounded-xl overflow-hidden flex flex-col animate-float">
                                    <div className="h-6 bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center px-2">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-gray-100 p-2 text-xs">
                                        <div className="h-2 bg-purple-200 rounded-full w-3/4 mb-1"></div>
                                        <div className="h-2 bg-purple-200 rounded-full w-1/2 mb-1"></div>
                                        <div className="h-2 bg-purple-200 rounded-full w-5/6 mb-3"></div>
                                        <div className="grid grid-cols-2 gap-1 mb-2">
                                            <div className="h-8 bg-white rounded"></div>
                                            <div className="h-8 bg-white rounded"></div>
                                        </div>
                                        <div className="h-10 bg-white rounded mb-2"></div>
                                        <div className="h-2 bg-purple-200 rounded-full w-2/3"></div>
                                    </div>
                                </div>
                            </div>

                            {/* 카드 1 */}
                            <div className="absolute top-0 left-[5%] sm:left-[10%] w-[240px] sm:w-[280px] bg-white rounded-2xl shadow-xl p-4 sm:p-6 transform -rotate-6 hover:rotate-0 transition-all duration-300 hover:scale-105 z-10 animate-float">
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center text-white text-xs shadow-lg">
                                    New
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                        <span className="material-icons text-[#9C50D4]">group_add</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                                            스터디 그룹 매칭
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500">관심사가 같은 친구 찾기</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex-shrink-0"></div>
                                    <div className="bg-blue-50 text-blue-800 p-2 rounded-lg text-xs">
                                        프론트엔드 스터디 모집 중 🖐️
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex-shrink-0"></div>
                                    <div className="bg-purple-50 text-purple-800 p-2 rounded-lg text-xs">
                                        같이 공부할 4명 모였어요!
                                    </div>
                                </div>
                            </div>

                            {/* 카드 2 */}
                            <div className="absolute top-[30%] right-[5%] w-[240px] sm:w-[280px] md:w-[300px] bg-white rounded-2xl shadow-xl p-4 sm:p-6 transform rotate-6 hover:rotate-0 transition-all duration-300 hover:scale-105 z-20 animate-float delay-500">
                                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <span className="material-icons text-indigo-600">forum</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                                            지식 공유 플랫폼
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500">경험과 노하우 공유</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 sm:h-3 bg-indigo-100 rounded-full w-2/3"></div>
                                    <div className="h-2 sm:h-3 bg-indigo-100 rounded-full w-4/5"></div>
                                    <div className="h-2 sm:h-3 bg-indigo-100 rounded-full w-3/4"></div>
                                </div>
                                <div className="mt-3 sm:mt-4 flex justify-between">
                                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                                        <span className="material-icons text-xs sm:text-sm">thumb_up</span>
                                        <span>28</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                                        <span className="material-icons text-xs sm:text-sm">comment</span>
                                        <span>14</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                                        <span className="material-icons text-xs sm:text-sm">visibility</span>
                                        <span>142</span>
                                    </div>
                                </div>
                            </div>

                            {/* 카드 3 */}
                            <div className="absolute bottom-0 left-[5%] sm:left-[15%] w-[240px] sm:w-[280px] bg-white rounded-2xl shadow-xl p-4 sm:p-6 transform rotate-3 hover:rotate-0 transition-all duration-300 hover:scale-105 z-30 animate-float delay-1000">
                                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                        <span className="material-icons text-amber-600">calendar_today</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                                            스마트 일정 관리
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500">체계적인 학습 계획</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {Array.from({ length: 7 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-5 sm:h-6 rounded ${
                                                i % 3 === 0 ? 'bg-amber-200' : 'bg-amber-100'
                                            } text-xs flex items-center justify-center ${
                                                i === 2 ? 'ring-2 ring-amber-400' : ''
                                            }`}
                                        >
                                            {i + 10}
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400"></div>
                                        <div className="h-2 bg-green-100 rounded-full flex-1"></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-amber-400"></div>
                                        <div className="h-2 bg-amber-100 rounded-full flex-1"></div>
                                    </div>
                                </div>
                            </div>

                            {/* 부유하는 아이콘들 */}
                            <div className="absolute top-[15%] left-[45%] w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center z-40 animate-float delay-1500 hidden md:flex">
                                <span className="material-icons text-purple-600">psychology</span>
                            </div>
                            <div className="absolute top-[60%] right-[25%] w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center z-40 animate-float delay-1500 hidden md:flex">
                                <span className="material-icons text-blue-600">lightbulb</span>
                            </div>
                            <div className="absolute bottom-[20%] right-[40%] w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center z-40 animate-float delay-2000 hidden md:flex">
                                <span className="material-icons text-amber-600">emoji_events</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 특징 섹션 */}
            <section className="py-20 bg-white">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-3">
                            특별한 기능
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">HakPle만의 특별한 기능</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            학생들의 실제 요구사항을 반영하여 개발된 편리한 기능들로 더 효율적인 학습 경험을 제공합니다.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* 특징 1 */}
                        <div className="group bg-white rounded-2xl p-8 text-center hover:bg-purple-50 transition-all duration-300 border border-gray-100 hover:border-purple-200 hover:shadow-xl">
                            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <span className="material-icons text-3xl text-[#9C50D4]">groups</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">학원별 커뮤니티</h3>
                            <p className="text-gray-600 leading-relaxed">
                                같은 학원 학생들과 소통하며
                                <br />
                                함께 성장할 수 있는 공간
                            </p>
                        </div>

                        {/* 특징 2 */}
                        <div className="group bg-white rounded-2xl p-8 text-center hover:bg-purple-50 transition-all duration-300 border border-gray-100 hover:border-purple-200 hover:shadow-xl">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <span className="material-icons text-3xl text-indigo-600">edit_note</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">지식 공유 게시판</h3>
                            <p className="text-gray-600 leading-relaxed">
                                학습 경험과 노하우를
                                <br />
                                자유롭게 공유하는 공간
                            </p>
                        </div>

                        {/* 특징 3 */}
                        <div className="group bg-white rounded-2xl p-8 text-center hover:bg-purple-50 transition-all duration-300 border border-gray-100 hover:border-purple-200 hover:shadow-xl">
                            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <span className="material-icons text-3xl text-amber-600">event_available</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">스마트 일정 관리</h3>
                            <p className="text-gray-600 leading-relaxed">
                                체계적인 학습 계획을
                                <br />
                                관리할 수 있는 캘린더
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA 섹션 */}
            <section className="py-20 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                <div className="max-w-[1000px] mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">지금 바로 HakPle과 함께하세요</h2>
                    <p className="text-lg text-purple-100 mb-12 leading-relaxed">
                        새로운 배움의 여정을 시작하고, 동료들과 함께 성장하세요.
                        <br />
                        HakPle이 여러분의 성공적인 학습을 응원합니다.
                    </p>

                    <div className="flex flex-wrap justify-center">
                        <Link
                            href="/signup"
                            className="inline-flex items-center px-8 py-4 rounded-full bg-white text-purple-600 font-medium hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
                        >
                            <span className="material-icons mr-2">person_add</span>
                            무료로 시작하기
                        </Link>
                    </div>

                    <div className="mt-12 pt-12 border-t border-purple-400/30 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-purple-200">© 2025 Hakple. All rights reserved.</p>
                        <div className="flex gap-4 text-sm">
                            <a href="#" className="text-purple-200 hover:text-white transition-colors">
                                이용약관
                            </a>
                            <a href="#" className="text-purple-200 hover:text-white transition-colors">
                                개인정보처리방침
                            </a>
                            <a href="/customer" className="text-purple-200 hover:text-white transition-colors">
                                고객센터
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
