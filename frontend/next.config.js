/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // 빌드 중에 ESLint 검사를 건너뜁니다
        ignoreDuringBuilds: true,
    },
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
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.amazonaws.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: '*.s3.amazonaws.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: '*.s3.*.amazonaws.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
                pathname: '**',
            },
        ],
    },
    experimental: {
        optimizeCss: true,
    },
}

module.exports = nextConfig
