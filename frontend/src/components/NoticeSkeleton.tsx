import React from 'react';

interface NoticeSkeletonProps {
  count?: number;
}

export default function NoticeSkeleton({ count = 3 }: NoticeSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
} 