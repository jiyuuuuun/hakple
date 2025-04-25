import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClientLayout } from './ClientLayout'
import Head from 'next/head'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'Hakple | 학습 플랫폼',
    description: '학원생들을 위한 커뮤니티 플랫폼',
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
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} font-sans flex flex-col min-h-screen`}>
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    )
}
