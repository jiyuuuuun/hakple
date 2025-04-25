import { createContext, useState, use } from 'react'
import { useRouter } from 'next/navigation'

//이 부분은 나중에 DTO에 맞게 변경할거임
export interface User {
    id?: number;
    nickname: string;
    userName: string;
    phoneNum?: string;
    creationTime: string;
    modificationTime: string;
    academyId?: string;
    academyCode?: string;
    academyName?: string;
    isAdmin?: boolean;
    profileImageUrl?: string;
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
    setLoginMember: () => { },
    setNoLoginMember: () => { },
    isLoginMemberPending: true,
    isLogin: false,

    setIsLogin: () => { },

    logout: () => { },
    logoutAndHome: () => { },
    checkAdminAndRedirect: async () => false,
})

//나머지들은 메서드를 블록화
function createEmptyMember(): User {
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
    const router = useRouter()

    const [isLoginMemberPending, setLoginMemberPending] = useState(true)
    const [loginMember, _setLoginMember] = useState<User>(createEmptyMember())
    const [isLogin, setIsLogin] = useState(false); // 👈 추가

    const removeLoginMember = () => {
        _setLoginMember(createEmptyMember())
        setIsLogin(false)
        setLoginMemberPending(false)
    }

    //pending이 false되어서 로그인이 되었다고 판단함


    const setLoginMember = (member: BackendUser) => {
        console.group('LoginMember Store - setLoginMember')
        console.log('백엔드 응답 데이터:', member)

        const nickname =
            typeof member.nickName === 'string'
                ? member.nickName
                : typeof member.nickname === 'string'
                    ? member.nickname
                    : ''

        const academyCode =
            typeof member.academyCode === 'string'
                ? member.academyCode
                : typeof member.academyId === 'string'
                    ? member.academyId
                    : ''

        const user: User = {
            nickname: nickname,
            userName: member.userName ?? '',
            phoneNum: member.phoneNum,
            creationTime: member.creationTime || '',
            modificationTime: member.modificationTime || '',
            academyCode: academyCode,
            academyName: member.academyName || '',
            profileImageUrl: member.profileImageUrl || '',
        }

        console.log('생성된 User 객체:', user)
        _setLoginMember(user)

        const isValidLogin = !!user.userName || !!user.nickname // <- 사용자 확인 가능한 핵심 필드

        setIsLogin(isValidLogin); // 유효한 사용자 정보가 있을 때만 로그인 상태로 설정
        setLoginMemberPending(false)
        console.groupEnd()
    }

    const setNoLoginMember = () => {
        setLoginMemberPending(false)
    }


    const logout = (callback: () => void) => {
        fetch('http://localhost:8090/api/v1/auth/logout', {
            method: 'DELETE',
            credentials: 'include',
        }).then(() => {
            _setLoginMember(createEmptyMember())
            setIsLogin(false)
            setLoginMemberPending(false)
            callback()
        })
    }

    const logoutAndHome = () => {
        logout(() => router.replace('/'))
    }

    // 관리자 권한 확인 함수
    const checkAdminAndRedirect = async () => {
        try {
            const response = await fetch(`http://localhost:8090/api/v1/admin/check`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            })

            if (!response.ok) {
                return false
            }

            const isAdmin = await response.json()
            return isAdmin === true
        } catch (error) {
            console.log('관리자 권한 확인 중 오류:', error)
            return false
        }
    }

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