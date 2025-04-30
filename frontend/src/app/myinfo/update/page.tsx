'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import Link from 'next/link'
import { ArrowLeftIcon, UserIcon, CheckCircleIcon, CheckIcon, CameraIcon, KeyIcon } from '@heroicons/react/24/outline'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { fetchApi } from '@/utils/api'

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

// 백엔드 응답 타입 정의
type ResponseDTO = {
    message: string
}

export default function ProfileUpdatePage() {
    const router = useRouter()
    const { isLogin, loginMember } = useGlobalLoginMember()
    const [currentNickname, setCurrentNickname] = useState('')
    const [nickname, setNickname] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [newPhoneNumber, setNewPhoneNumber] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [nicknameError, setNicknameError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [isFormValid, setIsFormValid] = useState(false)
    const [isPhoneChecked, setIsPhoneChecked] = useState(false)
    const [isKakaoUser, setIsKakaoUser] = useState(false)
    const [formattedPhone, setFormattedPhone] = useState('')
    const [originalNickname, setOriginalNickname] = useState('')
    const [originalPhoneNumber, setOriginalPhoneNumber] = useState('')
    const [loadingUser, setLoadingUser] = useState(true)

    // 로그인 체크
    useEffect(() => {
        if (!isLogin) {
            router.push('/login')
        }
    }, [isLogin, router])

    // 컴포넌트 마운트 시 서버에서 사용자 정보를 가져오기
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {

                const response = await fetchApi('/api/v1/myInfos', {
                    method: 'GET',
                })


                if (!response.ok) {
                    throw new Error('사용자 정보를 불러오지 못했습니다.')
                }

                const data = await response.json()


                setCurrentNickname(data.nickName)
                setPhoneNumber(data.phoneNum)

                // 카카오 소셜 로그인 사용자 확인
                if (
                    (data.userName && data.userName.startsWith('kakao_')) ||
                    (data.phoneNum && data.phoneNum.startsWith('KA'))
                ) {
                    setIsKakaoUser(true)
                }

                // 원래 값은 중복 체크가 필요없음
                setOriginalNickname(data.nickName)
                setOriginalPhoneNumber(data.phoneNum)
                setFormattedPhone(formatPhoneNumber(data.phoneNum))
            } catch (err) {
                console.error('사용자 정보를 가져오는 중 오류 발생:', err)
                setError('사용자 정보를 불러올 수 없습니다.')
            } finally {
                setLoadingUser(false)
            }
        }

        if (isLogin) {
            fetchUserInfo()
        }
    }, [isLogin])

    // 폼 유효성 검사
    useEffect(() => {
        console.log('폼 유효성 검사:', {
            nickname,
            newPhoneNumber,
            nicknameError,
            phoneError,
            isPhoneChecked,
        })

        // 둘 다 빈 경우
        if (nickname === '' && newPhoneNumber === '') {
            setIsFormValid(false)
            return
        }

        // 닉네임 입력한 경우
        if (nickname !== '') {
            if (nicknameError !== '' && !nicknameError.includes('사용 가능')) {
                setIsFormValid(false)
                return
            }
        }

        // 휴대폰 번호 입력한 경우
        if (newPhoneNumber !== '') {
            if (!isPhoneChecked || (phoneError !== '' && !phoneError.includes('사용 가능'))) {
                setIsFormValid(false)
                return
            }
        }

        // 모든 검사 통과
        setIsFormValid(true)

    }, [nickname, newPhoneNumber, nicknameError, phoneError, isPhoneChecked])

    // 닉네임 유효성 검사
    const validateNickname = (value: string): boolean => {
        // 비어있는지 검사
        if (!value || value.trim() === '') {
            setNicknameError('닉네임을 입력해주세요.')
            return false
        }

        // 현재 닉네임과 같은지 검사
        if (value === currentNickname) {
            setNicknameError('현재 닉네임과 같습니다.')
            return false
        }

        // 정규식 패턴 검사 - 2-20자, 영문, 한글, 숫자, 특수문자(_.-) 허용
        const nicknameRegex = /^[a-zA-Z가-힣0-9_.-]{2,20}$/
        if (!nicknameRegex.test(value)) {
            setNicknameError('닉네임은 2-20자의 영문, 한글, 숫자와 특수문자(_.-) 조합이어야 합니다.')
            return false
        }

        setNicknameError('')
        return true
    }

    // 휴대폰 번호 유효성 검사
    const validatePhoneNumber = (value: string): boolean => {
        // 비어있는지 검사
        if (!value || value.trim() === '') {
            setPhoneError('휴대폰 번호를 입력해주세요.')
            return false
        }

        // 현재 번호와 같은지 검사
        if (value === phoneNumber) {
            setPhoneError('현재 휴대폰 번호와 같습니다.')
            return false
        }

        // 하이픈 제거
        const digitsOnly = value.replace(/-/g, '')

        // 숫자만 있는지 검사
        if (!/^\d+$/.test(digitsOnly)) {
            setPhoneError('휴대폰 번호는 숫자만 입력 가능합니다.')
            return false
        }

        // 길이 검사
        if (digitsOnly.length < 10 || digitsOnly.length > 11) {
            setPhoneError('휴대폰 번호는 10-11자리 숫자여야 합니다.')
            return false
        }

        setPhoneError('')
        return true
    }

    // 휴대폰 번호 중복 확인
    const checkPhoneDuplicate = async () => {

        if (!validatePhoneNumber(newPhoneNumber)) {
            return
        }

        setIsLoading(true)

        try {
            // 현재 번호와 다른지 확인
            if (newPhoneNumber.replace(/-/g, '') === originalPhoneNumber.replace(/-/g, '')) {
                setPhoneError('현재 사용 중인, 번호와 동일합니다.')
                setIsPhoneChecked(true)

                setIsLoading(false)
                return
            }

            // 백엔드에 실제 API 요청

            const response = await fetchApi(
                `/api/v1/users/check-phonenum?phoneNum=${newPhoneNumber.replace(/-/g, '')}`,
                {
                    method: 'GET',
                },
            )

            // 응답 처리
            if (response.ok) {
                const available = await response.json()
                if (available) {
                    setPhoneError('사용 가능한 휴대폰 번호입니다.')
                    setIsPhoneChecked(true)

                } else {
                    setPhoneError('이미 사용 중인 휴대폰 번호입니다.')
                    setIsPhoneChecked(false)

                }
            } else {
                // 에러 응답 분석
                const errorText = await response.text()

                setPhoneError('휴대폰 번호 중복 확인에 실패했습니다.')
                setIsPhoneChecked(false)
            }
        } catch (err) {
            console.error('휴대폰 번호 중복 확인 중 오류 발생:', err)
            setPhoneError('중복 확인 중 오류가 발생했습니다.')
            setIsPhoneChecked(false)
        } finally {
            setIsLoading(false)
        }
    }

    // 닉네임 입력 핸들러
    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const inputValue = e.target.value
        setNickname(inputValue)

        // 유효성 검사 수행
        validateNickname(inputValue)
    }

    // 휴대폰 번호 입력 핸들러
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const inputValue = e.target.value
        // 유저가 입력한 값을 그대로 저장 (하이픈 포함)
        setNewPhoneNumber(inputValue)

        // 입력 시 중복 확인 필요
        setIsPhoneChecked(false)

        // 유효성 검사 수행
        validatePhoneNumber(inputValue)

        // 입력값 형식화
        if (inputValue) {
            // 하이픈 제거 후 다시 포맷팅
            const digitsOnly = inputValue.replace(/-/g, '')
            setFormattedPhone(formatPhoneNumber(digitsOnly))
        } else {
            setFormattedPhone('')
        }
    }

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            // 변경할 데이터 준비
            const updateData: { nickName?: string; phoneNum?: string } = {}

            // 변경할 닉네임이 있는 경우
            if (nickname && nickname !== currentNickname) {
                updateData.nickName = nickname
            }

            // 변경할 휴대폰 번호가 있는 경우 (하이픈 제거)
            if (newPhoneNumber && newPhoneNumber.replace(/-/g, '') !== phoneNumber) {
                updateData.phoneNum = newPhoneNumber.replace(/-/g, '')
            }

            // 변경할 내용이 없는 경우
            if (Object.keys(updateData).length === 0) {
                toast.info('변경할 내용이 없습니다.')
                setIsLoading(false)
                return
            }


            // 백엔드에 업데이트 요청
            const response = await fetchApi('/api/v1/myInfos/update', {
                method: 'PATCH',
                body: JSON.stringify(updateData),
            })


            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`프로필 업데이트 실패: ${errorText}`)
            }

            // 성공 시 처리
            try {
                // 응답 형식 확인 후 처리
                const contentType = response.headers.get('content-type')
                let result

                if (contentType && contentType.includes('application/json')) {
                    // JSON 응답인 경우
                    result = await response.json()
 
                } else {
                    // 텍스트 응답인 경우
                    const textResponse = await response.text()

                    result = { message: textResponse }
                }

                // 성공 메시지 표시
                toast.success('프로필 정보가 업데이트되었습니다')

                // 마이페이지로 이동
                setTimeout(() => {
                    router.push('/myinfo')
                }, 1500)
            } catch (parseError) {
                console.error('응답 파싱 중 오류:', parseError)
                // 파싱 오류가 발생해도 업데이트는 성공한 것으로 처리
                toast.success('프로필 정보가 업데이트되었습니다')

                setTimeout(() => {
                    router.push('/myinfo')
                }, 1500)
            }
        } catch (err) {
            console.error('프로필 업데이트 중 오류 발생:', err)
            setError(err instanceof Error ? err.message : '프로필 업데이트 중 오류가 발생했습니다')
            toast.error('프로필 업데이트에 실패했습니다')
        } finally {
            setIsLoading(false)
        }
    }

    // 로딩 중 표시
    if (loadingUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <ToastContainer position="top-center" />
            <div className="max-w-2xl mx-auto">
                {/* 뒤로가기 버튼 */}
                <div className="mb-8">
                    <Link
                        href="/myinfo"
                        className="inline-flex items-center text-gray-600 hover:text-[#9C50D4] transition-colors text-lg"
                    >
                        <ArrowLeftIcon className="h-6 w-6 mr-2" />
                        <span>내 정보로 돌아가기</span>
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    {/* 헤더 부분 */}
                    <div className="bg-[#F7F3FD] px-8 py-6 border-b border-gray-100">
                        <div className="flex items-center">
                            <UserIcon className="h-9 w-9 text-[#9C50D4] mr-4" />
                            <h1 className="text-2xl font-bold text-gray-800">프로필 정보 수정</h1>
                        </div>
                        <p className="text-gray-600 mt-3 text-lg">닉네임과 휴대폰 번호를 변경할 수 있습니다.</p>
                    </div>

                    {/* 컨텐츠 부분 */}
                    <div className="p-8">
                        {/* 프로필 이미지 및 비밀번호 변경 링크 */}
                        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-50 p-6 rounded-xl">
                            <div className="flex items-center mb-4 md:mb-0">
                                <div className="flex-shrink-0 mr-6">
                                    <CameraIcon className="h-10 w-10 text-[#9C50D4]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800">프로필 이미지</h3>
                                    <p className="text-gray-600 mt-1">프로필 이미지를 변경하거나 업로드합니다.</p>
                                </div>
                            </div>
                            <Link
                                href="/myinfo/profile-image"
                                className="px-5 py-2.5 bg-white text-[#9C50D4] rounded-lg hover:bg-gray-50 transition-colors font-medium text-base md:text-lg flex items-center"
                            >
                                사진 변경
                            </Link>
                        </div>

                        {/* 알림 메시지 */}
                        {error && (
                            <div className="mb-8 bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                                <div className="flex items-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6 text-red-500 mr-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <p className="text-base text-red-600">{error}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-8">
                                {/* 닉네임 필드 */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label htmlFor="nickname" className="block text-lg font-medium text-gray-700">
                                            닉네임
                                        </label>
                                        <span className="text-sm text-gray-500">현재: {currentNickname}</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="nickname"
                                            name="nickname"
                                            placeholder="변경할 닉네임 입력"
                                            className={`w-full px-5 py-4 border text-lg ${
                                                nicknameError && !nicknameError.includes('사용 가능')
                                                    ? 'border-red-300 bg-red-50'
                                                    : nicknameError && nicknameError.includes('사용 가능')
                                                    ? 'border-green-300 bg-green-50'
                                                    : 'border-gray-300 bg-gray-50'
                                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent transition-colors`}
                                            value={nickname}
                                            onChange={handleNicknameChange}
                                            disabled={isLoading}
                                        />
                                        {nickname && nicknameError.includes('사용 가능') && (
                                            <CheckCircleIcon className="absolute right-4 top-4 h-6 w-6 text-green-500" />
                                        )}
                                    </div>
                                    {nicknameError && (
                                        <p
                                            className={`mt-3 text-base flex items-center ${
                                                nicknameError.includes('사용 가능') ? 'text-green-600' : 'text-red-600'
                                            }`}
                                        >
                                            {nicknameError.includes('사용 가능') ? (
                                                <CheckIcon className="h-5 w-5 mr-2 text-green-500" />
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 mr-2"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                    />
                                                </svg>
                                            )}
                                            {nicknameError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-sm text-gray-500">2~20자의 영문, 한글, 숫자</p>
                                </div>

                                {/* 휴대폰 번호 필드 */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label htmlFor="phone" className="block text-lg font-medium text-gray-700">
                                            휴대폰 번호
                                        </label>
                                        <span className="text-sm text-gray-500">
                                            현재: {phoneNumber ? formatPhoneNumber(phoneNumber) : '없음'}
                                        </span>
                                    </div>
                                    <div className="flex space-x-3">
                                        <div className="relative flex-1">
                                            <input
                                                type="tel"
                                                id="phone"
                                                placeholder="변경할 휴대폰 번호 입력"
                                                className={`w-full px-5 py-4 border text-lg ${
                                                    phoneError && !phoneError.includes('사용 가능')
                                                        ? 'border-red-300 bg-red-50'
                                                        : phoneError && phoneError.includes('사용 가능')
                                                        ? 'border-green-300 bg-green-50'
                                                        : 'border-gray-300 bg-gray-50'
                                                } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C50D4] focus:border-transparent transition-colors`}
                                                value={newPhoneNumber}
                                                onChange={handlePhoneChange}
                                                disabled={isKakaoUser}
                                            />
                                            {newPhoneNumber && phoneError.includes('사용 가능') && (
                                                <CheckCircleIcon className="absolute right-4 top-4 h-6 w-6 text-green-500" />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={checkPhoneDuplicate}
                                            disabled={!newPhoneNumber || isLoading || isKakaoUser}
                                            className="px-5 py-3 bg-[#F7F3FD] text-[#9C50D4] rounded-lg hover:bg-[#EFE6FC] transition-colors font-medium text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            중복확인
                                        </button>
                                    </div>
                                    {phoneError && (
                                        <p
                                            className={`mt-3 text-base flex items-center ${
                                                phoneError.includes('사용 가능') ? 'text-green-600' : 'text-red-600'
                                            }`}
                                        >
                                            {phoneError.includes('사용 가능') ? (
                                                <CheckIcon className="h-5 w-5 mr-2 text-green-500" />
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 mr-2"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                    />
                                                </svg>
                                            )}
                                            {phoneError}
                                        </p>
                                    )}
                                    {isKakaoUser && (
                                        <p className="mt-3 text-sm text-amber-600 flex items-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 mr-2"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            카카오 계정은 휴대폰 번호를 변경할 수 없습니다.
                                        </p>
                                    )}
                                    <p className="mt-2 text-sm text-gray-500">예: 010-1234-5678 (하이픈 자동 추가)</p>
                                </div>

                                {/* 제출 버튼 */}
                                <div className="pt-6">
                                    <div className="flex justify-end space-x-4">
                                        <button
                                            type="button"
                                            onClick={() => router.back()}
                                            className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors text-lg"
                                        >
                                            취소
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-3 bg-[#9C50D4] text-white rounded-lg hover:bg-[#8A45BC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9C50D4] transition-colors font-medium flex items-center justify-center min-w-[100px] text-lg"
                                            disabled={!isFormValid || isLoading}
                                        >
                                            {isLoading ? (
                                                <svg
                                                    className="animate-spin h-6 w-6 text-white"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                            ) : (
                                                '저장하기'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
