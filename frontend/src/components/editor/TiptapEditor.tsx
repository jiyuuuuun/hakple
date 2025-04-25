'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useState, useRef } from 'react';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { HTMLAttributes } from 'react';
import { Plugin, PluginKey, NodeSelection } from 'prosemirror-state';

// --- 사용자 정의 이미지 속성 인터페이스 ---
interface CustomImageAttributes extends HTMLAttributes<HTMLElement> {
  'data-id'?: string | null;
  'data-temp-id'?: string | null;
}

/* 리사이즈 핸들 CSS 스타일 */
const resizeHandleStyles = {
  position: 'absolute',
  right: '-8px',
  bottom: '-8px',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  backgroundColor: '#4263EB',
  border: '2px solid white',
  color: 'white',
  fontSize: '10px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'se-resize',
  zIndex: 100,
};

/* 이미지 리사이즈 핸들을 렌더링하는 함수 */
const renderResizeHandle = () => {
  const resizeHandles = document.querySelectorAll('.image-resizer');
  resizeHandles.forEach(container => {
    // 이미 핸들이 있으면 추가하지 않음
    if (container.querySelector('.resize-trigger')) return;
    
    // 핸들 요소 생성
    const handle = document.createElement('div');
    handle.className = 'resize-trigger';
    handle.innerHTML = '⊙';
    
    // 인라인 스타일 적용
    Object.assign(handle.style, resizeHandleStyles);
    
    // 이미지 컨테이너에 핸들 추가
    container.appendChild(handle);
  });
};

// --- Custom Image Extension --- (기본 Image 확장)
const CustomImage = Image.extend({
  name: 'customImage',

  // 커스텀 속성 추가
  addAttributes() {
    return {
      // 기본 이미지 속성(src, alt, title 등) 상속
      ...this.parent?.(),

      // 추가: 너비 속성
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('width'),
        renderHTML: (attributes: { width?: string | number | null }) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      // 추가: 높이 속성
      height: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('height'),
        renderHTML: (attributes: { height?: string | number | null }) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },

      // 추가: 스타일 속성
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('style'),
        renderHTML: (attributes: { style?: string | null }) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },

      // 임시 이미지 식별용 ID
      'data-id': {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-id'),
        renderHTML: (attributes: CustomImageAttributes) => {
          if (!attributes['data-id']) {
            return {};
          }
          return { 'data-id': attributes['data-id'] };
        },
      },

      // 백엔드 임시 저장 ID
      'data-temp-id': {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-temp-id'),
        renderHTML: (attributes: CustomImageAttributes) => {
          if (!attributes['data-temp-id']) {
            return {};
          }
          return { 'data-temp-id': attributes['data-temp-id'] };
        },
      },
    };
  },

  // 렌더링 HTML 수정 - 이미지 리사이저 래퍼 추가
  renderHTML({ HTMLAttributes }) {
    const attrs = { ...HTMLAttributes };
    
    return [
      'div',
      { class: 'image-resizer' },
      ['img', attrs],
    ];
  },

  addProseMirrorPlugins() {
    const minWidth = 30; // 최소 이미지 너비

    return [
      new Plugin({
        key: new PluginKey('customImageResize'), // 키 이름 변경
        props: {
          handleDOMEvents: {
            mousedown: (view, event) => {
              const target = event.target as HTMLElement;

              // 리사이즈 핸들 클릭 시
              if (target.classList.contains('resize-trigger')) {
                event.preventDefault();
                event.stopPropagation();

                const imgWrapper = target.closest('.image-resizer') as HTMLElement;
                if (!imgWrapper) return false;

                const img = imgWrapper.querySelector('img') as HTMLElement;
                if (!img) return false;

                const startX = event.pageX;
                const startWidth = img.offsetWidth;
                const startHeight = img.offsetHeight;
                const aspectRatio = startHeight > 0 ? startWidth / startHeight : 1;

                // ProseMirror 노드 위치 찾기
                let imgPos = -1;
                view.state.doc.descendants((node, pos) => {
                  if (node.type.name === 'customImage') {
                    const dom = view.nodeDOM(pos) as HTMLElement | null;
                    // nodeDOM이 imgWrapper를 포함하는지 확인
                    if (dom && dom === imgWrapper) {
                      imgPos = pos;
                      return false; // 찾으면 중단
                    }
                  }
                  return true;
                });

                if (imgPos === -1) {
                  console.error("Failed to find image node position.");
                  return false;
                }

                // 이미지 노드 선택 (선택적, 시각적 피드백)
                try {
                   const selection = NodeSelection.create(view.state.doc, imgPos);
                   const trSelect = view.state.tr.setSelection(selection);
                   view.dispatch(trSelect);
                } catch(e) {
                   console.warn("Could not select image node during resize start", e);
                }


                imgWrapper.classList.add('resizing');

                const mousemove = (e: MouseEvent) => {
                  const newWidth = Math.max(minWidth, startWidth + (e.pageX - startX));
                  const newHeight = aspectRatio > 0 ? Math.max(minWidth / aspectRatio, newWidth / aspectRatio) : startHeight; // Aspect ratio 유지

                  const node = view.state.doc.nodeAt(imgPos);
                  if (!node) return; // 노드가 유효한지 확인

                  // 트랜잭션 생성 및 디스패치 (ProseMirror 상태 업데이트)
                  const tr = view.state.tr.setNodeMarkup(imgPos, undefined, {
                      ...node.attrs,
                      width: Math.round(newWidth),
                      height: Math.round(newHeight),
                      // 스타일 속성도 업데이트 (선택적)
                      style: `width: ${Math.round(newWidth)}px; height: ${Math.round(newHeight)}px;`,
                  });
                  view.dispatch(tr);
                };

                const mouseup = () => {
                  document.removeEventListener('mousemove', mousemove);
                  document.removeEventListener('mouseup', mouseup);
                  imgWrapper.classList.remove('resizing');
                  // 리사이즈 완료 후 추가 작업 (예: 최종 상태 저장 API 호출)
                };

                document.addEventListener('mousemove', mousemove);
                document.addEventListener('mouseup', mouseup);

                return true; // 이벤트 처리 완료
              }
              return false; // 다른 mousedown 이벤트는 처리 안 함
            },
          },
        },
      }),
    ];
  },
});

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onImageUploadSuccess?: (tempId: string) => void; // 이미지 업로드 성공 시 tempId 콜백
  onImageDelete?: (tempId: string) => void; // 에디터에서 이미지 삭제 시 tempId 콜백
}

interface UploadResponse {
    tempUrl: string;
    tempId: string;
}

interface ErrorResponse {
    message: string;
}

// 재시도 유틸리티 함수
const retryOperation = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> => {
    let lastError: Error | undefined;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }
    }
    throw lastError;
};

const TiptapEditor = ({ content = '', onChange, onImageUploadSuccess, onImageDelete }: TiptapEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const linkButtonRef = useRef<HTMLButtonElement>(null);
  const linkModalRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const prevTempIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 모달 외부 클릭 감지를 위한 이벤트 핸들러
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLinkModal &&
        linkModalRef.current &&
        !linkModalRef.current.contains(event.target as Node) &&
        linkButtonRef.current &&
        !linkButtonRef.current.contains(event.target as Node)) {
        setShowLinkModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLinkModal]);

  // 이미지 제거 감지 및 부모 컴포넌트에 알림
  const handleImageNodeChanges = useCallback(
    (editorInstance: Editor) => {
      if (!editorInstance) return;

      const currentTempIds = new Set<string>();
      editorInstance.state.doc.descendants((node: ProseMirrorNode) => {
        if (node.type.name === 'customImage') {
          // data-temp-id 속성에 저장된 실제 tempId 사용
          const tempId = node.attrs['data-temp-id'];
          if (tempId && typeof tempId === 'string') {
            currentTempIds.add(tempId);
          }
        }
        return true;
      });

      const prevSet = prevTempIdsRef.current;

      // 제거된 이미지 찾기: 이전 목록에는 있었지만 현재 목록에는 없는 ID
      prevSet.forEach(prevId => {
        if (!currentTempIds.has(prevId)) {
          console.log(`Image removed with tempId: ${prevId}`);
          onImageDelete?.(prevId); // 부모 컴포넌트에 삭제 알림
        }
      });

      // 현재 이미지 목록으로 업데이트
      prevTempIdsRef.current = new Set(currentTempIds);
    },
    [onImageDelete] // onImageDelete가 변경될 때만 함수 재생성
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit에는 기본적인 익스텐션만 포함 (Image 설정 제거)
      }),
      // CustomImage 확장 설정
      CustomImage.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-blue-500 hover:text-blue-600 underline'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
        defaultAlignment: 'left',
      }),
      Underline,
      Placeholder.configure({
        placeholder: '당신의 이야기를 적어보세요...',
        emptyEditorClass: 'is-editor-empty',
        emptyNodeClass: 'is-empty',
        showOnlyCurrent: true,
        includeChildren: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
      handleImageNodeChanges(editor);
    },
    immediatelyRender: false,
  });

  // Prop으로 받은 content가 변경될 때 에디터 내용 업데이트
  useEffect(() => {
    // 에디터 인스턴스가 있고, 외부 content와 내부 HTML이 다를 때만 업데이트
    if (editor && content !== editor.getHTML()) {
      // false 인자는 onUpdate 콜백 반복 호출 방지
      editor.commands.setContent(content, false);
    }
    // editor나 content가 변경될 때마다 이 effect 실행
  }, [content, editor]);

  // 에디터 초기 로드시 기존 이미지 추출 (editor 선언 후)
  useEffect(() => {
    if (!editor) return;
    // 에디터가 로드될 때 초기 이미지 상태 설정
    handleImageNodeChanges(editor);
  }, [editor, handleImageNodeChanges]);

  // 이미지 렌더링 후 리사이즈 핸들 추가를 위한 useEffect
  useEffect(() => {
    if (!editor) return;

    // 에디터 업데이트 시 리사이즈 핸들 렌더링 (필요 시)
    const handleUpdate = () => {
      // DOM 업데이트 후 핸들 렌더링 보장
      requestAnimationFrame(() => {
         renderResizeHandle();
      });
    };

    editor.on('update', handleUpdate);

    // 초기 로딩 시에도 핸들 렌더링
    handleUpdate();

    return () => {
      editor.off('update', handleUpdate);
    };
    // renderResizeHandle 함수 자체는 의존성이 아님
  }, [editor]);

  // 추가: 백엔드 서버 상태 확인 함수
  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/images/health`, {
        method: 'GET',
        credentials: 'include'
      });
      return response.ok;
    } catch (error) {
      console.error("서버 상태 확인 실패:", error);
      return false;
    }
  };
  
  const handleUploadPhoto = useCallback(async (files: FileList | null) => {
    if (files === null || !editor || isUploading) return;

    const file = files[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert(`이미지 크기가 너무 큽니다. 5MB 이하의 이미지를 사용해주세요.`);
      setIsUploading(false);
      return;
    }

    const tempId = crypto.randomUUID();
    let insertPos: number | null = null;

    try {
      setIsUploading(true);

      const serverOk = await checkServerStatus();
      if (!serverOk) {
        alert('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        setIsUploading(false);
        return;
      }

      // 로딩 이미지 표시
      const loadingNode = editor.schema.nodes.customImage.create({
        src: '/images/loading.gif',
        'data-temp-id': tempId
      });

      // 현재 커서 위치에 노드 삽입하고 그 위치 저장
      insertPos = editor.state.selection.from;
      editor.chain().focus().insertContentAt(insertPos, loadingNode).run();

      // 삽입 직후 노드 상태 확인 로그 (유지)
      console.log('Immediately after insert, checking nodes at pos:', insertPos);
      const nodeRightAfter = editor.state.doc.nodeAt(insertPos);
      if (nodeRightAfter) {
        console.log('Found node right after insert:', nodeRightAfter.type.name, nodeRightAfter.attrs);
      }

      // 이미지 업로드 함수
      const uploadImage = async (): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tempId', tempId);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/images/upload_temp`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '업로드 실패' })) as ErrorResponse;
          throw new Error(errorData.message || '이미지 업로드에 실패했습니다.');
        }

        return await response.json();
      };

      // 재시도 로직으로 업로드 실행
      const result = await retryOperation(uploadImage);
      console.log('Image upload response:', result);

      // 업로드 성공 시 이미지 노드 업데이트
      if (result && result.tempUrl) {
        console.log('Attempting to update image node using insertPos:', insertPos, 'with url:', result.tempUrl);

        const updateTr = editor.state.tr;
        const nodeAtInsertPos = insertPos !== null ? editor.state.doc.nodeAt(insertPos) : null;

        // 저장된 위치의 노드가 유효하고 tempId가 일치하는지 확인
        if (insertPos !== null && nodeAtInsertPos && nodeAtInsertPos.type.name === 'customImage' && nodeAtInsertPos.attrs['data-temp-id'] === tempId) {
          console.log('Node found at insertPos matches tempId. Updating.');
          const newAttrs = {
            ...nodeAtInsertPos.attrs,
            src: result.tempUrl,
            // 'data-temp-id': null // 필요하다면 업데이트 후 tempId 제거
          };
          updateTr.setNodeMarkup(insertPos, undefined, newAttrs);
          console.log('Dispatching transaction to update editor view.');
          editor.view.dispatch(updateTr);
          onImageUploadSuccess?.(tempId);
        } else {
          // Fallback: 저장된 위치에서 못 찾으면 tempId로 다시 검색
          console.warn('Node at insertPos mismatch or not found. Falling back to search by tempId. Node found:', nodeAtInsertPos?.attrs);
          let updatedFallback = false;
          const fallbackTr = editor.state.tr;
          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'customImage' && node.attrs['data-temp-id'] === tempId) {
              console.log('Fallback search found node at pos:', pos);
              const newAttrs = { ...node.attrs, src: result.tempUrl }; // 'data-temp-id': null
              fallbackTr.setNodeMarkup(pos, undefined, newAttrs);
              updatedFallback = true;
              return false;
            }
            return true;
          });

          if (updatedFallback) {
            console.log('Dispatching fallback transaction.');
            editor.view.dispatch(fallbackTr);
            onImageUploadSuccess?.(tempId);
          } else {
            console.error('Failed to update image node using both insertPos and fallback search for tempId:', tempId);
            // 실패 시 로딩 이미지 제거 로직 추가 필요 (아래 catch 블록 참조)
          }
        }
      } else {
        console.warn('Upload result or tempUrl missing:', result);
        // 실패 시 로딩 이미지 제거 필요
        if (insertPos !== null) {
            const deleteTr = editor.state.tr;
            const nodeAtInsertPos = editor.state.doc.nodeAt(insertPos);
            if (nodeAtInsertPos && nodeAtInsertPos.type.name === 'customImage' && nodeAtInsertPos.attrs['data-temp-id'] === tempId) {
                deleteTr.delete(insertPos, insertPos + nodeAtInsertPos.nodeSize);
                editor.view.dispatch(deleteTr);
            } // 필요시 tempId 검색으로 fallback 삭제 추가
        }
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error);

      let errorMessage = '이미지 업로드에 실패했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message.includes('401') ? '세션이 만료되었습니다. 다시 로그인해주세요.' : error.message;
      }

      // 실패한 로딩 이미지 노드 제거 (insertPos null 체크 추가)
      if (insertPos !== null) {
          let deleted = false;
          const deleteTr = editor.state.tr;
          const nodeAtInsertPosOnFail = editor.state.doc.nodeAt(insertPos);

          if (nodeAtInsertPosOnFail && nodeAtInsertPosOnFail.type.name === 'customImage' && nodeAtInsertPosOnFail.attrs['data-temp-id'] === tempId) {
              deleteTr.delete(insertPos, insertPos + nodeAtInsertPosOnFail.nodeSize);
              deleted = true;
          } else {
              // Fallback: 위치로 못찾으면 tempId로 검색해서 삭제
              editor.state.doc.descendants((node, pos) => {
                  if (node.type.name === 'customImage' && node.attrs['data-temp-id'] === tempId) {
                      deleteTr.delete(pos, pos + node.nodeSize);
                      deleted = true;
                      return false;
                  }
                  return true;
              });
          }

          if (deleted) {
              console.log('Deleting failed/loading image node.');
              editor.view.dispatch(deleteTr);
          }
      }

      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [editor, isUploading, onImageUploadSuccess]);

  const addImage = useCallback(() => {
    if (!isMounted || !editor) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      handleUploadPhoto((e.target as HTMLInputElement).files);
      input.value = '';
    };
    input.click();
  }, [editor, handleUploadPhoto, isMounted]);

  const addLink = useCallback(() => {
    if (!editor) return;

    // 모달 열기
    setLinkUrl('');
    setShowLinkModal(true);
  }, [editor]);

  // 링크 모달에서 취소 버튼 클릭 시 처리하는 함수
  const handleLinkCancel = useCallback(() => {
    setShowLinkModal(false);
    setLinkUrl('');
  }, []);

  // 링크 모달에서 확인 버튼 클릭 시 처리하는 함수
  const handleLinkConfirm = useCallback(() => {
    if (!editor || !linkUrl.trim()) return;

    // HTML 앵커 태그로 감싸서 삽입
    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a>`;
    editor.chain().focus().insertContent(linkHtml).run();

    // 모달 닫기
    setShowLinkModal(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  if (!editor || !isMounted) return null;

  return (
    <div className="prose max-w-none codemirror-like-editor">
      <div className="flex items-center p-[12px] border-b w-full bg-[#ffffff]">
        <div className="flex mr-2">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 hover:bg-gray-300 border-none outline-none ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300 text-black' : 'text-gray-600 bg-transparent'}`}
            title="제목 1"
          >
            <span className="text-lg font-semibold">H1</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 hover:bg-gray-300 border-none outline-none ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 text-black' : 'text-gray-600 bg-transparent'}`}
            title="제목 2"
          >
            <span className="text-lg font-semibold">H2</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 hover:bg-gray-300 border-none outline-none ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 text-black' : 'text-gray-600 bg-transparent'}`}
            title="제목 3"
          >
            <span className="text-lg font-semibold">H3</span>
          </button>
        </div>

        <div className="flex items-center mx-2 text-gray-400">
          <span>|</span>
        </div>

        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
          title="굵게"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>format_bold</span>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
          title="기울임"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>format_italic</span>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${editor.isActive('underline') ? 'bg-gray-300' : ''}`}
          title="밑줄"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>format_underlined</span>
        </button>

        <div className="flex items-center mx-2 text-gray-400">
          <span>|</span>
        </div>

        <div className="flex mx-1">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 hover:bg-gray-300 border-none outline-none bg-transparent ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''}`}
            title="왼쪽 정렬"
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>format_align_left</span>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 hover:bg-gray-300 border-none outline-none bg-transparent ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
            title="가운데 정렬"
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>format_align_center</span>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 hover:bg-gray-300 border-none outline-none bg-transparent ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
            title="오른쪽 정렬"
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>format_align_right</span>
          </button>
        </div>

        <div className="flex items-center mx-2 text-gray-400">
          <span>|</span>
        </div>

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${editor.isActive('blockquote') ? 'bg-gray-300' : ''}`}
          title="인용구"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>format_quote</span>
        </button>

        <button
          onClick={addLink}
          ref={linkButtonRef}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${editor.isActive('link') ? 'bg-gray-300' : ''}`}
          title="링크"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>link</span>
        </button>

        <button
          onClick={addImage}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="이미지"
          disabled={isUploading}
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>{isUploading ? 'hourglass_empty' : 'image'}</span>
        </button>

        <div className="flex items-center mx-2 text-gray-400">
          <span>|</span>
        </div>

        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${editor.isActive('codeBlock') ? 'bg-gray-300' : ''}`}
          title="코드 블록"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>code</span>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
          title="글머리 기호"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>format_list_bulleted</span>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`}
          title="번호 매기기"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>format_list_numbered</span>
        </button>
      </div>

      <div className="CodeMirror-scroll" ref={editorContainerRef}>
        <div className="CodeMirror-sizer">
          <div style={{ position: 'relative', top: '0px' }}>
            <div className="CodeMirror-lines" role="presentation">
              <div role="presentation" style={{ position: 'relative', outline: 'none' }}>
                <div className="tiptap-content-wrapper">
                  <EditorContent className="h-full" editor={editor} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 링크 삽입 모달 */}
      {showLinkModal && (
        <div className="absolute z-50" style={{
          top: linkButtonRef.current ? linkButtonRef.current.offsetTop + linkButtonRef.current.offsetHeight + 5 : 0,
          left: linkButtonRef.current ? linkButtonRef.current.offsetLeft : 0,
        }} ref={linkModalRef}>
          <div className="bg-[#ffffff] p-4 rounded-lg shadow-lg border border-gray-200" style={{ width: '320px' }}>
            <h3 className="text-base font-medium mb-3 m-[10px]">링크 삽입</h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="URL 입력"
              className="w-full px-3 py-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-[#980ffa] m-[10px]"
              style={{ width: '270px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLinkConfirm();
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleLinkCancel}
                className="px-3 py-1 bg-gray-200 text-[#000000] rounded hover:bg-gray-300 m-[10px] border-none rounded-[10px] p-[5px]"
              >
                취소
              </button>
              <button
                onClick={handleLinkConfirm}
                className="px-3 py-1 bg-[#980ffa] text-[#ffffff] rounded hover:bg-[#8e44ad] m-[10px] border-none  rounded-[10px] p-[5px]"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
        
        .codemirror-like-editor {
          font-family: monospace;
          height: 100%;
          font-size: 14px;
          position: relative;
        }
        
        .CodeMirror-scroll {
          min-height: 300px;
          border: 1px solid #F9FAFB;
          border-radius: 4px;
          overflow: auto;
          position: relative;
          background: #ffffff;
          padding: 16px;
        }
        
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #aaa;
          pointer-events: none;
          height: 0;
        }
        
        .ProseMirror {
          outline: none;
          padding: 8px;
          caret-color: #000;
          min-height: calc(100% - 16px);
          background: #ffffff;
        }
        
        .ProseMirror p.is-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #aaa;
          pointer-events: none;
          height: 0;
        }
        
        .tiptap-content-wrapper {
          background: #ffffff;
          border-radius: 15px;
          height: 100%;
          overflow: hidden;
        }
        
        .tiptap-content-wrapper .ProseMirror {
          outline: none;
          height: auto;
          overflow-y: auto;
          min-height: 300px;
          padding: 16px 20px;
          background: #ffffff;
        }
        
        .ProseMirror p.is-empty:first-child::before {
          color: #9ca3af;
          content: "당신의 이야기를 적어보세요...";
        }
        
        .tiptap-content-wrapper .ProseMirror {
          outline: none;
        }
        
        .tiptap-content-wrapper img {
          max-width: 100%;
          margin: 0 auto;
          display: block;
        }
        
        /* 전역 정렬 스타일 추가 */
        [data-text-align=center] {
          text-align: center !important;
        }
        
        [data-text-align=right] {
          text-align: right !important;
        }
        
        [data-text-align=left] {
          text-align: left !important;
        }
        
        /* 이미지 정렬 관련 스타일 수정 */
        .tiptap-content-wrapper [data-text-align=center],
        .tiptap-content-wrapper [style*="text-align: center"] {
          text-align: center !important;
        }
        
        .tiptap-content-wrapper [data-text-align=right],
        .tiptap-content-wrapper [style*="text-align: right"] {
          text-align: right !important;
        }
        
        .tiptap-content-wrapper [data-text-align=left],
        .tiptap-content-wrapper [style*="text-align: left"] {
          text-align: left !important;
        }
        
        .tiptap-content-wrapper img {
          max-width: 100%;
          display: block;
        }
        
        .tiptap-content-wrapper [data-text-align=center] img {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        
        .tiptap-content-wrapper [data-text-align=right] img {
          margin-left: auto !important;
          margin-right: 0 !important;
        }
        
        .tiptap-content-wrapper [data-text-align=left] img {
          margin-left: 0 !important;
          margin-right: auto !important;
        }
        
        /* CSS 커서 스타일 추가 */
        img {
          cursor: pointer; /* 이미지에 마우스 올리면 포인터 커서로 변경 */
        }
        
        /* 이미지 리사이저 스타일 강화 */
        .image-resizer {
          display: block;
          position: relative;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          max-width: 100%;
          /* 이미지 외곽선 추가로 리사이즈 대상 명확하게 표시 */
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
          border-radius: 2px;
          overflow: visible;
        }
        
        /* 리사이징 중인 이미지에 강조 표시 */
        .image-resizer.resizing {
          outline: 2px solid #4263EB;
          box-shadow: 0 0 8px rgba(66, 99, 235, 0.5);
        }
        
        /* 리사이즈 핸들 스타일 더 두드러지게 */
        .image-resizer .resize-trigger {
          position: absolute !important;
          right: -8px !important;
          bottom: -8px !important;
          width: 16px !important;
          height: 16px !important;
          border-radius: 50% !important;
          background-color: #4263EB !important;
          border: 2px solid white !important;
          color: white !important;
          font-size: 10px !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          cursor: se-resize !important;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 9999 !important;
          box-shadow: 0 0 3px rgba(0, 0, 0, 0.5) !important;
          transform: translate(0, 0) !important;
          pointer-events: auto !important;
        }
        
        .image-resizer:hover .resize-trigger {
          opacity: 1 !important; /* !important 추가 */
        }
        
        /* 드래그 중에는 항상 표시 */
        .image-resizer:active .resize-trigger {
          opacity: 1 !important; /* !important 추가 */
        }
        
        /* ProseMirror 선택 노드일 때 항상 표시 */
        .ProseMirror-selectednode .resize-trigger {
          opacity: 1 !important;
        }
        
        /* 이미지가 선택됐을 때 하이라이트 효과 */
        .image-resizer.ProseMirror-selectednode {
          outline: 2px solid #4263EB;
          border-radius: 2px;
        }
        
        .tiptap-content-wrapper h1,
        .tiptap-content-wrapper h2,
        .tiptap-content-wrapper h3,
        .tiptap-content-wrapper h4,
        .tiptap-content-wrapper h5,
        .tiptap-content-wrapper h6 {
          font-weight: bold;
          margin: 0.8em 0 0.5em;
        }
        
        .tiptap-content-wrapper blockquote {
          border-left: 3px solid #000000;
          padding-left: 1em;
          margin-left: 0;
        }
        
        .tiptap-content-wrapper pre {
          background-color: #f5f5f5;
          padding: 0.5em;
          border-radius: 4px;
          font-family: 'Courier New', Courier, monospace;
          border: 1px solid #F9FAFB;
        }
        
        .tiptap-content-wrapper ul,
        .tiptap-content-wrapper ol {
          padding-left: 1em;
        }
        
        .tiptap-content-wrapper ul li::marker,
        .tiptap-content-wrapper ol li::marker {
          color: #000000 !important;
        }
        
        /* 추가 강화 스타일 */
        .ProseMirror ul li::marker,
        .ProseMirror ol li::marker {
          color: #000000 !important;
        }
        
        /* 추가: 에디터 내부의 모든 마커에 강제 적용 */
        .ProseMirror ul li::before,
        .ProseMirror ol li::before,
        .ProseMirror ul li::marker,
        .ProseMirror ol li::marker,
        .ProseMirror ul > li,
        .ProseMirror ol > li,
        .tiptap-content-wrapper ul > li,
        .tiptap-content-wrapper ol > li {
          color: #000000 !important;
        }
        
        /* 에디터 특정 버튼 클릭 후 생성되는 요소에 직접 적용 */
        .ProseMirror ul,
        .ProseMirror ol {
          color: #000000 !important;
        }
        
        /* 특정 리스트 유형에 대한 명시적 스타일 */
        .ProseMirror ul {
          list-style-type: disc !important;
        }
        
        .ProseMirror ol {
          list-style-type: decimal !important;
        }
        
        /* 에디터 내부 요소들에 대한 색상 정의 강화 */
        .ProseMirror h1,
        .ProseMirror h2, 
        .ProseMirror h3,
        .ProseMirror blockquote,
        .ProseMirror ul li::marker,
        .ProseMirror ol li::marker {
          color: #000000 !important;
        }

        /* 헤딩 태그에 명확한 크기 지정 */
        .ProseMirror h1 {
          font-size: 28px !important;
          line-height: 1.2;
          margin-top: 0.8em;
          margin-bottom: 0.5em;
        }
        
        .ProseMirror h2 {
          font-size: 24px !important;
          line-height: 1.3;
          margin-top: 0.7em;
          margin-bottom: 0.5em;
        }
        
        .ProseMirror h3 {
          font-size: 20px !important;
          line-height: 1.4;
          margin-top: 0.6em;
          margin-bottom: 0.5em;
        }
        
        /* tiptap-content-wrapper에도 동일하게 적용 */
        .tiptap-content-wrapper h1 {
          font-size: 28px !important;
          line-height: 1.2;
        }
        
        .tiptap-content-wrapper h2 {
          font-size: 24px !important;
          line-height: 1.3;
        }
        
        .tiptap-content-wrapper h3 {
          font-size: 20px !important;
          line-height: 1.4;
        }
        
        /* 이미지 내부 img 태그 스타일 */
        .image-resizer img {
          display: block;
          max-width: 100%;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default TiptapEditor;
