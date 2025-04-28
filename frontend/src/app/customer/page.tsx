"use client";

import Image from "next/image";

export default function CustomerPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white py-12">
      <h2 className="text-3xl font-bold mb-6">손님은 왕이다</h2>
      <div className="mb-6">
        <Image
          src="/customer-king.jpg"
          alt="손님은 왕이다"
          width={888}
          height={888}
          className="rounded-lg shadow-lg"
        />
      </div>
      <h1 className="text-3xl text-gray-700 font-bold">허나 짐은 황제이니라</h1>
    </div>
  );
}
