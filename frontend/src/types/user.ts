export interface User {
    id: number;
    nickname: string;
    userName?: string;
    phoneNum?: string;
    creationTime: string;
    modificationTime?: string;
    academyCode?: string;
    academyName?: string;
}

export interface BackendUser {
    id?: number;
    memberId?: number;
    nickName: string;
    userName?: string;
    phoneNum?: string;
    creationTime?: string;
    modificationTime?: string;
    academyCode?: string;
    academyName?: string;
}