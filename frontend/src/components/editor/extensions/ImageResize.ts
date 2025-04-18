import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { NodeSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet, EditorView } from '@tiptap/pm/view';

export interface ImageResizeOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
  resizeIcon: string;
  handleClasses: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageResize: {
      /**
       * Add an image
       */
      setImage: (options: { src: string; alt?: string; title?: string }) => ReturnType;
    };
  }
}

const ImageResize = Node.create<ImageResizeOptions>({
  name: 'image',

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
      resizeIcon: '⊙',
      handleClasses: '',
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      textAlign: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
      {
        tag: 'image-resizer',
        getAttrs: node => {
          const img = node as HTMLElement;
          const container = img.closest('.image-resizer') || img;
          
          // 텍스트 정렬 추출
          let textAlign = null;
          if (container.hasAttribute('data-text-align')) {
            textAlign = container.getAttribute('data-text-align');
          } else if (container.hasAttribute('style')) {
            const styleAttr = container.getAttribute('style') || '';
            if (styleAttr.includes('text-align')) {
              const match = styleAttr.match(/text-align:\s*([^;]+)/);
              if (match && match[1]) {
                textAlign = match[1].trim();
              }
            }
          }
          
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width: img.getAttribute('width'),
            height: img.getAttribute('height'),
            textAlign: textAlign,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const resizerId = `image-resizer-${Math.floor(Math.random() * 10000)}`;
    const containerAttributes: Record<string, string> = {
      class: 'image-resizer',
      id: resizerId,
    };
    
    // 텍스트 정렬이 있으면 두 가지 방식으로 적용
    if (HTMLAttributes.textAlign) {
      // 데이터 속성 추가
      containerAttributes['data-text-align'] = HTMLAttributes.textAlign;
      // 인라인 스타일로도 추가
      containerAttributes['style'] = `text-align: ${HTMLAttributes.textAlign}`;
    }
    
    // img 태그용 속성 생성
    const imgAttributes = { ...this.options.HTMLAttributes };
    
    // HTMLAttributes에서 textAlign 분리 (이미지에는 불필요)
    const { textAlign, ...restAttributes } = HTMLAttributes;
    
    return [
      'image-resizer',
      containerAttributes,
      ['img', mergeAttributes(imgAttributes, restAttributes)],
      ['div', { class: `resize-trigger ${this.options.handleClasses}` }, this.options.resizeIcon],
    ];
  },

  addCommands() {
    return {
      setImage:
        options =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addProseMirrorPlugins() {
    const { resizeIcon, handleClasses } = this.options;
    
    return [
      new Plugin({
        key: new PluginKey('imageResize'),
        props: {
          handleDOMEvents: {
            mousedown(view, event) {
              const { state, dispatch } = view;
              const target = event.target as HTMLElement;
              
              // 리사이즈 핸들이 클릭된 경우
              if (target.classList.contains('resize-trigger') || 
                  target.classList.contains(handleClasses) || 
                  target.textContent === resizeIcon) {
                
                const imgWrapper = target.closest('.image-resizer') as HTMLElement;
                if (!imgWrapper) return false;
                
                const img = imgWrapper.querySelector('img') as HTMLElement;
                if (!img) return false;
                
                // 초기 크기와 마우스 위치 저장
                const startX = event.pageX;
                const startY = event.pageY;
                const startWidth = img.offsetWidth;
                const startHeight = img.offsetHeight;
                
                // 비율 계산
                const aspectRatio = startWidth / startHeight;
                
                // 이미지 노드 선택
                const imgPos = view.posAtDOM(img, 0);
                const $pos = state.doc.resolve(imgPos);
                const imageNode = state.doc.nodeAt($pos.pos);
                
                if (!imageNode) return false;
                
                const mousemove = (e: MouseEvent) => {
                  // 크기 계산
                  const newWidth = startWidth + (e.pageX - startX);
                  const newHeight = newWidth / aspectRatio;
                  
                  // 이미지 크기 업데이트
                  img.style.width = `${newWidth}px`;
                  img.style.height = `${newHeight}px`;
                  
                  // Tiptap 노드 속성 업데이트
                  dispatch(
                    state.tr.setNodeMarkup(imgPos, undefined, {
                      ...imageNode.attrs,
                      width: newWidth,
                      height: newHeight,
                    })
                  );
                };
                
                const mouseup = () => {
                  document.removeEventListener('mousemove', mousemove);
                  document.removeEventListener('mouseup', mouseup);
                };
                
                document.addEventListener('mousemove', mousemove);
                document.addEventListener('mouseup', mouseup);
                
                return true;
              }
              
              return false;
            },
          },
        },
      }),
    ];
  },
});

export default ImageResize; 