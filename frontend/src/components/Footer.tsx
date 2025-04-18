import React from 'react'

/**
 * 푸터 컴포넌트
 *
 * 웹사이트의 하단에 저작권 정보를 표시합니다.
 * 모든 페이지에서 공통적으로 사용할 수 있습니다.
 */

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200">
            <div className="max-w-screen-lg mx-auto px-4 py-15">
                <div className="text-center">
                    <p className="text-gray-500 text-sm">© 2025 Hakple. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
