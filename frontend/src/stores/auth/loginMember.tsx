import { createContext, useState, use } from 'react'
import { useRouter } from 'next/navigation'

//이 부분은 나중에 DTO에 맞게 변경할거임
type User = {
    id: number
    nickname: string
    creationTime: string
    modificationTime: string
    academyCode?: string
}

// 백엔드 응답 타입 - MyInfoResponseDto와 일치하도록
type BackendUser = {
    id?: number
    memberId?: number
    nickName?: string
    userName?: string // 사용자 아이디
    phoneNum?: string
    academyCode?: string // 학원 코드
    creationTime?: string
    modificationTime?: string
    [key: string]: unknown // any 대신 unknown 사용
}

//컨텍스트 전역관리용
export const LoginMemberContext = createContext<{
    loginMember: User
    setLoginMember: (member: BackendUser) => void
    setNoLoginMember: () => void
    isLoginMemberPending: boolean
    isLogin: boolean
    logout: (callback: () => void) => void
    logoutAndHome: () => void
    checkAdminAndRedirect: () => Promise<boolean>
}>({
    loginMember: createEmptyMember(),
    setLoginMember: () => {},
    setNoLoginMember: () => {},
    isLoginMemberPending: true,
    isLogin: false,
    logout: () => {},
    logoutAndHome: () => {},
    checkAdminAndRedirect: async () => false,
})

//나머지들은 메서드를 블록화
function createEmptyMember(): User {
    return {
        id: 0,
        nickname: '',
        creationTime: '',
        modificationTime: '',
    }
}

export function useLoginMember() {
    const router = useRouter()

    const [isLoginMemberPending, setLoginMemberPending] = useState(true)
    const [loginMember, _setLoginMember] = useState<User>(createEmptyMember())

    const removeLoginMember = () => {
        _setLoginMember(createEmptyMember())
        setLoginMemberPending(false)
    }

    //pending이 false되어서 로그인이 되었다고 판단함
    const setLoginMember = (member: BackendUser) => {
        // 백엔드 응답 데이터 로깅
        console.log('백엔드에서 받은 회원 정보:', member);
        
        // 백엔드 응답 데이터를 User 타입으로 변환
        const user: User = {
            id: member.id || member.memberId || 0,
            nickname: member.nickName || '',
            creationTime: member.creationTime || '',
            modificationTime: member.modificationTime || '',
            academyCode: member.academyCode || '' // 백엔드에서 받은 academyCode만 사용
        }

        console.log('로그인 회원 정보 설정:', user)
        _setLoginMember(user)
        setLoginMemberPending(false)
    }

    const setNoLoginMember = () => {
        setLoginMemberPending(false)
    }

    //로그인이 되었냐
    const isLogin = loginMember.id !== 0

    const logout = (callback: () => void) => {
        fetch('http://localhost:8090/api/v1/auth/logout', {
            method: 'DELETE',
            credentials: 'include',
        }).then(() => {
            removeLoginMember()
            callback()
        })
    }
    //로그아웃 하고
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
            console.error('관리자 권한 확인 중 오류:', error)
            return false
        }
    }

    return {
        loginMember,
        setLoginMember,
        isLoginMemberPending,
        setNoLoginMember,
        isLogin,
        logout,
        logoutAndHome,
        checkAdminAndRedirect,
    }
}

export function useGlobalLoginMember() {
    return use(LoginMemberContext)
}
