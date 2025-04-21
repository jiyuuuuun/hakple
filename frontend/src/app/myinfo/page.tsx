'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRightIcon, PencilIcon, ChatBubbleLeftIcon, HeartIcon } from '@heroicons/react/24/outline'
import { UserIcon, LockClosedIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'

// 백엔드 DTO와 일치하는 MyInfo 타입
type MyInfo = {
    nickName: string
    phoneNum: string
    userName: string
    creationTime: string
    academyCode: string
    academyName?: string
    postCount?: number
    commentCount?: number
    likeCount?: number
}

// 날짜 형식 변환 함수 - LocalDateTime 처리
const formatDate = (dateString: string): string => {
    if (!dateString) return ''

    try {
        // ISO 형식 날짜 문자열이 아닌 경우 처리
        let date: Date
        if (dateString.includes('T')) {
            // LocalDateTime 형식 (예: 2023-04-18T12:34:56.789Z)
            date = new Date(dateString)
        } else if (dateString.includes('-')) {
            // 날짜만 있는 형식 (예: 2023-04-18)
            date = new Date(dateString)
        } else if (!isNaN(Number(dateString))) {
            // 타임스탬프 (숫자)인 경우
            date = new Date(Number(dateString))
        } else {
            // 다른 형식의 문자열
            const parts = dateString.split(/[\s\/\.-]/)
            if (parts.length >= 3) {
                // 년/월/일 순서로 가정
                date = new Date(
                    parseInt(parts[0]),
                    parseInt(parts[1]) - 1, // 월은 0부터 시작
                    parseInt(parts[2]),
                )
            } else {
                throw new Error('지원되지 않는 날짜 형식')
            }
        }

        // 유효한 날짜인지 확인
        if (isNaN(date.getTime())) {
            throw new Error('유효하지 않은 날짜')
        }

        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()

        return `${year}년 ${month}월 ${day}일`
    } catch (error) {
        console.error('날짜 형식 변환 오류:', error, '원본 날짜:', dateString)
        // 에러가 발생해도 원본 날짜 문자열을 반환
        return dateString
    }
}

// 학원 이름 찾기 함수 (학원 코드로부터)
const getAcademyNameFromCode = (code: string): string => {
    // 실제로는 학원 코드를 바탕으로 이름을 조회하는 로직이 필요
    // 현재는 임시로 코드를 그대로 사용
    return code || ''
}

export default function MyInfoPage() {
    const [userInfo, setUserInfo] = useState<MyInfo | null>(null)
    const [error, setError] = useState<string | null>(null)
    const { isLogin, loginMember } = useGlobalLoginMember()

    // 백엔드에서 가져온 데이터와 전역 상태의 데이터를 합친 최종 사용자 정보
    const combinedUserInfo = {
        nickName: userInfo?.nickName || loginMember.nickname,
        phoneNum: userInfo?.phoneNum || '',
        userName: userInfo?.userName || '',
        creationTime: formatDate(userInfo?.creationTime || loginMember.creationTime),
        academyCode: userInfo?.academyCode || '',
        academyName: userInfo?.academyName || getAcademyNameFromCode(userInfo?.academyCode || ''),
        postCount: userInfo?.postCount || 0,
        commentCount: userInfo?.commentCount || 0,
        likeCount: userInfo?.likeCount || 0,
    }

    useEffect(() => {
        if (!isLogin) {
            setError('로그인이 필요합니다.')
            return
        }

        console.log('마이인포 - 사용자 정보 요청 시작')
        // JWT 토큰에서 사용자 정보를 추출하므로 별도의 파라미터 없이 요청
        fetch('/api/v1/myInfos', {
            method: 'GET',
            credentials: 'include', // 쿠키(JWT)를 포함하여 요청
        })
            .then((res) => {
                console.log('마이인포 - 응답 상태:', res.status)
                if (!res.ok) {
                    throw new Error('사용자 정보를 불러오지 못했습니다.')
                }
                return res.json()
            })
            .then((data) => {
                console.log('마이인포 - 사용자 정보 데이터:', data)

                // 토큰에서 academyId 추출
                let academyIdFromToken = null;
                const token = localStorage.getItem('accessToken');
                
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        console.log('JWT 페이로드:', payload);
                        academyIdFromToken = payload.academyId;
                        console.log('토큰에서 추출한 아카데미 코드:', academyIdFromToken);
                    } catch (e) {
                        console.error('토큰 파싱 중 오류:', e);
                    }
                }

                // academyName 필드 추가 처리
                const userInfoData: MyInfo = {
                    ...data,
                    academyCode: data.academyCode || academyIdFromToken, // academyCode가 없으면 토큰에서 추출
                    academyName: getAcademyNameFromCode(data.academyCode || academyIdFromToken || ''),
                }

                setUserInfo(userInfoData)
            })
            .catch((err) => {
                console.error('마이인포 - 에러:', err)
                setError(err.message)
            })
    }, [isLogin])

    // 로그인되지 않은 경우 처리
    if (!isLogin) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                    <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
                    <p className="text-gray-600 mb-6">내 정보를 확인하려면 먼저 로그인해 주세요.</p>
                    <Link href="/login" className="w-full block py-3 bg-[#8C4FF2] text-white rounded-lg">
                        로그인 페이지로 이동
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div>
                <main className="max-w-screen-lg mx-auto pb-10 pt-6">
                    {error && (
                        <div className="mx-1 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                            <p>{error}</p>
                        </div>
                    )}

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
                            </div>
                            <div className="mt-6 text-left pl-1">
                                <h1 className="text-2xl font-semibold text-[#9C50D4]">{combinedUserInfo.nickName}</h1>
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
                                        <span className="text-gray-900">{combinedUserInfo.nickName}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">휴대폰번호</span>
                                        <span className="text-gray-900">
                                            {combinedUserInfo.phoneNum || '등록된 번호가 없습니다'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">아이디</span>
                                        <span className="text-gray-900">
                                            {combinedUserInfo.userName?.startsWith('kakao_')
                                                ? `(카카오) ${combinedUserInfo.userName.substring(6)}`
                                                : combinedUserInfo.userName || '정보를 불러올 수 없습니다'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">가입일</span>
                                        <span className="text-gray-900">
                                            {combinedUserInfo.creationTime || '정보를 불러올 수 없습니다'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">등록된 학원</span>
                                        <span className="text-gray-900">
                                            {combinedUserInfo.academyCode ? (
                                                <Link
                                                    href="/myinfo/academyRegister"
                                                    className="text-[#9C50D4] hover:underline"
                                                >
                                                    {combinedUserInfo.academyName || combinedUserInfo.academyCode}
                                                </Link>
                                            ) : (
                                                <Link
                                                    href="/myinfo/academyRegister"
                                                    className="text-[#9C50D4] hover:underline"
                                                >
                                                    학원 등록하러 가기
                                                </Link>
                                            )}
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
                                        <span className="text-gray-400 mr-2">{combinedUserInfo.postCount}개</span>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                </Link>

                                <Link href="/my-comments" className="flex items-center justify-between p-6">
                                    <div className="flex items-center">
                                        <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="text-gray-700">내가 쓴 댓글</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-gray-400 mr-2">{combinedUserInfo.commentCount}개</span>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                </Link>

                                <Link href="/favorites" className="flex items-center justify-between p-6">
                                    <div className="flex items-center">
                                        <HeartIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="text-gray-700">좋아요한 게시글</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-gray-400 mr-2">{combinedUserInfo.likeCount}개</span>
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
