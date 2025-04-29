'use client';

import { useState } from 'react';
import Image from 'next/image';
import SafeImage from '@/components/SafeImage';
import SafeHtmlImage from '@/components/SafeHtmlImage';
import { addNoCacheParam, getFallbackImageUrl } from '@/utils/imageUtils';

export default function ImageExamplePage() {
  const [nextImageError, setNextImageError] = useState(false);
  const [htmlImageError, setHtmlImageError] = useState(false);
  
  // 이미지 URL 예시
  const validImageUrl = 'https://via.placeholder.com/300x200?text=Valid+Image';
  const invalidImageUrl = 'https://example.com/not-an-image.jpg';

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">이미지 로딩 최적화 예제</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Next.js Image 컴포넌트 예제 */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">1. 기본 Next.js Image</h2>
          <div className="w-full h-[200px] relative mb-4 bg-gray-100">
            {!nextImageError ? (
              <Image
                src={invalidImageUrl}
                alt="기본 Next.js 이미지"
                fill
                style={{ objectFit: 'cover' }}
                onError={() => setNextImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <p className="text-red-500">이미지 로드 실패</p>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">
            기본 Next.js Image 컴포넌트는 오류 처리가 제한적입니다.
          </p>
        </div>
        
        {/* SafeImage 컴포넌트 예제 */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">2. SafeImage 컴포넌트</h2>
          <div className="w-full h-[200px] relative mb-4 bg-gray-100">
            <SafeImage
              src={invalidImageUrl}
              alt="안전한 이미지"
              fill
              style={{ objectFit: 'cover' }}
              fallbackSrc={getFallbackImageUrl(300, 'Fallback')}
            />
          </div>
          <p className="text-sm text-gray-600">
            SafeImage 컴포넌트는 자동으로 fallback 처리를 합니다.
          </p>
        </div>
        
        {/* 일반 HTML img 태그 예제 */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">3. 일반 HTML img 태그</h2>
          <div className="w-full h-[200px] mb-4 bg-gray-100 flex items-center justify-center">
            {!htmlImageError ? (
              <img
                src={invalidImageUrl}
                alt="HTML 이미지"
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }}
                onError={() => setHtmlImageError(true)}
              />
            ) : (
              <p className="text-red-500">이미지 로드 실패</p>
            )}
          </div>
          <p className="text-sm text-gray-600">
            일반 HTML img 태그는 removeChild 오류가 발생할 수 있습니다.
          </p>
        </div>
        
        {/* SafeHtmlImage 컴포넌트 예제 */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">4. SafeHtmlImage 컴포넌트</h2>
          <div className="w-full h-[200px] mb-4 bg-gray-100 flex items-center justify-center">
            <SafeHtmlImage
              src={invalidImageUrl}
              alt="안전한 HTML 이미지"
              width={300}
              height={200}
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }}
              fallbackSrc={getFallbackImageUrl(300, 'Fallback')}
            />
          </div>
          <p className="text-sm text-gray-600">
            SafeHtmlImage 컴포넌트는 removeChild 오류를 방지합니다.
          </p>
        </div>
      </div>
      
      {/* 권장 사항 */}
      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">removeChild 오류 해결 방법</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Next.js의 Image 컴포넌트 대신 SafeImage 컴포넌트 사용</li>
          <li>HTML img 태그 대신 SafeHtmlImage 컴포넌트 사용</li>
          <li>이미지 로드 상태를 관리하는 useState 활용</li>
          <li>이미지 로드 실패 시 적절한 fallback 이미지 제공</li>
          <li>CSS transition과 opacity로 부드러운 로딩 효과 적용</li>
          <li>이미지 URL에 캐시 무효화 파라미터 추가</li>
        </ul>
      </div>
    </div>
  );
} 