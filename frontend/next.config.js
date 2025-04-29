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
        domains: ['hakplebucket.s3.ap-northeast-2.amazonaws.com', 'via.placeholder.com'],
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
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        formats: ['image/webp'],
        minimumCacheTTL: 60,
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    experimental: {
        optimizeCss: true,
        appDir: true,
        scrollRestoration: true,
        serverActions: true,
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.module.rules.forEach((rule) => {
                if (rule.loader === 'next-image-loader' || rule.loader?.includes('next/dist/build/webpack/loaders/next-image-loader')) {
                    rule.options = {
                        ...rule.options,
                        isServer,
                        isDev: process.env.NODE_ENV !== 'production',
                        assetPrefix: '',
                    };
                }
            });
        }
        return config;
    },
}

module.exports = nextConfig
