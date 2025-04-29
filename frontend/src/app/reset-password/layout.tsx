'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // useEffect를 사용하여 현재 페이지 경로에 따라 body 클래스를 조정
  useEffect(() => {
    // 헤더와 푸터를 숨기기 위해 body에 클래스 추가
    document.body.classList.add('hide-header-footer');
    
    // 컴포넌트 언마운트 시 클래스 제거
    return () => {
      document.body.classList.remove('hide-header-footer');
    };
  }, [pathname]);

  return (
    <div className="reset-password-layout">
      {children}
    </div>
  );
} 