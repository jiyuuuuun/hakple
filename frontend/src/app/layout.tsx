import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Footer from '@/components/Footer'
import Header from '@/components/Header'

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
                <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} font-sans flex flex-col min-h-screen`}>
                <Header />
                <div className="flex-grow">{children}</div>
                <Footer />
            </body>
        </html>
    )
}
