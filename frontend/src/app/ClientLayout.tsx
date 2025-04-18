'use client'

import { useEffect } from 'react'
export function ClientLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        fetch('/api/members/me')
            .then((response) => response.json())
            .then((data) => {
                console.log(data)
            })
    }, [])
    return <main>{children}</main>
}
