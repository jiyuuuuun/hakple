import { createContext, useState, use, useCallback } from 'react'
// import { useRouter } from 'next/navigation' // 더 이상 사용되지 않음
import { fetchApi } from '@/utils/api'

//이 부분은 나중에 DTO에 맞게 변경할거임
export interface User {
    id?: number
    nickname: string
    userName: string
    phoneNum?: string
    creationTime: string
    modificationTime: string
    academyId?: string
    academyCode?: string
    academyName?: string
    isAdmin?: boolean
    profileImageUrl?: string
}

// 백엔드 응답 타입 - MyInfoResponseDto와 일치하도록
type BackendUser = {
    id?: number
    memberId?: number
    nickName?: string
    userName?: string // 사용자 아이디
    phoneNum?: string
    academyId?: string // 학원 ID (백엔드 응답과 일치)
    academyCode?: string // 학원 코드
    academyName?: string // 학원 이름
    profileImageUrl?: string
    creationTime?: string
    modificationTime?: string
    isAdmin?: boolean
    accessToken?: string
    [key: string]: unknown // any 대신 unknown 사용
}

//컨텍스트 전역관리용
export const LoginMemberContext = createContext<{
    loginMember: User
    setLoginMember: (member: BackendUser) => void
    setNoLoginMember: () => void
    isLoginMemberPending: boolean
    isLogin: boolean
    setIsLogin: (value: boolean) => void
    logout: (callback: () => void) => void
    logoutAndHome: () => void
    checkAdminAndRedirect: () => Promise<boolean>
}>({
    loginMember: createEmptyMember(),
    setLoginMember: () => {},
    setNoLoginMember: () => {},
    isLoginMemberPending: true,
    isLogin: false,

    setIsLogin: () => {},

    logout: () => {},
    logoutAndHome: () => {},
    checkAdminAndRedirect: async () => false,
})

//나머지들은 메서드를 블록화
export function createEmptyMember(): User {
    return {
        nickname: '',
        userName: '',
        creationTime: '',
        modificationTime: '',
        academyCode: '',
        academyName: '',
        profileImageUrl: '',
    }
}

export function useLoginMember() {
    // const router = useRouter() // 사용되지 않으므로 제거

    const [isLoginMemberPending, setLoginMemberPending] = useState(true)
    const [loginMember, _setLoginMember] = useState<User>(createEmptyMember())
    const [isLogin, setIsLogin] = useState(false)

    // useCallback으로 setNoLoginMember 감싸기
    const setNoLoginMember = useCallback(() => {
        _setLoginMember(createEmptyMember()) // 로그아웃 시 멤버 정보도 초기화
        setIsLogin(false) // setIsLogin은 의존성에 포함하지 않아도 됨 (stable)
        setLoginMemberPending(false) // setLoginMemberPending도 stable

    }, []) // 의존성 없음

    // useCallback으로 setLoginMember 감싸기
    const setLoginMember = useCallback((member: BackendUser) => {
        console.group('LoginMember Store - setLoginMember (memoized)')

        if (member.accessToken && member.id) {
            const user: User = {
                id: member.id,
                nickname: member.userName || '',
                userName: member.userName || '',
                creationTime: '', // 로그인 응답에는 없을 수 있음
                modificationTime: '', // 로그인 응답에는 없을 수 있음
                isAdmin: member.isAdmin,
            }
            _setLoginMember(user)
            setIsLogin(true)
            setLoginMemberPending(false)

            console.groupEnd()
            return
        }

        const nickname = member.nickName ?? (typeof member.nickname === 'string' ? member.nickname : '') ?? ''
        const academyCode = member.academyCode ?? member.academyId ?? ''
        let profileImageUrl = ''

        if (typeof member.profileImageUrl === 'string') {
            profileImageUrl = member.profileImageUrl.trim()
            // 캐시 방지 로직은 이미지 로드 시 처리하는 것이 더 일반적
        }

        const user: User = {
            id: member.id ?? member.memberId,
            nickname: nickname,
            userName: member.userName ?? '',
            phoneNum: member.phoneNum,
            creationTime: member.creationTime || '',
            modificationTime: member.modificationTime || '',
            academyCode: academyCode,
            academyName: member.academyName || '',
            profileImageUrl: profileImageUrl,
            isAdmin: member.isAdmin,
        }

        _setLoginMember(user)
        const isValidLogin = !!user.userName || !!user.nickname // 유효성 검사 강화 가능
        setIsLogin(isValidLogin)
        setLoginMemberPending(false)

        console.groupEnd()
    }, []) // _setLoginMember, setIsLogin, setLoginMemberPending은 stable하므로 의존성 필요 없음

    // useCallback으로 logout 감싸기
    const logout = useCallback(
        (callback: () => void) => {

            fetchApi(
                `/api/v1/auth/logout`,
                {
                    method: 'DELETE',
                    // credentials: 'include', // fetchApi에서 자동으로 처리될 수 있음
                },
                true,
            ) // 401 발생 시 리다이렉트 방지 (필수는 아님)
                .then(() => {

                })
                .catch((err) => {
                    console.error('로그아웃 API 호출 중 오류 발생:', err)
                })
                .finally(() => {
                    // finally 블록 내에서 setNoLoginMember 호출 (memoized 버전)
                    setNoLoginMember() // 이미 useCallback으로 감싸짐


                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('academyCode')
                        localStorage.removeItem('academyName')
                    }

                    callback() // 콜백 함수 실행
                })
            // setNoLoginMember를 의존성 배열에 추가 (useCallback으로 감싸졌으므로)
        },
        [setNoLoginMember],
    )

    // useCallback으로 logoutAndHome 감싸기
    const logoutAndHome = useCallback(() => {

        // logout 함수 호출 (memoized 버전)
        logout(() => {
            window.location.href = '/' // useRouter().push('/') 보다 페이지 새로고침 효과
        })
        // logout 함수를 의존성 배열에 추가
    }, [logout])

    // useCallback으로 checkAdminAndRedirect 감싸기
    const checkAdminAndRedirect = useCallback(async () => {

        // 이 함수는 이제 단순 확인용. 실제 리다이렉트는 ClientLayout에서 처리.
        try {
            const response = await fetchApi(
                `/api/v1/admin/check`,
                {
                    method: 'GET',
                },
                true,
            ) // 리다이렉트 방지

            if (!response.ok) {
                return false
            }
            const data = await response.json()
            return data === true // 백엔드가 boolean을 반환한다고 가정
        } catch {
            return false
        }
    }, []) // 의존성 없음 (fetchApi는 외부 함수)

    return {
        loginMember,
        setLoginMember,
        isLoginMemberPending,
        setNoLoginMember,
        isLogin,
        setIsLogin,
        logout,
        logoutAndHome,
        checkAdminAndRedirect,
    }
}

export function useGlobalLoginMember() {
    return use(LoginMemberContext)
}
