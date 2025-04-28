# Next.js 이미지 로딩 문제 해결 가이드

## 목차

1. [일반적인 이미지 오류](#일반적인-이미지-오류)
2. [removeChild 오류](#removechild-오류)
3. [해결책](#해결책)
4. [설정 최적화](#설정-최적화)
5. [FAQ](#faq)

## 일반적인 이미지 오류

Next.js 애플리케이션에서 흔히 발생하는 이미지 관련 오류는 다음과 같습니다:

-   **Failed to execute 'removeChild' on 'Node'**: 이미지 로드 중 DOM 요소가 변경되거나 컴포넌트가 언마운트될 때 발생
-   **이미지 로드 실패**: 잘못된 URL, 네트워크 오류, CORS 문제 등으로 인한 실패
-   **이미지 깜빡임**: 페이지 전환 시 이미지가 깜빡이거나 다시 로드되는 현상
-   **인증 필요 이미지 로드 실패**: 인증이 필요한 리소스에 접근할 때 발생하는 문제

## removeChild 오류

```
Error: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
```

이 오류는 다음과 같은 상황에서 주로 발생합니다:

1. **이미지 로드 중 컴포넌트 언마운트**: 이미지가 로드되기 전에 컴포넌트가 DOM에서 제거될 때
2. **이미지 로드 중 조건부 렌더링 변경**: 이미지 로드 도중 조건부 렌더링 상태가 변경될 때
3. **이미지 참조 오류**: 잘못된 DOM 참조로 인해 이미지 요소를 제거하려 할 때
4. **React 상태 업데이트 타이밍 문제**: 이미지 로드 콜백과 React 렌더링 사이클 간의 충돌

## 해결책

### 1. SafeImage와 SafeHtmlImage 컴포넌트 사용

`src/components/SafeImage.tsx`와 `src/components/SafeHtmlImage.tsx` 컴포넌트를 사용하여 안전한 이미지 로딩을 구현할 수 있습니다. 이 컴포넌트들은:

-   이미지 로드 상태를 관리
-   오류가 발생할 경우 fallback 이미지 제공
-   컴포넌트 언마운트 시 메모리 누수 방지

예시 사용법:

```tsx
// Next.js Image 컴포넌트 대체
<SafeImage
  src={imageUrl}
  alt="이미지 설명"
  width={300}
  height={200}
  fallbackSrc="https://via.placeholder.com/300x200?text=이미지+없음"
/>

// HTML img 태그 대체
<SafeHtmlImage
  src={imageUrl}
  alt="이미지 설명"
  width={300}
  height={200}
  fallbackSrc="https://via.placeholder.com/300x200?text=이미지+없음"
/>
```

### 2. 이미지 상태 관리 개선

```tsx
// 컴포넌트 내부에서 이미지 상태 관리
const [isLoaded, setIsLoaded] = useState(false)
const [hasError, setHasError] = useState(false)
const [imgSrc, setImgSrc] = useState(originalSrc)

// isLoaded 상태를 사용한 조건부 렌더링
{
    !isLoaded && <div className="placeholder">로딩 중...</div>
}
;<img
    src={hasError ? fallbackSrc : imgSrc}
    alt={alt}
    style={{ display: isLoaded ? 'block' : 'none' }}
    onLoad={() => setIsLoaded(true)}
    onError={() => {
        setHasError(true)
        setImgSrc(fallbackSrc)
    }}
/>
```

### 3. useRef와 cleanup 함수 사용

```tsx
const imgRef = useRef(null)
const isMounted = useRef(true)

useEffect(() => {
    return () => {
        isMounted.current = false // 컴포넌트 언마운트 시 플래그 설정
    }
}, [])

const handleLoad = () => {
    if (isMounted.current) {
        // 컴포넌트가 여전히 마운트된 상태인지 확인
        setIsLoaded(true)
    }
}
```

### 4. 이미지 프리로딩 활용

```tsx
// 이미지 프리로딩 함수
const preloadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = (e) => reject(e)
        img.src = src
    })
}

// 사용 예시
useEffect(() => {
    const loadImage = async () => {
        try {
            await preloadImage(imageUrl)
            if (isMounted.current) {
                setIsLoaded(true)
            }
        } catch (error) {
            if (isMounted.current) {
                setHasError(true)
            }
        }
    }

    loadImage()
}, [imageUrl])
```

## 설정 최적화

`next.config.js` 파일을 다음과 같이 최적화하여 이미지 관련 문제를 줄일 수 있습니다:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['your-domain.com', 'via.placeholder.com'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        formats: ['image/webp'],
        minimumCacheTTL: 60,
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
}

module.exports = nextConfig
```

## FAQ

### Q: 이미지를 로드하는 동안 스켈레톤 또는 로딩 인디케이터를 보여줄 수 있나요?

A: 네, `isLoaded` 상태를 사용하여 이미지가 로드되기 전에 스켈레톤이나 로딩 인디케이터를 표시할 수 있습니다.

### Q: 이미지 로드에 실패하면 어떻게 해야 하나요?

A: `onError` 핸들러를 사용하여 fallback 이미지를 표시하거나 오류 메시지를 보여줄 수 있습니다.

### Q: 대용량 이미지를 최적화하는 방법은 무엇인가요?

A: Next.js Image 컴포넌트는 자동으로 이미지를 최적화하지만, 추가로 이미지 CDN을 사용하거나 이미지 포맷을 WebP나 AVIF로 변환하는 것이 좋습니다.

### Q: 이미지 로드 시 removeChild 오류를 방지하는 가장 간단한 방법은 무엇인가요?

A: SafeImage 또는 SafeHtmlImage 컴포넌트를 사용하는 것이 가장 간단한 방법입니다. 이 컴포넌트들은 이미지 로드 상태를 안전하게 관리합니다.
