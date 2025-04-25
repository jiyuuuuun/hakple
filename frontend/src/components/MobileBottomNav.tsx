// components/MobileBottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MobileBottomNav = () => {
    const pathname = usePathname()

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
                <li>
                    <Link href="/mypage" className={`flex flex-col items-center ${pathname.includes('/mypage') && 'text-[#9C50D4]'}`}>
                        <span className="material-icons text-xl">person</span>
                        마이페이지
                    </Link>
                </li>
            </ul>
        </nav>
    )
}

export default MobileBottomNav
