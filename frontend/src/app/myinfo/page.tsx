'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
// import { useState, useEffect } from 'react'
import { ChevronRightIcon, PencilIcon, ChatBubbleLeftIcon, HeartIcon } from '@heroicons/react/24/outline'
import { UserIcon, LockClosedIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

export default function MyInfoPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div>
                <main className="max-w-screen-lg mx-auto pb-10 pt-6">
                    {/* 프로필 섹션 */}
                    <div className="relative h-56 bg-[#f2edf4] rounded-t-lg mt-4 mx-1">
                        <div className="absolute left-8 bottom-0 transform translate-y-[55%]">
                            <div className="relative">
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white bg-white">
                                    <Image
                                        src="/profile.png"
                                        alt="프로필 이미지"
                                        width={112}
                                        height={112}
                                        className="object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = 'https://via.placeholder.com/112?text=사용자'
                                        }}
                                    />
                                </div>
                                <button className="absolute bottom-0 right-0 bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                                    <UserIcon className="h-5 w-5 text-gray-600" />
                                </button>
                            </div>
                            <div className="mt-6 text-left pl-1">
                                <h1 className="text-2xl font-semibold text-[#9C50D4]">민수</h1>
                            </div>
                        </div>
                    </div>

                    {/* 흰색 배경 컨테이너 시작 */}
                    <div className="bg-white mx-1 rounded-b-2xl shadow-sm pb-6 mt-0 pt-20">
                        {/* 정보 섹션 - 그리드 레이아웃으로 변경 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mx-4 mt-6">
                            {/* 기본 정보 카드 */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 md:col-span-2">
                                <h2 className="text-lg font-medium text-gray-800 mb-5">기본 정보</h2>

                                <div className="space-y-5">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">닉네임</span>
                                        <span className="text-gray-900">민수</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">휴대폰번호</span>
                                        <span className="text-gray-900">01012345678</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">아이디</span>
                                        <span className="text-gray-900">(카카오) minsu123</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">가입일</span>
                                        <span className="text-gray-900">2023년 12월 1일</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">등록된 학원</span>
                                        <span className="text-gray-900">
                                            <Link
                                                href="/myinfo/academyRegister"
                                                className="text-[#9C50D4] hover:underline"
                                            >
                                                학원 등록하러 가기
                                            </Link>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 계정 설정 카드 */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-lg font-medium text-gray-800 p-6 pb-2">계정 설정</h2>

                                <div>
                                    <Link href="/myinfo/update" className="flex items-center justify-between p-6">
                                        <div className="flex items-center">
                                            <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                                            <span className="text-gray-700">프로필 수정</span>
                                        </div>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </Link>

                                    <Link href="/change-password" className="flex items-center justify-between p-6">
                                        <div className="flex items-center">
                                            <LockClosedIcon className="h-5 w-5 text-gray-400 mr-3" />
                                            <span className="text-gray-700">비밀번호 변경</span>
                                        </div>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </Link>

                                    <Link href="/myinfo/withdraw" className="flex items-center justify-between p-6">
                                        <div className="flex items-center">
                                            <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-3" />
                                            <span className="text-red-500">회원 탈퇴</span>
                                        </div>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* 최근 활동 카드 */}
                        <div className="mx-4 mt-6 bg-white rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-medium text-gray-800 p-6 pb-2">최근 활동</h2>

                            <div>
                                <Link href="/my-posts" className="flex items-center justify-between p-6">
                                    <div className="flex items-center">
                                        <PencilIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="text-gray-700">내가 쓴 게시글</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-gray-400 mr-2">12개</span>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                </Link>

                                <Link href="/my-comments" className="flex items-center justify-between p-6">
                                    <div className="flex items-center">
                                        <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="text-gray-700">내가 쓴 댓글</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-gray-400 mr-2">36개</span>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                </Link>

                                <Link href="/favorites" className="flex items-center justify-between p-6">
                                    <div className="flex items-center">
                                        <HeartIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="text-gray-700">좋아요한 게시글</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-gray-400 mr-2">24개</span>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
