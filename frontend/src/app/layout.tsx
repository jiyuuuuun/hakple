import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClientLayout } from './ClientLayout'
// import Head from 'next/head' // 사용되지 않으면 제거 가능
// import { Inter } from 'next/font/google' // 사용되지 않으므로 제거
import Script from 'next/script'
// import { usePathname } from 'next/navigation' // 서버 컴포넌트에서는 사용 불가

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

// const inter = Inter({ subsets: ['latin'] }) // 사용되지 않으므로 주석 처리 또는 제거

export const metadata: Metadata = {
    title: 'Hakple | 학원생 커뮤니티 플랫폼',
    description: '전국 학원생들을 위한 소통, 정보 공유, 친목 커뮤니티 플랫폼',
}

export function generateViewport(): Viewport {
  return {
    width: 'device-width',
    initialScale: 1.0,
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
            <head>
                <link
                    rel="preload"
                    href="https://fonts.googleapis.com/icon?family=Material+Icons"
                    as="style"
                />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/icon?family=Material+Icons"
                />
                <link rel="icon" href="/favicon.ico" />
                <link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@300;400;700&family=Nanum+Pen+Script&display=swap" rel="stylesheet" />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} font-sans flex flex-col min-h-screen`}>
                <Script src="https://unpkg.com/material-icons@1.13.8/iconfont/material-icons.js"></Script>
                <div className='min-h-screen'>
                    <ClientLayout>{children}</ClientLayout>
                </div>
            </body>
        </html>
    )
}
