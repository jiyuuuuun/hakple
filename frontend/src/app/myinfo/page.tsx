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

// 로컬 스토리지에서 사용자 정보 가져오기 함수
const getUserFromLocalStorage = () => {
    if (typeof window === 'undefined') return null // 서버 사이드에서 실행 시

    try {
        const token = localStorage.getItem('token')
        const userName = localStorage.getItem('userName')

        console.log('로컬 스토리지 확인:', { token: !!token, userName })

        if (token && userName) {
            return { token, userName }
        }
    } catch (error) {
        console.error('로컬 스토리지 접근 오류:', error)
    }

    return null
}

export default function MyInfoPage() {
    const router = useRouter()
    const [userInfo, setUserInfo] = useState<MyInfoResponseDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [loggedInUserName, setLoggedInUserName] = useState<string | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

    // 로그인한 사용자 정보 가져오기
    useEffect(() => {
        const checkLoginStatus = () => {
            const user = getUserFromLocalStorage()

            if (user && user.userName) {
                console.log('로그인된 사용자 찾음:', user.userName)
                setIsLoggedIn(true)
                setLoggedInUserName(user.userName)
                return true
            } else {
                console.log('로그인된 사용자 없음')
                setIsLoggedIn(false)
                setLoggedInUserName(null)
                return false
            }
        }

        // 페이지 로드 시 즉시 로그인 상태 확인
        const isUserLoggedIn = checkLoginStatus()

        // 로그인되지 않은 경우 리다이렉트
        if (!isUserLoggedIn) {
            console.log('로그인이 필요합니다. 로그인 페이지로 이동합니다.')
            router.push('/login')
        }

        // 하드코딩된 사용자 정보 (개발 환경용)
        // 참고: 실제 환경에서는 이 부분을 제거해야 합니다!
        if (process.env.NODE_ENV === 'development' && !isUserLoggedIn) {
            console.log('개발 환경: 테스트 사용자로 자동 로그인')
            // 개발 환경에서만 자동 로그인 상태 설정
            setIsLoggedIn(true)
            setLoggedInUserName('testuser')

            // 개발용 로컬 스토리지에 테스트 데이터 저장
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', 'test-token')
                localStorage.setItem('userName', 'testuser')
            }
        }

        // 로컬 스토리지 변경 이벤트 감지
        const handleStorageChange = () => {
            checkLoginStatus()
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [router])

    // API에서 사용자 정보 가져오기
    useEffect(() => {
        // 로그인한 사용자 정보가 있을 때만 API 호출
        if (!loggedInUserName) return

        const fetchUserInfo = async () => {
            try {
                console.log('API 호출 시도:', `${API_BASE_URL}/api/v1/myInfos?userName=${loggedInUserName}`)

                // 토큰 가져오기
                const token = localStorage.getItem('token')
                if (!token) {
                    throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.')
                }

                // 실제 API 호출을 시도
                try {
                    // 로그인한 사용자의 userName을 쿼리 스트링으로 전달
                    const response = await fetch(`${API_BASE_URL}/api/v1/myInfos?userName=${loggedInUserName}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`, // JWT 토큰을 헤더에 포함
                        },
                    })

                    if (!response.ok) {
                        console.error('API 응답 오류:', response.status)

                        // 401 Unauthorized 또는 403 Forbidden인 경우 토큰 문제일 수 있음
                        if (response.status === 401 || response.status === 403) {
                            // 로컬 스토리지에서 로그인 정보 제거
                            localStorage.removeItem('token')
                            localStorage.removeItem('userName')
                            throw new Error('인증에 실패했습니다. 다시 로그인해주세요.')
                        }

                        throw new Error(`API 오류: ${response.status}`)
                    }

                    const data = await response.json()
                    console.log('API 응답 데이터:', data)
                    setUserInfo(data)
                    setLoading(false)
                    return // 성공하면 함수 종료
                } catch (fetchError) {
                    console.error('API 호출 실패:', fetchError)

                    // API 호출 실패 시 개발 모드에서는 더미 데이터 사용
                    if (process.env.NODE_ENV === 'development') {
                        console.log('개발 환경: API 호출 실패로 더미 데이터 사용')
                        setUserInfo({
                            nickName: loggedInUserName,
                            phoneNum: '01012345678',
                            userName: loggedInUserName,
                            creationTime: new Date().toISOString(),
                            academyId: null,
                            academyName: null,
                            postCount: 0,
                            commentCount: 0,
                            likeCount: 0,
                        })
                        setLoading(false)
                    } else {
                        throw fetchError // 실제 환경에서는 오류 전달
                    }
                }
            } catch (err) {
                console.error('전체 처리 오류:', err)
                setError('사용자 정보를 불러오는데 실패했습니다. 다시 로그인해주세요.')
                setLoading(false)

                // 오류 발생 시 3초 후 로그인 페이지로 리다이렉트
                setTimeout(() => {
                    // 로컬 스토리지 초기화
                    localStorage.removeItem('token')
                    localStorage.removeItem('userName')
                    router.push('/login')
                }, 3000)
            }
        }

        fetchUserInfo()
    }, [loggedInUserName, router])

    // 날짜 포맷 함수
    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString)
            return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
        } catch (err) {
            return dateString
        }
    }

    // 로그아웃 처리
    const handleLogout = () => {
        // 로그아웃 시 로컬 스토리지 초기화
        localStorage.removeItem('token')
        localStorage.removeItem('userName')
        setIsLoggedIn(false)
        setLoggedInUserName(null)

        // 로그인 페이지로 리다이렉트
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">정보를 불러오는 중...</div>
            </div>
        )
    }

    // 로그인이 안 되어 있을 때는 내용 표시하지 않음 (리다이렉트 처리 전에 잠시 보일 수 있음)
    if (!isLoggedIn || !userInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">로그인이 필요합니다. 로그인 페이지로 이동합니다...</div>
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
