import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClientLayout } from './ClientLayout'
import Head from 'next/head'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { usePathname } from 'next/navigation'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Hakple | 학습 플랫폼',
    description: '학원생들을 위한 커뮤니티 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    // 클라이언트에서만 경로 확인
    if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        if (pathname.startsWith('/customer')) {
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
                            {children}
                        </div>
                    </body>
                </html>
            );
        }
    }
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
