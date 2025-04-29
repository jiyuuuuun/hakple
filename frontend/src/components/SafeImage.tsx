import React, { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(
    typeof src === 'string' ? src : undefined
  );
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
    if (typeof src === 'string') {
      setImgSrc(src);
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
      <Image
        {...props}
        src={hasError ? fallbackSrc : imgSrc || fallbackSrc}
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

export default SafeImage;
