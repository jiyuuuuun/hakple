'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SafeHtmlImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

/**
 * 안전한 HTML img 태그 사용을 위한 컴포넌트
 * 일반 img 태그를 사용하면서도 removeChild 관련 DOM 오류를 방지합니다.
 */
const SafeHtmlImage: React.FC<SafeHtmlImageProps> = ({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(typeof src === 'string' ? src : '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (src && typeof src === 'string') {
      setImgSrc(src);
      setHasError(false);
    }
  }, [src]);

  const handleError = () => {
    if (isMounted.current) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  const handleLoad = () => {
    if (isMounted.current) {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <div className="image-placeholder animate-pulse" />}
      <img
        {...props}
        src={hasError ? fallbackSrc : imgSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        ref={imgRef}
        style={{
          ...(props.style || {}),
          display: isLoading ? 'none' : 'block',
        }}
      />
    </>
  );
};

export default SafeHtmlImage; 