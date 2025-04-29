import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface ImageResizeOptions {
  minWidth: number;
}

// 간단한 이미지 리사이즈 Extension
const ImageResize = Extension.create<ImageResizeOptions>({
  name: 'imageResize',

  addOptions() {
    return {
      minWidth: 30,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    
    return [
      new Plugin({
        key: new PluginKey('imageResize'),
        props: {
          handleDOMEvents: {
            mousedown(view, event) {
              // 타겟 엘리먼트 확인
              const target = event.target as HTMLElement;
              
              // 리사이즈 핸들이 클릭된 경우만 처리
              if (target.classList.contains('resize-trigger')) {
                // 이미지 컨테이너와 이미지 찾기
                const imgWrapper = target.closest('.image-resizer') as HTMLElement;
                if (!imgWrapper) return false;
                
                const img = imgWrapper.querySelector('img') as HTMLElement;
                if (!img) return false;
                
                // 초기 크기와 마우스 위치 저장
                const startX = event.pageX;
                const startWidth = img.offsetWidth;
                const startHeight = img.offsetHeight;
                const aspectRatio = startWidth / startHeight;

                // 리사이징 중임을 표시하는 클래스 추가
                imgWrapper.classList.add('resizing');
                
                // 마우스 이동 이벤트 핸들러
                const mousemove = (e: MouseEvent) => {
                  // 새 크기 계산 (최소 크기 제한)
                  const newWidth = Math.max(options.minWidth, startWidth + (e.pageX - startX));
                  const newHeight = Math.max(options.minWidth / aspectRatio, newWidth / aspectRatio);
                  
                  // 이미지 스타일 직접 업데이트
                  img.style.width = `${newWidth}px`;
                  img.style.height = `${newHeight}px`;
                  
                  // 커스텀 이벤트 발생 - 크기 변경 알림
                  const resizeEvent = new CustomEvent('image-resize', {
                    detail: {
                      width: newWidth,
                      height: newHeight,
                      element: img
                    },
                    bubbles: true
                  });
                  img.dispatchEvent(resizeEvent);
                  
                  // 선택 방지
                  e.preventDefault();
                };
                
                // 마우스 업 이벤트 핸들러
                const mouseup = () => {
                  // 이벤트 리스너 제거
                  document.removeEventListener('mousemove', mousemove);
                  document.removeEventListener('mouseup', mouseup);
                  
                  // 리사이징 완료 클래스 제거
                  imgWrapper.classList.remove('resizing');
                  
                  // 리사이징 완료 이벤트 발생
                  const resizeEndEvent = new CustomEvent('image-resize-end', {
                    detail: {
                      width: img.offsetWidth,
                      height: img.offsetHeight,
                      element: img
                    },
                    bubbles: true
                  });
                  img.dispatchEvent(resizeEndEvent);
                };
                
                // 글로벌 이벤트 리스너 등록
                document.addEventListener('mousemove', mousemove);
                document.addEventListener('mouseup', mouseup);
                
                // 이벤트 처리 완료
                event.preventDefault();
                event.stopPropagation();
                return true;
              }
              
              return false;
            }
          }
        }
      })
    ];
  }
});

export default ImageResize; 