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
}>({
    loginMember: createEmptyMember(),
    setLoginMember: () => {},
    setNoLoginMember: () => {},
    isLoginMemberPending: true,
    isLogin: false,
    logout: () => {},
    logoutAndHome: () => {},
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
        
        // 토큰에서 academyId 값을 확인하기 위한 디버깅
        const token = localStorage.getItem('accessToken');
        let academyIdFromToken = null;
        
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('JWT 페이로드:', payload);
                
                // academyId 필드 우선 확인 후 다른 필드 확인 (모든 형태의 필드명 처리)
                academyIdFromToken = payload.academyId || payload.academyCode || payload.academy_code || null;
                
                // academyId 정보 로그 추가
                console.log('JWT 페이로드 - 필드 확인:');
                console.log('- academyId:', payload.academyId);
                console.log('- academyCode:', payload.academyCode);
                console.log('- academy_code:', payload.academy_code);
                console.log('- 최종 선택된 값:', academyIdFromToken);
                
                // 닉네임 디코딩 확인용
                console.log('JWT 페이로드 - 닉네임:', payload.nickName);
                console.log('토큰에서 추출한 아카데미 코드:', academyIdFromToken);
            } catch (e) {
                console.error('토큰 파싱 중 오류:', e);
            }
        }
        
        // 백엔드 응답 데이터를 User 타입으로 변환
        const user: User = {
            id: member.id || member.memberId || 0,
            nickname: member.nickName || '',
            creationTime: member.creationTime || '',
            modificationTime: member.modificationTime || '',
            academyCode: member.academyCode || academyIdFromToken || '' // academyCode가 없으면 토큰에서 가져온 academyId 사용, 빈 문자열 기본값으로 설정
        }

        console.log('로그인 회원 정보 설정(academyCode 포함):', user)
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
            // 로그아웃 시 액세스 토큰 제거
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            removeLoginMember()
            callback()
        })
    }
    //로그아웃 하고
    const logoutAndHome = () => {
        logout(() => router.replace('/'))
    }

    return {
        loginMember,
        setLoginMember,
        isLoginMemberPending,
        setNoLoginMember,
        isLogin,

        logout,
        logoutAndHome,
    }
}

export function useGlobalLoginMember() {
    return use(LoginMemberContext)
}
