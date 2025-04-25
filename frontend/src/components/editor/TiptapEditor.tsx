'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useState, useRef } from 'react';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import ImageResize from 'tiptap-extension-resize-image';
import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode, NodeType } from 'prosemirror-model';
import { HTMLAttributes } from 'react';

// --- 사용자 정의 이미지 속성 인터페이스 ---
interface CustomImageAttributes extends HTMLAttributes<HTMLElement> {
  'data-id'?: string | null;
  'data-temp-id'?: string | null;
}

// --- Custom Image Extension --- (기본 Image 확장)
const CustomImage = Image.extend({
  // 커스텀 속성 추가
  addAttributes() {
    return {
      // 기본 이미지 속성(src, alt, title 등) 상속
      ...this.parent?.(),

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
});

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onImageUploadSuccess?: (tempId: string) => void; // 이미지 업로드 성공 시 tempId 콜백
  onImageDelete?: (tempId: string) => void; // 에디터에서 이미지 삭제 시 tempId 콜백
}

const TiptapEditor = ({ content = '', onChange, onImageUploadSuccess, onImageDelete }: TiptapEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const linkButtonRef = useRef<HTMLButtonElement>(null);
  const linkModalRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const prevTempIdsRef = useRef<Set<string>>(new Set()); // 에디터 내 현재 이미지들의 tempId 추적

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
        if (node.type.name === 'image') {
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
      // Image 익스텐션을 직접 추가하고 설정합니다.
      CustomImage.configure({
        inline: true,
        allowBase64: true,
        // HTMLAttributes는 여기서 설정하지 않음 (addAttributes에서 관리)
      }),
      ImageResize.configure({
        inline: true,
        allowBase64: true,
        // ImageResize는 리사이징 기능만 담당 (HTMLAttributes 설정 제거, Image 익스텐션에서 관리)
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

  // 에디터 초기 로드시 기존 이미지 추출 (editor 선언 후)
  useEffect(() => {
    if (!editor) return;
    // 에디터가 로드될 때 초기 이미지 상태 설정
    handleImageNodeChanges(editor);
  }, [editor, handleImageNodeChanges]);

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

  // handleUploadFailure 함수를 컴포넌트 스코프로 이동
  const handleUploadFailure = useCallback((editor: Editor | null, tempImageId: string, error: string) => {
    if (!editor) return;
    try {
      const deleteTransaction = editor.state.tr;
      let imagePos = -1;

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs && node.attrs['data-id'] === tempImageId) {
          imagePos = pos;
          return false;
        }
        return true;
      });

      if (imagePos >= 0) {
        deleteTransaction.delete(imagePos, imagePos + 1);
        editor.view.dispatch(deleteTransaction);
      }
    } catch (removeError) {
      console.error('임시 이미지 제거 중 오류:', removeError);
    }
    alert(`이미지 업로드 실패: ${error}\n\n가능한 해결책:\n1. 로그인 상태를 확인해주세요\n2. 다른 이미지를 사용해보세요\n3. 네트워크 연결을 확인해주세요`);
  }, []); // 의존성 없음

  let tempImageId = ''; // 초기값 설정

  const handleUploadPhoto = useCallback(async (files: FileList | null) => {
    if (files === null || !editor || isUploading) return;

    const file = files[0];
    if (!file) return;

    // 파일 크기 제한 (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      alert(`이미지 크기가 너무 큽니다. 5MB 이하의 이미지를 사용해주세요.`);
      return;
    }

    try {
      setIsUploading(true);

      // 서버 상태 확인
      const serverOk = await checkServerStatus();
      if (!serverOk) {
        alert('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      
      // 임시 이미지 ID 할당 (handleUploadPhoto 스코프 내)
      tempImageId = `temp-image-${Date.now()}`;
      
      // 서버로 업로드 전 미리보기 표시 (임시)
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        // 임시 이미지로 우선 표시 (data-id 속성 추가)
        const { view } = editor;
        const { state } = view;
        const { schema } = state;

        // 현재 선택된 위치에 임시 이미지 노드 삽입
        const imageNode = schema.nodes.image.create({
          src: base64,
          'data-id': tempImageId // 이미지 ID를 추가하여 나중에 찾을 수 있게 함
        });

        const transaction = state.tr.replaceSelectionWith(imageNode);
        view.dispatch(transaction);
      };
      reader.readAsDataURL(file);

      // 임시 식별자 생성 (UUID)
      const tempId = crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      // 이미지 엔티티에 저장하기 위한 추가 정보
      formData.append('saveEntity', 'true');
      formData.append('tempId', tempId);
      
      console.log('Uploading image with tempId:', tempId); // 디버깅 로그
      
      // 5초 타임아웃 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        // 백엔드 API 호출
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/images/upload_local`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          credentials: 'include' // 인증 정보 포함
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          let errorMessage = '이미지 업로드에 실패했습니다.';
          
          if (contentType && contentType.indexOf("application/json") !== -1) {
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              console.error('응답 파싱 오류:', e);
            }
          }
          
          console.error(`서버 응답 오류 (상태 코드: ${response.status}):`, errorMessage);
          
          // 상태 코드에 따른 맞춤형 메시지
          const userMessage = errorMessage;
          // 컴포넌트 스코프의 함수 호출
          handleUploadFailure(editor, tempImageId, userMessage);
          return;
        }
        
        // 서버에서 반환된 이미지 URL 및 임시 ID 받기
        const jsonResponse = await response.json();
        const imageUrl = jsonResponse.filePath;
        const serverTempId = jsonResponse.tempId || tempId;

        // 중요: 이미지를 새로 추가하지 않고, 기존 임시 이미지의 src만 업데이트
        const updateTransaction = editor.state.tr;
        let updated = false;
        
        // 문서 내의 이미지 노드를 순회하며 임시 이미지를 찾아 업데이트
        editor.state.doc.descendants((node: ProseMirrorNode, pos: number) => {
          if (node.type.name === 'image' && node.attrs && node.attrs['data-id'] === tempImageId) {
            // 임시 이미지를 찾았으면 URL만 업데이트
            const newAttrs = {
              ...node.attrs,
              src: imageUrl, // URL만 변경
              'data-temp-id': serverTempId // 서버에서 받은 임시 ID 저장
            };
            updateTransaction.setNodeMarkup(pos, undefined, newAttrs);
            updated = true;
            return false; // 찾았으므로 순회 중단
          }
          return true; // 계속 순회
        });
        
        // 트랜잭션 실행
        if (updated) {
          editor.view.dispatch(updateTransaction);
        }

        console.log('Image upload response:', jsonResponse); // 디버깅 로그

        if (response.ok && jsonResponse && jsonResponse.url && jsonResponse.tempId) {
          console.log(`Upload success: URL=${jsonResponse.url}, TempID=${jsonResponse.tempId}`);

          // 에디터 내 임시 이미지 노드 업데이트
          const { view } = editor;
          const { state } = view;
          let imagePos = -1;
          let imageNode: ProseMirrorNode | null = null;

          // data-id (tempImageId)로 임시 이미지 노드 찾기
          state.doc.descendants((node: ProseMirrorNode, pos: number) => {
            if (node.type.name === 'image' && node.attrs && node.attrs['data-id'] === tempImageId) {
              imagePos = pos;
              imageNode = node;
              return false; // 찾았으므로 순회 중단
            }
            return true; // 계속 순회
          });

          if (imagePos >= 0 && imageNode) {
            // 임시 노드 삭제 후, 실제 이미지 노드를 해당 위치에 삽입
            const transaction = state.tr.delete(imagePos, imagePos + 1); // 임시 노드 삭제

            // CustomImage 타입 가져오기 (타입 안전성)
            const imageNodeType = state.schema.nodes.image as NodeType;

            // 새 이미지 노드 생성 (스키마에 정의된 속성 사용)
            const newNode = imageNodeType.create({
              src: jsonResponse.url,
              'data-temp-id': jsonResponse.tempId,
              // 필요하다면 alt, title 등 다른 속성도 추가
            });

            // 삭제된 위치에 새 노드 삽입
            transaction.insert(imagePos, newNode);

            view.dispatch(transaction);

            console.log(`Editor image updated: pos=${imagePos}, tempId=${jsonResponse.tempId}`);

            // 업로드 성공 콜백 호출 (부모 컴포넌트에 tempId 전달)
            onImageUploadSuccess?.(jsonResponse.tempId);
            console.log(`onImageUploadSuccess called with tempId: ${jsonResponse.tempId}`);
          } else {
            console.warn(`Temporary image node not found for data-id: ${tempImageId}`);
            // 임시 노드를 못 찾은 경우, 새 이미지 노드를 그냥 삽입 (대체 처리)
            // setImage 대신 insertContent 또는 직접 노드 생성/삽입 사용 고려
            // 여기서는 focus 후 새 노드를 생성하여 삽입하는 방식 사용
            const imageNodeTypeFallback = editor.state.schema.nodes.image as NodeType;
            const newNodeFallback = imageNodeTypeFallback.create({
                src: jsonResponse.url,
                'data-temp-id': jsonResponse.tempId
            });
            editor.chain().focus().insertContent(newNodeFallback).run();
            onImageUploadSuccess?.(jsonResponse.tempId);
          }
        } else {
          console.error('Upload failed or invalid response:', jsonResponse);
          // 컴포넌트 스코프의 함수 호출
          handleUploadFailure(editor, tempImageId, jsonResponse instanceof Error ? jsonResponse.message : '네트워크 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('이미지 업로드 과정 중 오류:', error);
        // 오류 처리 함수 호출 (스코프 문제 해결됨)
        handleUploadFailure(editor, tempImageId, error instanceof Error ? error.message : '이미지 처리 중 알 수 없는 오류');
      } finally {
        setIsUploading(false);
      }
    } catch (error) {
      console.error('이미지 업로드 과정 중 오류:', error);
      // 오류 처리 함수 호출 (스코프 문제 해결됨)
      handleUploadFailure(editor, tempImageId, error instanceof Error ? error.message : '이미지 처리 중 알 수 없는 오류');
    }
  }, [editor, isUploading, onImageUploadSuccess, onImageDelete, handleUploadFailure]);

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
          height: auto; /* 💡 이거 추가 */
          overflow-y: auto; /* 💡 이것도 추가 (스크롤 가능하게) */
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
        
        /* 기존 image-resizer 스타일은 유지하되 표시방식 변경 */
        .image-resizer {
          display: block;
          position: relative;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          max-width: 100%;
        }
        
        .image-resizer .resize-trigger {
          position: absolute;
          right: -6px;
          bottom: -9px;
          opacity: 0;
          transition: opacity .3s ease;
          color: #3259a5;
          cursor: se-resize;
        }
        
        .image-resizer:hover .resize-trigger {
          opacity: 1;
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
      `}</style>
    </div>
  );
};

export default TiptapEditor;
