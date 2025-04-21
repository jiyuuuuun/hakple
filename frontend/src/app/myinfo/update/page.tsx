'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'

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

export default function ProfileUpdatePage() {
    const router = useRouter()
    const { isLogin } = useGlobalLoginMember()
    const [currentNickname, setCurrentNickname] = useState('')
    const [nickname, setNickname] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [newPhoneNumber, setNewPhoneNumber] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [nicknameError, setNicknameError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [isFormValid, setIsFormValid] = useState(false)
    const [isNicknameChecked, setIsNicknameChecked] = useState(false)
    const [isPhoneChecked, setIsPhoneChecked] = useState(false)
    const [isKakaoUser, setIsKakaoUser] = useState(false)

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
                console.log('사용자 정보 요청 시작')
                const response = await fetch('/api/v1/myInfos', {
                    method: 'GET',
                    credentials: 'include', // 쿠키(JWT)를 포함하여 요청
                })

                console.log('사용자 정보 응답 상태:', response.status)
                if (!response.ok) {
                    throw new Error('사용자 정보를 불러오지 못했습니다.')
                }

                const data = await response.json()
                console.log('사용자 정보 데이터:', data)

                setCurrentNickname(data.nickName)
                setPhoneNumber(data.phoneNum)

                // 카카오 소셜 로그인 사용자 확인
                if (data.userName && data.userName.startsWith('kakao_')) {
                    setIsKakaoUser(true)
                }
            } catch (err) {
                console.error('사용자 정보를 가져오는 중 오류 발생:', err)
                setError('사용자 정보를 불러올 수 없습니다.')
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
            isNicknameChecked,
            isPhoneChecked,
        })

        // 둘 다 빈 경우
        if (nickname === '' && newPhoneNumber === '') {
            setIsFormValid(false)
            return
        }

        // 닉네임 입력한 경우
        if (nickname !== '') {
            if (!isNicknameChecked || (nicknameError !== '' && !nicknameError.includes('사용 가능'))) {
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
        console.log('폼 유효성 검사 통과 - 버튼 활성화됨')
    }, [nickname, newPhoneNumber, nicknameError, phoneError, isNicknameChecked, isPhoneChecked])

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

    // 닉네임 중복 확인
    const checkNicknameDuplicate = async () => {
        console.log('닉네임 중복확인 시작:', nickname)
        if (!validateNickname(nickname)) {
            return
        }

        setIsLoading(true)

        try {
            // 현재 닉네임과 다른지 확인
            if (nickname.trim() === currentNickname.trim()) {
                setNicknameError('현재 사용 중인 닉네임과 동일합니다.')
                setIsNicknameChecked(false)
                console.log('닉네임 검사 - 현재 값과 동일')
                setIsLoading(false)
                return
            }

            // 백엔드에 실제 중복 여부 확인 요청
            // update API를 활용해 중복 확인만 수행
            const response = await fetch('/api/v1/myInfos/update', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    nickName: nickname,
                    // 중복 확인만 위한 요청임을 표시하는 필드 추가 (백엔드에서 무시됨)
                    _checkOnly: true,
                }),
            })

            if (response.ok) {
                // 성공 시 사용 가능한 닉네임
                setNicknameError('사용 가능한 닉네임입니다.')
                setIsNicknameChecked(true)
                console.log('닉네임 중복확인 완료 - 사용 가능')
            } else {
                // 에러 응답 분석
                const errorText = await response.text()
                console.log('닉네임 중복확인 실패 응답:', errorText)

                // 백엔드 MyInfoErrorCode에 맞게 오류 메시지 처리
                if (errorText.includes('닉네임을 이미 사용 중입니다') || errorText.includes('NICKNAME_DUPLICATE')) {
                    setNicknameError('닉네임을 이미 사용 중입니다.')
                    setIsNicknameChecked(false)
                } else if (errorText.includes('닉네임은 한글/영문 2~20자') || errorText.includes('NICKNAME_INVALID')) {
                    setNicknameError('닉네임은 한글/영문 2~20자, 공백 없이 특수 기호는 _, -, . 만 사용 가능합니다.')
                    setIsNicknameChecked(false)
                } else if (errorText.includes('기존과 동일합니다') || errorText.includes('SAME_AS_CURRENT')) {
                    setNicknameError('현재 사용 중인 닉네임과 동일합니다.')
                    setIsNicknameChecked(false)
                } else if (errorText.includes('필수 작성 항목입니다') || errorText.includes('REQUIRED')) {
                    setNicknameError('닉네임은 필수 입력 항목입니다.')
                    setIsNicknameChecked(false)
                } else {
                    setNicknameError('중복 확인 중 오류가 발생했습니다: ' + errorText)
                    setIsNicknameChecked(false)
                }
            }
        } catch (err) {
            console.error('닉네임 중복 확인 중 오류 발생:', err)
            setNicknameError('중복 확인 중 오류가 발생했습니다.')
            setIsNicknameChecked(false)
        } finally {
            setIsLoading(false)
        }
    }

    // 휴대폰 번호 중복 확인
    const checkPhoneDuplicate = async () => {
        console.log('전화번호 중복확인 시작:', newPhoneNumber)
        if (!validatePhoneNumber(newPhoneNumber)) {
            return
        }

        setIsLoading(true)

        try {
            // 하이픈 제거
            const digitsOnly = newPhoneNumber.replace(/-/g, '')
            const currentPhoneClean = phoneNumber.replace(/-/g, '')

            // 현재 전화번호와 다른지 확인
            if (digitsOnly === currentPhoneClean) {
                setPhoneError('현재 사용 중인 전화번호와 동일합니다.')
                setIsPhoneChecked(false)
                console.log('전화번호 검사 - 현재 값과 동일')
                setIsLoading(false)
                return
            }

            // 백엔드에 실제 중복 여부 확인 요청
            // update API를 활용해 중복 확인만 수행
            const response = await fetch('/api/v1/myInfos/update', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    phoneNum: digitsOnly,
                    // 중복 확인만 위한 요청임을 표시하는 필드 추가 (백엔드에서 무시됨)
                    _checkOnly: true,
                }),
            })

            if (response.ok) {
                // 성공 시 사용 가능한 번호
                setPhoneError('사용 가능한 번호입니다.')
                setIsPhoneChecked(true)
                console.log('전화번호 중복확인 완료 - 사용 가능')
            } else {
                // 에러 응답 분석
                const errorText = await response.text()
                console.log('전화번호 중복확인 실패 응답:', errorText)

                // 백엔드 MyInfoErrorCode에 맞게 오류 메시지 처리
                if (errorText.includes('전화번호를 이미 사용 중입니다') || errorText.includes('PHONENUM_DUPLICATE')) {
                    setPhoneError('전화번호를 이미 사용 중입니다.')
                    setIsPhoneChecked(false)
                } else if (errorText.includes('전화번호는 숫자만 포함') || errorText.includes('PHONENUM_INVALID')) {
                    setPhoneError('전화번호는 숫자만 포함하며, 10~11자리여야 합니다.')
                    setIsPhoneChecked(false)
                } else if (errorText.includes('기존과 동일합니다') || errorText.includes('SAME_AS_CURRENT')) {
                    setPhoneError('현재 사용 중인 전화번호와 동일합니다.')
                    setIsPhoneChecked(false)
                } else if (errorText.includes('필수 작성 항목입니다') || errorText.includes('REQUIRED')) {
                    setPhoneError('전화번호는 필수 입력 항목입니다.')
                    setIsPhoneChecked(false)
                } else {
                    setPhoneError('중복 확인 중 오류가 발생했습니다: ' + errorText)
                    setIsPhoneChecked(false)
                }
            }
        } catch (err) {
            console.error('휴대폰 번호 중복 확인 중 오류 발생:', err)
            setPhoneError('중복 확인 중 오류가 발생했습니다.')
            setIsPhoneChecked(false)
        } finally {
            setIsLoading(false)
        }
    }

    // 닉네임 변경 핸들러
    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value
        setNickname(value)
        setIsNicknameChecked(false)

        if (value) {
            validateNickname(value)
        } else {
            setNicknameError('')
        }
    }

    // 전화번호 변경 핸들러
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        // 카카오 사용자는 전화번호 변경 불가
        if (isKakaoUser) return

        const inputValue = e.target.value

        // 입력값에서 숫자와 하이픈만 허용
        const sanitizedValue = inputValue.replace(/[^\d-]/g, '')

        setNewPhoneNumber(sanitizedValue)
        setIsPhoneChecked(false)

        if (sanitizedValue) {
            validatePhoneNumber(sanitizedValue)
        } else {
            setPhoneError('')
        }
    }

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault()
        console.log('폼 제출 시작', { nickname, newPhoneNumber, isFormValid })

        // 변경사항이 없으면 리다이렉트
        if (!nickname && !newPhoneNumber) {
            console.log('변경사항 없음, 리다이렉트')
            router.push('/myinfo')
            return
        }

        // 닉네임이 변경되었다면 중복확인 여부 검사
        if (nickname && !isNicknameChecked) {
            console.log('닉네임 중복확인 필요')
            setError('닉네임 중복확인이 필요합니다.')
            return
        }

        // 휴대폰 번호가 변경되었다면 중복확인 여부 검사 (카카오 사용자는 체크하지 않음)
        if (newPhoneNumber && !isPhoneChecked && !isKakaoUser) {
            console.log('휴대폰 번호 중복확인 필요')
            setError('휴대폰 번호 중복확인이 필요합니다.')
            return
        }

        // 유효성 검사
        let isValid = true

        if (nickname) {
            const nicknameValid = validateNickname(nickname)
            console.log('닉네임 유효성 검사:', nicknameValid)
            isValid = nicknameValid && isValid
        }

        if (newPhoneNumber) {
            const phoneValid = validatePhoneNumber(newPhoneNumber)
            console.log('휴대폰 번호 유효성 검사:', phoneValid)
            isValid = phoneValid && isValid
        }

        if (!isValid) {
            console.log('유효성 검사 실패')
            return
        }

        console.log('모든 검사 통과, API 호출 시작')
        setIsLoading(true)
        setError('')

        try {
            // 전화번호에서 하이픈 제거 (입력 형식과 상관없이 서버에는 숫자만 전송)
            // 카카오 사용자는 전화번호 변경 불가
            const phoneNumClean = !isKakaoUser && newPhoneNumber ? newPhoneNumber.replace(/-/g, '') : undefined

            const updateData = {
                nickName: nickname || undefined,
                phoneNum: phoneNumClean,
            }

            console.log('업데이트 데이터:', updateData)

            // API 호출
            const response = await fetch('/api/v1/myInfos/update', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // 쿠키(JWT)를 포함하여 요청
                body: JSON.stringify(updateData),
            })

            console.log('업데이트 응답 상태:', response.status)

            if (!response.ok) {
                let errorMessage = '정보 업데이트에 실패했습니다.'
                try {
                    const errorData = await response.text()
                    console.error('업데이트 실패 응답:', errorData)

                    // 백엔드 MyInfoErrorCode에 맞게 오류 메시지 처리
                    if (errorData.includes('닉네임을 이미 사용 중입니다')) {
                        errorMessage = '닉네임을 이미 사용 중입니다.'
                    } else if (errorData.includes('전화번호를 이미 사용 중입니다')) {
                        errorMessage = '전화번호를 이미 사용 중입니다.'
                    } else if (errorData.includes('닉네임은 한글/영문 2~20자')) {
                        errorMessage = '닉네임은 한글/영문 2~20자, 공백 없이 특수 기호는 _, -, . 만 사용 가능합니다.'
                    } else if (errorData.includes('전화번호는 숫자만 포함')) {
                        errorMessage = '전화번호는 숫자만 포함하며, 10~11자리여야 합니다.'
                    } else if (errorData.includes('기존과 동일합니다')) {
                        errorMessage = '변경할 내용이 기존과 동일합니다.'
                    } else if (errorData.includes('필수 작성 항목입니다')) {
                        errorMessage = '필수 작성 항목이 누락되었습니다.'
                    } else if (errorData) {
                        errorMessage = errorData
                    }
                } catch (parseError) {
                    console.error('응답 파싱 오류:', parseError)
                }

                throw new Error(errorMessage)
            }

            // 성공 시 완료 메시지 표시
            alert('정보가 성공적으로 수정되었습니다.')

            // 성공 시 리다이렉트
            router.push('/myinfo')
        } catch (err: unknown) {
            console.error('정보 업데이트 중 오류 발생:', err)
            setError(err instanceof Error ? err.message : '정보 업데이트에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    console.log('컴포넌트 렌더링 상태:', {
        isFormValid,
        isNicknameChecked,
        isPhoneChecked,
        nickname,
        newPhoneNumber,
    })

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-screen-lg mx-auto pt-6 pb-10">
                <div className="bg-white rounded-lg shadow-sm mx-4 md:mx-auto max-w-2xl mt-4">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-3 text-center">내 정보 수정</h1>
                        <p className="text-sm text-gray-600 mb-8 text-center">프로필 정보를 수정하세요</p>

                        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-10">
                                {/* 닉네임 입력 */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">닉네임</h3>
                                    <div className="text-sm text-gray-500 mb-2">현재 닉네임: {currentNickname}</div>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            id="nickname"
                                            placeholder="새 닉네임을 입력하세요"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            value={nickname}
                                            onChange={handleNicknameChange}
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-[#9C50D4] hover:text-white transition duration-200"
                                            onClick={checkNicknameDuplicate}
                                            disabled={isLoading}
                                        >
                                            중복확인
                                        </button>
                                    </div>
                                    {nicknameError && (
                                        <div
                                            className={`mt-2 text-sm ${
                                                nicknameError.includes('사용 가능') ? 'text-green-600' : 'text-red-600'
                                            }`}
                                        >
                                            {nicknameError}
                                        </div>
                                    )}
                                </div>

                                {/* 휴대폰 번호 */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">휴대폰 번호</h3>
                                    <div className="text-sm text-gray-500 mb-2">
                                        현재 휴대폰 번호: {phoneNumber ? formatPhoneNumber(phoneNumber) : '없음'}
                                    </div>
                                    {isKakaoUser ? (
                                        <div className="mt-2 mb-4 p-3 bg-yellow-50 text-amber-700 rounded-md">
                                            카카오 소셜 로그인 사용자는 휴대폰 번호를 수정할 수 없습니다.
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex space-x-2">
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    placeholder="새 휴대폰 번호를 입력하세요"
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    value={newPhoneNumber}
                                                    onChange={handlePhoneChange}
                                                    disabled={isLoading || isKakaoUser}
                                                />
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-[#9C50D4] hover:text-white transition duration-200"
                                                    onClick={checkPhoneDuplicate}
                                                    disabled={isLoading || isKakaoUser}
                                                >
                                                    중복확인
                                                </button>
                                            </div>
                                            {phoneError && (
                                                <div
                                                    className={`mt-2 text-sm ${
                                                        phoneError.includes('사용 가능')
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                    }`}
                                                >
                                                    {phoneError}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* 하단 버튼 */}
                                <div className="flex justify-end space-x-3 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                        disabled={isLoading}
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-[#9C50D4] text-white rounded-md hover:bg-purple-500 font-medium"
                                        disabled={isLoading || !isFormValid}
                                    >
                                        {isLoading ? '저장 중...' : '변경사항 저장'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    )
}
