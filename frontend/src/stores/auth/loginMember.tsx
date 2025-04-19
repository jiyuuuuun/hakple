import { createContext, useState, use } from "react";
import { useRouter } from "next/navigation";

//이 부분은 나중에 DTO에 맞게 변경할거임
type User = {
  id: number;
  nickname: string;
  creationTime: string;
  modificationTime: string;
};

//컨텍스트 전역관리용
export const LoginMemberContext = createContext<{
  loginMember: User;
  setLoginMember: (member: User) => void;
  isLoginMemberPending: boolean;
  isLogin: boolean;
  logout: (callback: () => void) => void;
  logoutAndHome: () => void;
}>({
  loginMember: createEmptyMember(),
  setLoginMember: () => {},
  isLoginMemberPending: true,
  isLogin: false,
  logout: () => {},
  logoutAndHome: () => {},
});

//나머지들은 메서드를 블록화
function createEmptyMember(): User {
  return {
    id: 0,
    creationTime: "",
    modificationTime: "",
    nickname: "",
  };
}

export function useLoginMember() {
  const router = useRouter();

  const [isLoginMemberPending, setLoginMemberPending] = useState(true);
  const [loginMember, _setLoginMember] = useState<User>(createEmptyMember());

  const removeLoginMember = () => {
    _setLoginMember(createEmptyMember());
    setLoginMemberPending(false);
  };

  //pending이 false되어서 로그인이 되었다고 판단함
  const setLoginMember = (member: User) => {
    _setLoginMember(member);
    setLoginMemberPending(false);
  };

  const setNoLoginMember = () => {
    setLoginMemberPending(false);
  };

  //로그인이 되었냐
  const isLogin = loginMember.id !== 0;

  const logout = (callback: () => void) => {
    fetch("http://localhost:8090/api/v1/auth/logout", {
      method: "DELETE",
      credentials: "include",
    }).then(() => {
      removeLoginMember();
      callback();
    });
  };
//로그아웃 하고 
  const logoutAndHome = () => {
    logout(() => router.replace("/"));
  };

  return {
    loginMember,
    setLoginMember,
    isLoginMemberPending,
    setNoLoginMember,
    isLogin,

    logout,
    logoutAndHome,
  };
}

export function useGlobalLoginMember() {
  return use(LoginMemberContext);
}