/**
 * DOM removeChild 오류를 방지하기 위한 전역 유틸리티
 * 모든 페이지에서 'removeChild' 관련 DOM 오류가 발생하지 않도록 합니다.
 */

/**
 * Node.prototype.removeChild를 안전하게 처리하도록 패치합니다.
 * 이 함수는 애플리케이션 시작 시 한 번만 호출하면 됩니다.
 */
export function applyRemoveChildPatch() {
  if (typeof window === 'undefined') return; // 서버 사이드에서는 실행하지 않음

  // 원본 removeChild 메소드 저장
  const originalRemoveChild = Node.prototype.removeChild;

  // removeChild 메소드 오버라이드
  Node.prototype.removeChild = function<T extends Node>(child: T): T {
    if (child && child.parentNode === this) {
      return originalRemoveChild.call(this, child) as T;
    }
    
    // 자식 노드가 아닌 경우 조용히 무시하고 child를 반환
    console.warn(
      'DOM 오류 방지: removeChild가 호출되었지만 해당 노드는 부모의 자식이 아닙니다.',
      { parent: this, child }
    );
    
    return child;
  };
}

/**
 * 이미지 DOM 요소를 안전하게 로드하기 위한 관찰자 설정
 * 이 함수는 애플리케이션 시작 시 한 번만 호출하면 됩니다.
 */
export function setupSafeImageObserver() {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeName === 'IMG') {
          const img = node as HTMLImageElement;
          
          // 이미지 로드 이벤트 오류 처리
          const originalOnError = img.onerror;
          
          // onerror 핸들러 재정의
          img.onerror = function(this: HTMLImageElement, ev: Event | string) {
            // 문자열인 경우를 처리 (오래된 브라우저 호환성)
            const event = typeof ev === 'string' ? new Event(ev) : ev;
            
            if (!this.parentNode) {
              if (event instanceof Event) {
                event.stopPropagation();
              }
            } else if (originalOnError) {
              // 원래 핸들러 호출
              if (typeof originalOnError === 'function') {
                return originalOnError.call(this, event);
              }
            }
          };
        }
      });
    });
  });

  // 문서 전체 관찰 시작
  observer.observe(document.documentElement, { 
    childList: true, 
    subtree: true 
  });

  return observer;
}

/**
 * 기본 이미지 에러 핸들러
 * img 태그에 직접 onError 속성으로 적용할 수 있습니다.
 */
export function safeImageErrorHandler(event: React.SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  
  // 이미지가 DOM에 연결되어 있는지 확인
  if (!img.parentNode) {
    event.stopPropagation();
    return;
  }
  
  // 추가 에러 처리 로직 구현 가능
  // 예: 대체 이미지 설정
  img.src = '/images/placeholder.png';
}

/**
 * 모든 DOM 오류 방지 기능을 초기화합니다.
 * _app.tsx 또는 루트 레이아웃 컴포넌트에서 호출해야 합니다.
 */
export function initDOMErrorPrevention() {
  try {
    applyRemoveChildPatch();
    setupSafeImageObserver();
  } catch (error) {
    console.error('DOM 오류 방지 기능 초기화 실패:', error);
  }
} 