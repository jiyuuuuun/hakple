/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8090/api/:path*', // 백엔드 API 서버 주소
            },
        ]
    },
    images: {
        domains: ['hakplebucket.s3.ap-northeast-2.amazonaws.com'],
    },
}

module.exports = nextConfig
