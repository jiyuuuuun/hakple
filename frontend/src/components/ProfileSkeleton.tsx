import React from 'react';

export default function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 mt-8">
      {/* 프로필 섹션 */}
      <div className="flex flex-col items-center pb-6 border-b border-gray-100">
        <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse mb-4 ring-4 ring-gray-100"></div>
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-4"></div>
        <div className="h-8 bg-gray-200 rounded-full w-32 animate-pulse"></div>
      </div>

      {/* 활동 통계 */}
      <div className="py-4 grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto animate-pulse mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* 빠른 링크 */}
      <div className="pt-4 border-t border-gray-100">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
} 