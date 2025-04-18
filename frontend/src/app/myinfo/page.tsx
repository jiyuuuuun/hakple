'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChevronRightIcon, PencilIcon, ChatBubbleLeftIcon, HeartIcon } from '@heroicons/react/24/outline'
import { UserIcon, LockClosedIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

// 응답 DTO 타입 정의
interface MyInfoResponseDto {
    nickName: string
    phoneNum: string
    userName: string
    creationTime: string
    academyId: string | null
    academyName: string | null
    postCount: number
    commentCount: number
    likeCount: number
}

// 백엔드 API 기본 URL (환경변수로 관리하는 것이 좋음)
const API_BASE_URL = 'http://localhost:8090'

export default function MyInfoPage() {
    const router = useRouter()
    const [userInfo, setUserInfo] = useState<MyInfoResponseDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // API에서 사용자 정보 가져오기
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                // 하드코딩된 사용자 이름 (임시 방식)
                const userName = 'user7'

                // TODO: 로그인 기능 구현 후에는 다음과 같이 쿠키/세션에서 사용자 정보를 가져와 사용해야 합니다.
                // const userName = getUserNameFromSession() 또는 JWT 토큰에서 추출

                // 실제 API 호출이 실패할 경우를 대비한 임시 데이터 처리
                // 백엔드 서버에 연결이 안 될 경우를 대비해 바로 더미 데이터 사용
                console.log('API 호출 시도:', `${API_BASE_URL}/api/v1/myInfos?userName=${userName}`)

                // 실제 API 호출을 시도하지만 실패해도 예외 처리
                try {
                    // userName 파라미터를 쿼리 스트링으로 전달
                    const response = await fetch(`${API_BASE_URL}/api/v1/myInfos?userName=${userName}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        // GET 요청에는 body를 사용할 수 없음
                        // credentials: 'include', // 쿠키 포함
                        // 타임아웃 설정
                        // signal: AbortSignal.timeout(5000), // 5초 타임아웃
                    })

                    if (!response.ok) {
                        throw new Error(`API 오류: ${response.status}`)
                    }

                    const data = await response.json()
                    console.log('API 응답 데이터:', data)
                    setUserInfo(data)
                    return // 성공하면 함수 종료
                } catch (fetchError) {
                    console.error('API 호출 실패:', fetchError)
                    // 실패 시 여기서 오류 로깅만 하고 아래 더미 데이터를 사용
                }

                // API 호출 실패 시 사용할 더미 데이터
                console.log('더미 데이터 사용')
                setUserInfo({
                    nickName: '민수',
                    phoneNum: '01012345678',
                    userName: 'minsu123',
                    creationTime: '2023-12-01T00:00:00',
                    academyId: null,
                    academyName: null,
                    postCount: 12,
                    commentCount: 36,
                    likeCount: 24,
                })
            } catch (err) {
                console.error('전체 처리 오류:', err)
                setError('사용자 정보를 불러오는데 실패했습니다.')
            } finally {
                setLoading(false)
            }
        }

        fetchUserInfo()
    }, [])

    // 프로필 수정 페이지로 이동
    // const handleProfileUpdate = () => {
    //     router.push('/myinfo/update')
    // }

    // 날짜 포맷 함수
    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString)
            return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
        } catch (err) {
            return dateString
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">정보를 불러오는 중...</div>
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
                                <h1 className="text-2xl font-semibold text-[#9C50D4]">{userInfo?.nickName}</h1>
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
                                        <span className="text-gray-900">{userInfo?.nickName}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">휴대폰번호</span>
                                        <span className="text-gray-900">{userInfo?.phoneNum}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">아이디</span>
                                        <span className="text-gray-900">
                                            {userInfo?.userName?.startsWith('kakao_')
                                                ? `(카카오) ${userInfo?.userName.substring(6)}`
                                                : userInfo?.userName}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">가입일</span>
                                        <span className="text-gray-900">
                                            {formatDate(userInfo?.creationTime || '')}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">등록된 학원</span>
                                        <span className="text-gray-900">
                                            {userInfo?.academyName || localStorage.getItem('academyName') ? (
                                                <Link
                                                    href="/myinfo/academyRegister"
                                                    className="text-[#9C50D4] hover:underline"
                                                >
                                                    {userInfo?.academyName || localStorage.getItem('academyName')}
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
                                        <span className="text-gray-400 mr-2">{userInfo?.postCount || 0}개</span>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                </Link>

                                <Link href="/my-comments" className="flex items-center justify-between p-6">
                                    <div className="flex items-center">
                                        <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="text-gray-700">내가 쓴 댓글</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-gray-400 mr-2">{userInfo?.commentCount || 0}개</span>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                </Link>

                                <Link href="/favorites" className="flex items-center justify-between p-6">
                                    <div className="flex items-center">
                                        <HeartIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="text-gray-700">좋아요한 게시글</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-gray-400 mr-2">{userInfo?.likeCount || 0}개</span>
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
