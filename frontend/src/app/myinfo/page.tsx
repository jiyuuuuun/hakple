'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRightIcon, PencilIcon, ChatBubbleLeftIcon, HeartIcon } from '@heroicons/react/24/outline'
import { UserIcon, LockClosedIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { fetchApi } from '@/utils/api'

// 백엔드 DTO와 일치하는 MyInfo 타입
type MyInfo = {
    nickName: string
    phoneNum: string
    userName: string
    creationTime: string
    academyCode: string
    academyName?: string
    profileImageUrl?: string
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
        console.log('날짜 형식 변환 오류:', error, '원본 날짜:', dateString)
        // 에러가 발생해도 원본 날짜 문자열을 반환
        return dateString
    }
}

// 학원 이름 찾기 함수 (학원 코드로부터)
const getAcademyNameFromCode = (code: string): string => {
    if (typeof window !== 'undefined') {
        // 로컬 스토리지에서 학원 이름 확인 (academyRegister 페이지에서 저장한 값)
        const storedAcademyName = localStorage.getItem('academyName')
        if (storedAcademyName) {
            return storedAcademyName
        }
    }
    // 코드가 있지만 이름이 없는 경우 '등록된 학원'으로 표시
    return code ? '등록된 학원' : ''
}

// 휴대폰 번호 형식화 함수 (하이픈 추가)
const formatPhoneNumber = (phoneNum: string): string => {
    if (!phoneNum) return ''

    // 이미 하이픈이 있는 경우 일단 제거
    const digitsOnly = phoneNum.replace(/-/g, '')

    // 길이에 따라 다른 형식 적용
    if (digitsOnly.length === 11) {
        // 010-1234-5678 형식
        return digitsOnly.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
    } else if (digitsOnly.length === 10) {
        // 010-123-4567 형식 또는 02-1234-5678 형식
        if (digitsOnly.startsWith('02')) {
            return digitsOnly.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3')
        }
        return digitsOnly.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    } else {
        // 그 외의 경우 원본 반환
        return phoneNum
    }
}

// AcademyInfo 컴포넌트 - 등록된 학원 정보 표시
const AcademyInfo = ({ academyCode, academyName }: { academyCode: string; academyName: string }) => {
    return (
        <div className="flex justify-between">
            <span className="text-gray-500">등록된 학원</span>
            <span className="text-gray-900">
                {academyCode ? (
                    <Link href="/myinfo/academyRegister" className="text-[#9C50D4] hover:underline">
                        {academyName}
                    </Link>
                ) : (
                    <Link href="/myinfo/academyRegister" className="text-[#9C50D4] hover:underline">
                        학원 등록하러 가기
                    </Link>
                )}
            </span>
        </div>
    )
}

// RecentActivity 컴포넌트 - 최근 활동 카드
const RecentActivity = ({
    postCount = 0,
    commentCount = 0,
    likeCount = 0,
}: {
    postCount?: number
    commentCount?: number
    likeCount?: number
}) => {
    return (
        <div className="mx-4 mt-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium text-gray-800 p-6 pb-2">최근 활동</h2>

            <div>
                <Link href="/my-posts" className="flex items-center justify-between p-6">
                    <div className="flex items-center">
                        <PencilIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-700">내가 쓴 게시글</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-400 mr-2">{postCount}개</span>
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    </div>
                </Link>

                <Link href="/my-comments" className="flex items-center justify-between p-6">
                    <div className="flex items-center">
                        <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-700">내가 쓴 댓글</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-400 mr-2">{commentCount}개</span>
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    </div>
                </Link>

                <Link href="/my-likes" className="flex items-center justify-between p-6">
                    <div className="flex items-center">
                        <HeartIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-700">좋아요한 게시글</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-400 mr-2">{likeCount}개</span>
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    </div>
                </Link>
            </div>
        </div>
    )
}

export default function MyInfoPage() {
    const [userInfo, setUserInfo] = useState<MyInfo | null>(null)
    const [error, setError] = useState<string | null>(null)
    const { isLogin, loginMember } = useGlobalLoginMember()
    const [isAdmin, setIsAdmin] = useState(false)
    const [adminChecking, setAdminChecking] = useState(true) // 관리자 권한 확인 중 로딩 상태
    const [postCount, setPostCount] = useState(0)
    const [commentCount, setCommentCount] = useState(0)
    const [likeCount, setLikeCount] = useState(0)
    const [countLoading, setCountLoading] = useState(true)

    // API 기본 URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

    // 백엔드에서 가져온 데이터와 전역 상태의 데이터를 합친 최종 사용자 정보
    const combinedUserInfo = {
        nickName: userInfo?.nickName || loginMember.nickname,
        phoneNum: userInfo?.phoneNum || '',
        userName: userInfo?.userName || '',
        creationTime: formatDate(userInfo?.creationTime || loginMember.creationTime),
        academyCode: userInfo?.academyCode || '',
        academyName: userInfo?.academyName || getAcademyNameFromCode(userInfo?.academyCode || ''),
        postCount: postCount,
        commentCount: commentCount,
        likeCount: likeCount,
        profileImageUrl: userInfo?.profileImageUrl || loginMember.profileImageUrl || '',
    }

    // 카운트 데이터 가져오기 공통 함수
    const fetchCount = async (endpoint: string, setter: (count: number) => void) => {
        try {
            const response = await fetchApi(`${endpoint}?page=0&size=1`, {
                method: 'GET',
            })

            if (response.ok) {
                const data = await response.json()
                setter(data?.totalElements || 0)
            }
        } catch (error) {
            console.error(`${endpoint} 조회 오류:`, error)
        }
    }

    // 모든 카운트 정보 가져오기
    const fetchAllCounts = async () => {
        setCountLoading(true)
        try {
            await Promise.all([
                fetchCount('/api/v1/posts/my', setPostCount),
                fetchCount('/api/v1/comments/my', setCommentCount),
                fetchCount('/api/v1/posts/my/likes', setLikeCount),
            ])
        } catch (error) {
            console.error('카운트 정보 조회 오류:', error)
        } finally {
            setCountLoading(false)
        }
    }

    useEffect(() => {
        if (!isLogin) {
            setError('로그인이 필요합니다.')
            setAdminChecking(false)
            return
        }

        // 관리자 권한 확인
        const checkAdminPermission = async () => {
            setAdminChecking(true)
            try {
                // const accessToken = localStorage.getItem('accessToken')

                // if (!accessToken) {
                //     setIsAdmin(false)
                //     setAdminChecking(false)
                //     return
                // }

                // 네트워크 타임아웃 설정 (5초)
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 5000)

                try {
                    // fetchApi 유틸리티 함수 사용으로 변경
                    const response = await fetchApi('/api/v1/admin/check', {
                        method: 'GET',
                        signal: controller.signal,
                    })

                    clearTimeout(timeoutId) // 타임아웃 취소

                    // 인증 실패, 권한 없음, 기타 오류 상태 처리
                    if (!response.ok) {
                        console.log('서버 오류: 관리자 권한 확인 실패 (상태 코드:', response.status, ')')
                        setIsAdmin(false)
                        return
                    }

                    const isAdminResult = await response.json()
                    setIsAdmin(isAdminResult === true)
                } catch (fetchError: any) {
                    if (fetchError.name === 'AbortError') {
                        console.log('관리자 권한 확인 요청 타임아웃')
                    } else {
                        console.log('네트워크 오류:', fetchError)
                    }
                    setIsAdmin(false)
                }
            } catch (error) {
                console.log('관리자 권한 확인 중 예상치 못한 오류:', error)
                setIsAdmin(false)
            } finally {
                setAdminChecking(false)
            }
        }

        checkAdminPermission()

        // 로컬 스토리지에서 학원 정보 확인
        let storedAcademyName = ''
        let storedAcademyCode = ''
        if (typeof window !== 'undefined') {
            storedAcademyName = localStorage.getItem('academyName') || ''
            storedAcademyCode = localStorage.getItem('academyCode') || ''
        }

        // fetch 대신 fetchApi 사용
        fetchApi('/api/v1/myInfos', {
            method: 'GET',
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error('사용자 정보를 불러오지 못했습니다.')
                }
                return res.json()
            })
            .then((data) => {
                // 백엔드에서 받은 학원 정보 처리
                let finalAcademyName = storedAcademyName
                let finalAcademyCode = storedAcademyCode

                // 학원 정보 처리
                if (data.academyCode) {
                    // 백엔드에 학원 코드가 있는 경우
                    finalAcademyCode = data.academyCode

                    // 학원 이름 결정 로직
                    finalAcademyName =
                        data.academyName ||
                        (storedAcademyName && storedAcademyCode === data.academyCode
                            ? storedAcademyName
                            : getAcademyNameFromCode(data.academyCode))

                    // 토큰에서 추가 정보 확인 (백업)
                    // const token = localStorage.getItem('accessToken')
                    // if (token) {
                    //     try {
                    //         const payload = JSON.parse(atob(token.split('.')[1]))
                    //         const academyIdFromToken =
                    //             payload.academyId || payload.academyCode || payload.academy_code || null

                    //         // 백엔드에 학원 코드가 없지만 토큰에는 있는 경우 토큰 값 사용
                    //         if (!finalAcademyCode && academyIdFromToken) {
                    //             finalAcademyCode = String(academyIdFromToken)
                    //             finalAcademyName = getAcademyNameFromCode(String(academyIdFromToken))
                    //         }
                    //     } catch (e) {
                    //         console.error('토큰 파싱 중 오류:', e)
                    //     }
                    // } catch (e) {
                    //     console.log('토큰 파싱 중 오류:', e);
                    // }

                    // 정보 업데이트
                    localStorage.setItem('academyCode', finalAcademyCode)
                    localStorage.setItem('academyName', finalAcademyName)
                } else if (storedAcademyCode) {
                    // 백엔드에 학원 정보가 없지만 로컬에 있는 경우 초기화
                    localStorage.removeItem('academyCode')
                    localStorage.removeItem('academyName')
                    finalAcademyCode = ''
                    finalAcademyName = ''
                }

                // 최종 사용자 정보 업데이트
                const userInfoData: MyInfo = {
                    ...data,
                    academyCode: finalAcademyCode,
                    academyName: finalAcademyName,
                }

                setUserInfo(userInfoData)

                // 게시글, 댓글, 좋아요 개수 가져오기
                fetchAllCounts()
            })
            .catch((err) => {
                console.log('myinfo - 에러:', err)
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

    // 관리자 권한 확인 중인 경우 로딩 표시
    if (adminChecking) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C4FF2]"></div>
                <p className="mt-4 text-gray-600">권한을 확인하는 중입니다...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div>
                <main className="max-w-4xl mx-auto pb-10 pt-6 px-4">
                    {error && (
                        <div className="mx-1 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md">
                            <p>{error}</p>
                        </div>
                    )}

                    {/* 프로필 섹션 */}
                    <div className="relative h-64 bg-[#F7F3FD] rounded-t-lg mt-4 shadow-sm overflow-hidden border border-gray-100">
                        <div className="absolute left-8 bottom-6 md:bottom-8">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white relative group shadow-sm">
                                    {combinedUserInfo.profileImageUrl ? (
                                        <div className="w-full h-full overflow-hidden">
                                            <Image
                                                src={combinedUserInfo.profileImageUrl}
                                                alt="프로필 이미지"
                                                width={128}
                                                height={128}
                                                className="object-cover w-full h-full"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.src = 'https://via.placeholder.com/128?text=사용자'
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-16 w-16 text-[#8a63d2]"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                    <Link
                                        href="/myinfo/profile-image"
                                        className="absolute bottom-1 right-1 bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-100 transition-colors"
                                        title="프로필 이미지 변경"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-[#8a63d2]"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                            <div className="mt-2 text-left pl-1">
                                <h1 className="text-2xl font-bold text-gray-800">{combinedUserInfo.nickName}</h1>
                                <p className="text-gray-500 text-sm mt-0.5">가입일: {combinedUserInfo.creationTime}</p>
                            </div>
                        </div>
                    </div>

                    {/* 흰색 배경 컨테이너 시작 - 프로필 섹션과 공백 없이 바로 연결 */}
                    <div className="bg-white rounded-b-lg shadow-sm pb-8 -mt-12 pt-16 border-t-0">
                        {/* 정보 섹션 - 그리드 레이아웃으로 변경 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mx-6 mt-6">
                            {/* 기본 정보 카드 */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 md:col-span-2">
                                <div className="flex items-center mb-4">
                                    <UserIcon className="h-5 w-5 text-[#8a63d2] mr-2" />
                                    <h2 className="text-lg font-medium text-gray-800">기본 정보</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-500">닉네임</span>
                                        <span className="text-gray-900 font-medium">{combinedUserInfo.nickName}</span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-500">휴대폰 번호</span>
                                        <span className="text-gray-900 font-medium">
                                            {combinedUserInfo.phoneNum
                                                ? formatPhoneNumber(combinedUserInfo.phoneNum)
                                                : '등록된 번호가 없습니다'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-500">아이디</span>
                                        <span className="text-gray-900 font-medium">
                                            {combinedUserInfo.userName?.startsWith('kakao_')
                                                ? `(카카오) ${combinedUserInfo.userName.substring(6)}`
                                                : combinedUserInfo.userName || '정보를 불러올 수 없습니다'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-500">가입일</span>
                                        <span className="text-gray-900 font-medium">
                                            {combinedUserInfo.creationTime || '정보를 불러올 수 없습니다'}
                                        </span>
                                    </div>

                                    {!isAdmin && (
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-500">등록된 학원</span>
                                            <span className="text-gray-900">
                                                {combinedUserInfo.academyCode ? (
                                                    <Link
                                                        href="/myinfo/academyRegister"
                                                        className="text-[#8a63d2] hover:text-[#6d4bb1] hover:underline"
                                                    >
                                                        {combinedUserInfo.academyName}
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        href="/myinfo/academyRegister"
                                                        className="text-[#8a63d2] hover:text-[#6d4bb1] hover:underline flex items-center"
                                                    >
                                                        학원 등록하기
                                                        <ChevronRightIcon className="h-4 w-4 ml-1 inline" />
                                                    </Link>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 계정 설정 카드 */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                                <div className="flex items-center p-6 pb-3">
                                    <LockClosedIcon className="h-5 w-5 text-[#8a63d2] mr-2" />
                                    <h2 className="text-lg font-medium text-gray-800">계정 설정</h2>
                                </div>

                                <div>
                                    <Link
                                        href="/myinfo/update"
                                        className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors rounded-lg mx-1"
                                    >
                                        <div className="flex items-center">
                                            <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                                            <span className="text-gray-700">프로필 수정</span>
                                        </div>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </Link>

                                    <Link
                                        href="/myinfo/password"
                                        className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors rounded-lg mx-1"
                                    >
                                        <div className="flex items-center">
                                            <LockClosedIcon className="h-5 w-5 text-gray-400 mr-3" />
                                            <span className="text-gray-700">비밀번호 변경</span>
                                        </div>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </Link>

                                    <Link
                                        href="/myinfo/withdraw"
                                        className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors rounded-lg mx-1"
                                    >
                                        <div className="flex items-center">
                                            <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-3" />
                                            <span className="text-red-500">회원 탈퇴</span>
                                        </div>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* 최근 활동 카드 - 관리자가 아닐 때만 표시 */}
                        {!isAdmin &&
                            (countLoading ? (
                                <div className="mx-6 mt-6 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center mb-4">
                                        <ChatBubbleLeftIcon className="h-5 w-5 text-[#8a63d2] mr-2" />
                                        <h2 className="text-lg font-medium text-gray-800">최근 활동</h2>
                                    </div>
                                    <div className="flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8a63d2]"></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mx-6 mt-6 bg-white rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-center p-6 pb-3">
                                        <ChatBubbleLeftIcon className="h-5 w-5 text-[#8a63d2] mr-2" />
                                        <h2 className="text-lg font-medium text-gray-800">최근 활동</h2>
                                    </div>

                                    <div>
                                        <Link
                                            href="/my-posts"
                                            className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors rounded-lg mx-1"
                                        >
                                            <div className="flex items-center">
                                                <PencilIcon className="h-5 w-5 text-gray-500 mr-3" />
                                                <span className="text-gray-700">내가 작성한 게시글</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-[#8a63d2] font-medium mr-2">{postCount}개</span>
                                                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </Link>

                                        <Link
                                            href="/my-comments"
                                            className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors rounded-lg mx-1"
                                        >
                                            <div className="flex items-center">
                                                <ChatBubbleLeftIcon className="h-5 w-5 text-gray-500 mr-3" />
                                                <span className="text-gray-700">내가 작성한 댓글</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-[#8a63d2] font-medium mr-2">
                                                    {commentCount}개
                                                </span>
                                                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </Link>

                                        <Link
                                            href="/my-likes"
                                            className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors rounded-lg mx-1"
                                        >
                                            <div className="flex items-center">
                                                <HeartIcon className="h-5 w-5 text-gray-500 mr-3" />
                                                <span className="text-gray-700">내가 좋아요한 게시글</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-[#8a63d2] font-medium mr-2">{likeCount}개</span>
                                                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                    </div>
                </main>
            </div>
        </div>
    )
}
