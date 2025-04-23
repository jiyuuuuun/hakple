'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AcademyNoticePage() {
  const router = useRouter();
  const params = useParams();
  const academyCode = params?.academyCode as string;

  useEffect(() => {
    if (academyCode) {
      // 기존 공지사항 페이지로 쿼리 파라미터를 포함하여 리다이렉트
      router.push(`/post/notice?academyCode=${encodeURIComponent(academyCode)}&type=notice`);
    } else {
      // 아카데미 코드가 없으면 그냥 공지사항 페이지로 이동
      router.push('/post/notice?type=notice');
    }
  }, [academyCode, router]);

  // 로딩 상태 표시
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C4FF2]"></div>
    </div>
  );
} 