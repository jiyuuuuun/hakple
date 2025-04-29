'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AcademyNoticePage() {
  const router = useRouter();
  const params = useParams();
  const academyCode = params?.academyCode as string;

  useEffect(() => {
    if (academyCode) {
      router.push(`/post/notice?academyCode=${encodeURIComponent(academyCode)}&type=notice`);
    } else {
      router.push('/post/notice?type=notice');
    }
  }, [academyCode, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C4FF2]"></div>
    </div>
  );
} 