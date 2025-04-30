// components/MobileBottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { useEffect, useState } from 'react'
import { fetchApi } from '@/utils/api'
const MobileBottomNav = () => {
    const pathname = usePathname()
    const { isLogin } = useGlobalLoginMember()
    const [isAdmin, setIsAdmin] = useState(false)

    // 관리자 권한 확인
    useEffect(() => {
        if (!isLogin) {
            setIsAdmin(false)
            return
        }

        fetchApi(`/api/v1/admin/check`, {
            method: 'GET',
        })
        .then(response => {
            if (!response.ok) return false
            return response.json()
        })
        .then(isAdminResult => {
            setIsAdmin(isAdminResult === true)
        })
        .catch(error => {
            setIsAdmin(false)
        })
    }, [isLogin])

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 shadow-sm md:hidden">
            <ul className="flex justify-around items-center h-16 text-xs text-gray-600">
                <li>
                    <Link href="/" className={`flex flex-col items-center ${pathname === '/' && 'text-[#9C50D4]'}`}>
                        <span className="material-icons text-xl">home</span>
                        홈
                    </Link>
                </li>
                <li>
                    <Link href="/post" className={`flex flex-col items-center ${pathname.includes('/post') && 'text-[#9C50D4]'}`}>
                        <span className="material-icons text-xl">edit</span>
                        게시판
                    </Link>
                </li>
                <li>
                    <Link href="/calendar" className={`flex flex-col items-center ${pathname.includes('/calendar') && 'text-[#9C50D4]'}`}>
                        <span className="material-icons text-xl">calendar_today</span>
                        일정
                    </Link>
                </li>
                {isAdmin ? (
                    <li>
                        <Link href="/admin" className={`flex flex-col items-center ${pathname.includes('/admin') ? 'text-red-600' : 'text-gray-600'}`}>
                            <span className="material-icons text-xl">admin_panel_settings</span>
                            관리자
                        </Link>
                    </li>
                ) : (
                    <li>
                        <Link href="/myinfo" className={`flex flex-col items-center ${pathname.includes('/myinfo') && 'text-[#9C50D4]'}`}>
                            <span className="material-icons text-xl">person</span>
                            내정보
                        </Link>
                    </li>
                )}
            </ul>
        </nav>
    )
}

export default MobileBottomNav
