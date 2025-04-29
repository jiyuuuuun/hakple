/**
 * 이미지 관련 유틸리티 함수
 */

/**
 * URL에 캐시 무효화 쿼리 파라미터를 추가합니다.
 * @param url 이미지 URL
 * @returns 캐시 무효화 파라미터가 추가된 URL
 */
export const addNoCacheParam = (url: string): string => {
  if (!url) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}nocache=${Date.now()}`;
};

/**
 * 이미지 프리로딩 함수
 * @param src 이미지 URL
 * @returns Promise<void> 이미지 로드 성공/실패 여부
 */
export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('이미지 URL이 제공되지 않았습니다.'));
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

/**
 * Next.js Image 컴포넌트를 사용할 수 없는 환경에서 기본 이미지 URL을 반환합니다.
 * @param size 이미지 크기 (숫자)
 * @param text 이미지에 표시할 텍스트
 * @returns 플레이스홀더 이미지 URL
 */
export const getFallbackImageUrl = (size = 150, text = 'Image'): string => {
  return `https://via.placeholder.com/${size}?text=${encodeURIComponent(text)}`;
};

/**
 * 이미지 URL이 유효한지 확인합니다.
 * @param url 확인할 이미지 URL
 * @returns boolean 유효성 여부
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // 일반적인 이미지 확장자 확인
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const lowerUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowerUrl.endsWith(ext)) ||
    lowerUrl.includes('via.placeholder.com') ||
    lowerUrl.includes('amazonaws.com');
};

/**
 * 이미지 크기를 변경하는 함수
 * URL 파라미터로 크기 조정을 지원하는 서비스(ex: Cloudinary, Imgix 등)에 맞게 커스텀 가능
 * @param url 이미지 URL
 * @param width 원하는 너비
 * @param height 원하는 높이
 * @returns 크기가 조정된 이미지 URL
 */
export const getResizedImageUrl = (url: string, width?: number, height?: number): string => {
  if (!url) return '';
  
  // 플레이스홀더 이미지인 경우
  if (url.includes('via.placeholder.com')) {
    const size = width || height || 150;
    return url.replace(/\/\d+/, `/${size}`);
  }
  
  // Amazon S3 URL인 경우 (예시)
  if (url.includes('amazonaws.com')) {
    return url; // S3 URL은 그대로 반환 (S3 이미지 리사이징을 사용하려면 여기 로직 추가)
  }
  
  return url; // 기본값은 원본 URL 반환
}; 