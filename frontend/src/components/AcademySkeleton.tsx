import React from 'react';

export default function AcademySkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 mt-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">현재 학원</h2>
      <div className="space-y-2">
        <div className="p-2 rounded-md flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-gray-200 rounded-full mr-1 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 