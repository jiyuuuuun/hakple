'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'

// TiptapEditor를 동적으로 불러오기 (SSR 비활성화)
const TiptapEditor = dynamic(() => import('@/components/editor/TiptapEditor'), { ssr: false })

// 게시글 타입 정의
type BoardType = 'free' | 'notice';

// --- 태그 입력 컴포넌트 ---
interface TagInputProps {
    tags: string[]
    onTagsChange: (tags: string[]) => void
}

/**
 * IME(Input Method Editor)란?
 * - 한글, 중국어, 일본어 등과 같은 조합형 문자를 입력할 때 사용되는 입력 방식
 * - 예: 한글 '가'를 입력할 때 'ㄱ'+'ㅏ'를 조합하는 과정이 있음
 * - IME 입력 중에는 composition 이벤트가 발생하며, 조합이 끝나기 전에 Enter나 다른 키 이벤트가
 *   중간에 처리되면 원치 않는 동작이 발생할 수 있음 (마지막 글자만 별도 태그로 추가되는 문제)
 */

// 문자열을 태그로 변환하는 헬퍼 함수 - 절대 분리하지 않음
const sanitizeTag = (input: string): string => {
    // 1. 입력값 유효성 검사
    // 인풋이 없거나 공백인 경우 빈 문자열 반환
    if (!input || typeof input !== 'string') return ''

    // 2. 앞뒤 공백 제거
    const trimmed = input.trim()
    if (!trimmed) return ''

    // 3. #으로 시작하면 # 제거
    return trimmed.startsWith('#') ? trimmed.substring(1).trim() : trimmed
}

const TagInput: React.FC<TagInputProps> = ({ tags, onTagsChange }) => {
    // 상태 관리
    const [inputValue, setInputValue] = useState('') // 입력 필드 값
    const [isComposing, setIsComposing] = useState(false) // IME 입력 상태 (조합 중인지 여부)

    /**
     * 입력 필드 변경 처리 함수
     * 순서:
     * 1. 입력값 가져오기
     * 2. 쉼표가 포함된 경우 특별 처리
     * 3. 일반 입력의 경우 상태 업데이트
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value

        // 쉼표가 포함된 경우 특별 처리 (태그 추가)
        if (value.includes(',')) {
            // 쉼표를 기준으로 분리
            const parts = value.split(',')
            if (parts.length > 1) {
                // 마지막 부분을 제외한 모든 부분은 태그로 추가
                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i].trim()
                    if (part) {
                        addTag(part) // 태그 추가
                    }
                }
                // 마지막 부분은 새 입력값으로 설정
                setInputValue(parts[parts.length - 1])
                return
            }
        }

        // 일반적인 경우 입력값 업데이트
        setInputValue(value)
    }

    /**
     * 태그 추가 핵심 함수
     * 순서:
     * 1. 입력값 검증
     * 2. 태그 생성 (sanitizeTag 함수 사용)
     * 3. 중복 검사
     * 4. 태그 추가 및 결과 반환
     */
    const addTag = (rawInput: string) => {
        // 1. 입력값 검증
        if (!rawInput || !rawInput.trim()) return false

        // 2. 태그 생성
        const newTag = sanitizeTag(rawInput)
        if (!newTag) return false

        // 3. 중복 검사
        if (tags.includes(newTag)) return false

        // 4. 태그 추가
        onTagsChange([...tags, newTag])
        return true
    }

    /**
     * 현재 입력값으로 태그 추가
     * - addTag 함수를 호출하여 현재 입력값을 태그로 추가
     * - 성공하면 입력 필드 초기화
     */
    const addCurrentTag = () => {
        if (addTag(inputValue)) {
            setInputValue('') // 성공적으로 추가된 경우만 입력값 초기화
        }
    }

    /**
     * 키 입력 처리 함수
     * 순서:
     * 1. IME 입력 중인지 확인
     * 2. 엔터키 처리
     * 3. 쉼표 처리
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // IME 입력 중이면 처리하지 않음 - 이것이 매우 중요!
        // 한글 등의 조합 문자가 완성되기 전에 이벤트가 발생하면 잘못된 입력이 될 수 있음
        if (isComposing) return

        if (e.key === 'Enter') {
            e.preventDefault()
            addCurrentTag()
        } else if (e.key === ',') {
            e.preventDefault()
            // 쉼표 입력은 handleInputChange에서 처리되므로 여기서는 아무것도 하지 않음
        }
    }

    /**
     * IME 입력 시작 이벤트 처리
     * - 조합형 문자 입력이 시작될 때 호출됨
     * - 한글/중국어/일본어 등 입력 시 활성화
     */
    const handleCompositionStart = () => {
        setIsComposing(true)
    }

    /**
     * IME 입력 종료 이벤트 처리
     * - 조합형 문자 입력이 완료될 때 호출됨
     * - 입력이 완료된 후 상태 업데이트
     */
    const handleCompositionEnd = () => {
        setIsComposing(false)
    }

    /**
     * 포커스가 벗어날 때 태그 추가
     * - 입력 필드에서 포커스가 빠져나갈 때 호출됨
     * - IME 입력 중이 아닌 경우에만 태그 추가
     */
    const handleBlur = () => {
        if (inputValue.trim() && !isComposing) {
            addCurrentTag()
        }
    }

    /**
     * 태그 삭제 함수
     * - 특정 태그를 배열에서 제거
     */
    const removeTag = (tagToRemove: string) => {
        const updatedTags = tags.filter((tag) => tag !== tagToRemove)
        onTagsChange(updatedTags)
    }

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2 w-full border border-gray-100 rounded-[15px] py-3 px-4 bg-[#fcfaff] transition-all duration-300 hover:border-[#980ffa]/30 hover:shadow-md group">
                {tags.map((tag, index) => (
                    <div
                        key={`tag-${index}-${tag}`}
                        className="flex items-center gap-1.5 bg-white border border-purple-200 text-[#9C50D4] rounded-full px-3 py-1.5 cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all group/tag"
                        onClick={() => removeTag(tag)}
                        title="클릭하여 제거"
                    >
                        <span className="text-sm font-medium">#{tag}</span>
                        <span className="material-icons text-sm opacity-0 group-hover/tag:opacity-100 transition-opacity">close</span>
                    </div>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    placeholder="태그 입력 (쉼표 또는 엔터키로 등록)"
                    className="flex-grow min-w-[180px] py-1.5 px-3 text-sm focus:outline-none border-none bg-transparent placeholder:text-gray-400"
                />
            </div>
            <p className="text-xs text-gray-500 mt-2 ml-1">
                각 태그는 20자 이내로 입력해주세요
            </p>
        </div>
    )
}

// --- 게시글 수정 페이지 컴포넌트 ---
const EditPostPage = () => {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const typeParam = searchParams.get('type') || 'free'
    const academyCode = searchParams.get('academyCode') // academyCode를 URL에서 가져옴
    const postId = params.id as string
    const { isLogin, loginMember } = useGlobalLoginMember()

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [boardType, setBoardType] = useState<BoardType>('free')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)
    const [adminCheckComplete, setAdminCheckComplete] = useState(false)
    const [tempIdList, setTempIdList] = useState<string[]>([]) // 새로 업로드된 임시 이미지 ID 목록
    const [initialImageUrls, setInitialImageUrls] = useState<string[]>([]) // 초기에 로드된 이미지 URL 목록

    // 관리자 여부 확인
    useEffect(() => {
        const checkAdminPermission = async () => {
            if (isLogin && loginMember) {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/check`, {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const isAdminResult = await response.json();
                        setIsAdmin(isAdminResult === true);
                    }
                } catch (error) {
                    console.error('관리자 권한 확인 중 오류 발생:', error);
                } finally {
                    setAdminCheckComplete(true);
                }
            } else {
                setAdminCheckComplete(true);
            }
        };
        
        checkAdminPermission();
    }, [isLogin, loginMember]);

    // 관리자 권한 체크 후 공지사항 수정 권한 확인
    useEffect(() => {
        // 관리자 권한 체크와 게시글 타입 확인이 모두 완료된 경우에만 실행
        if (adminCheckComplete && boardType === 'notice' && !isAdmin && !isLoading) {
            // 관리자가 아닌데 공지사항을 수정하려는 경우 상세 페이지로 리다이렉트
            console.log('관리자 권한이 없어 공지사항을 수정할 수 없습니다. 상세 페이지로 이동합니다.');
            router.push(`/post/${postId}`);
        }
    }, [adminCheckComplete, isAdmin, boardType, isLoading, postId, router]);

    // 게시글 데이터 불러오기
    useEffect(() => {
        const fetchPostData = async () => {
            // 가드 로직 추가: isLogin이 false이거나 loginMember가 없으면 함수 종료
            if (!isLogin || !loginMember) {
                // 필요하다면 로딩 상태를 false로 설정하거나 사용자에게 알림 표시
                // setIsLoading(false);
                // setError('로그인 정보가 유효하지 않습니다.');
                return; // 여기서 중단
            }

            setIsLoading(true);
            setError('');

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${postId}`, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })

                if (!response.ok) {
                    throw new Error('게시글을 불러오는데 실패했습니다.')
                }

                const data = await response.json()

                setTitle(data.title)
                setContent(data.content)
                setTags(data.tags ? data.tags.map((tag: { name: string }) => tag.name) : []) // tags가 null일 수 있음
                setBoardType(data.boardType) // 게시글 타입 설정

                // 초기 이미지 URL 설정
                setInitialImageUrls(data.imageUrls || []);

                // 작성자 본인 또는 관리자 여부 확인
                if (loginMember && (loginMember.id === data.memberResponse.memberId || isAdmin)) {
                  // 수정 권한 있음
                } else {
                  setError('게시글을 수정할 권한이 없습니다.');
                  // 필요시 리다이렉트 또는 UI 비활성화 처리
                  // router.push('/post');
                }

            } catch (err) {
                console.error('게시글 로딩 실패:', err)
                setError(err instanceof Error ? err.message : '게시글을 불러오는 데 실패했습니다.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchPostData();
    }, [postId, isLogin, isAdmin, loginMember]) // isAdmin, loginMember 의존성 추가

    // 로그인 여부 확인 및 리다이렉트
    useEffect(() => {
        if (!isLogin) {
            router.push('/login')
        }
    }, [isLogin, router])

    // 로그인되지 않은 경우 로딩 표시
    if (!isLogin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <h2 className="text-2xl font-bold mb-4">로그인 필요</h2>
                    <p className="text-gray-600 mb-6">게시글 수정을 위해 로그인이 필요합니다.</p>
                    <p className="text-gray-600 mb-6">로그인 페이지로 이동합니다...</p>
                </div>
            </div>
        )
    }

    // 태그 변경 핸들러 - 서버로 전송하기 전에 중복 확인 추가
    const handleTagsChange = (newTags: string[]) => {
        // 중복 태그를 제거하여 설정 (서버에서 분리된 태그가 있을 경우 대비)
        const uniqueTags = [...new Set(newTags)]
        setTags(uniqueTags)
    }

    // 이미지 업로드 성공 시 호출될 콜백 함수 (하나의 tempId를 받아 리스트에 추가)
    const handleImageUploadSuccess = (tempId: string) => {
      setTempIdList(prevList => [...prevList, tempId]);
    };

    // 에디터에서 이미지 삭제 시 호출될 콜백 함수 (tempId를 받아 리스트에서 제거)
    const handleImageDelete = (tempId: string) => {
      setTempIdList(prevList => prevList.filter(id => id !== tempId));
      // 백엔드에 즉시 삭제 요청은 하지 않음 (글 저장 시 최종 처리)
    };

    // HTML 문자열에서 이미지 URL 추출하는 헬퍼 함수
    const extractImageUrlsFromHtml = (html: string): string[] => {
      const urls: string[] = [];
      const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/g;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        urls.push(match[1]);
      }
      return urls;
    };

    const handleSubmit = async () => {
        if (isSubmitting) return // 중복 제출 방지

        if (!title.trim()) {
            setError('제목을 입력해주세요.')
            return
        }

        if (!content.trim()) {
            setError('내용을 입력해주세요.')
            return
        }

        // 공지사항 권한 확인
        if (boardType === 'notice' && !isAdmin) {
            setError('공지사항 수정 권한이 없습니다. 관리자만 수정할 수 있습니다.');
            return;
        }

        try {
            setIsSubmitting(true)
            setError('')

            // 1. 최종 에디터 내용에서 모든 이미지 URL 추출
            const currentImageUrls = extractImageUrlsFromHtml(content);

            // 2. 추출된 URL 중 initialImageUrls에 포함된 URL만 필터링 (이것이 usedImageUrls)
            const finalUsedImageUrls = currentImageUrls.filter(url => initialImageUrls.includes(url));

            // 3. 공지사항이 아니면 태그 정리
            const finalTags = boardType === 'notice' ? [] : tags.filter((tag) => tag.trim() !== '');

            // API 호출을 위한 데이터 구성
            const postData: {
                title: string
                content: string
                tags: string[]
                // type, academyCode는 수정 시 보내지 않을 수 있음 (백엔드 정책 확인)
                tempIdList: string[]; // 새로 추가된 이미지들의 임시 ID
                usedImageUrls: string[]; // 기존 이미지 중 유지된 URL
            } = {
                title,
                content,
                tags: finalTags,
                tempIdList: tempIdList,
                usedImageUrls: finalUsedImageUrls
            }

            console.log('수정 요청 데이터:', postData)

            // 게시글 수정 요청
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
                credentials: 'include', // 쿠키 포함하여 요청
            })

            if (!response.ok) {
                let errorMsg = '게시글 수정에 실패했습니다.'
                try {
                    const contentType = response.headers.get('content-type')
                    if (contentType && contentType.indexOf('application/json') !== -1) {
                        const errorData = await response.json()
                        errorMsg = errorData.message || errorMsg
                    } else {
                        errorMsg = `서버 오류: ${response.status}`
                    }
                } catch {
                    errorMsg = `서버 오류: ${response.status}`
                }
                throw new Error(errorMsg)
            }

            // 성공 시 게시글 상세 페이지로 돌아가거나 목록으로 이동
            if (boardType === 'notice') {
                if (academyCode) {
                    router.push(`/post/notice?academyCode=${academyCode}&type=notice`);
                } else {
                    router.push('/post/notice?type=notice');
                }
            } else {
                // 상세 페이지로 리다이렉트 할 때 academyCode도 함께 넘겨줌
                if (academyCode) {
                    router.push(`/post/${postId}?academyCode=${academyCode}`);
                } else {
                    router.push(`/post/${postId}`);
                }
            }
        } catch (err) {
            console.error('게시글 수정 중 오류:', err)
            setError(err instanceof Error ? err.message : '게시글 수정에 실패했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (

        <main className="bg-[#f9fafc] min-h-screen pb-8">
            <div className="max-w-[1140px] mx-auto px-4">
                <div className="pt-14">
                    <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">{boardType === 'notice' ? '공지사항 수정' : '게시글 수정'}</h1>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-[#980ffa] transition-colors"
                    >
                        <span className="material-icons">arrow_back</span>
                        <span>돌아가기</span>
                    </button>
                </div>
                <div className="bg-white p-6 sm:p-8 rounded-[20px] shadow-lg border border-[#F9FAFB] transition-shadow hover:shadow-xl">
                    {/* 제목 입력 */}
                    <div className="w-full mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">제목</label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="제목을 입력해주세요"
                                className="w-full bg-[#fcfaff] border-2 border-gray-100 rounded-[15px] py-4 px-5 text-base
                                            transition-all duration-300 ease-in-out
                                            focus:outline-none focus:ring-2 focus:ring-[#980ffa] focus:border-transparent
                                            group-hover:border-[#980ffa]/30 group-hover:shadow-md
                                            placeholder:text-gray-400"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#980ffa]/5 to-transparent opacity-0
                                            group-hover:opacity-100 rounded-[15px] pointer-events-none transition-opacity duration-300"/>
                        </div>
                    </div>

                                {/* Tiptap 에디터 적용 */}
                    <div className="w-full mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">내용</label>
                        <div className="border-2 border-gray-100 rounded-[15px] overflow-hidden transition-all duration-300
                                        hover:border-[#980ffa]/30 hover:shadow-md group">
                            <div className="min-h-[400px] sm:min-h-[500px] md:min-h-[600px]">
                            <TiptapEditor
                                            content={content}
                                            onChange={setContent}
                                            onImageUploadSuccess={handleImageUploadSuccess}
                                            onImageDelete={handleImageDelete}
                            />
                            </div>
                        </div>
                    </div>

                    {/* 태그 입력 - 공지사항이 아닐 때만 표시 */}
                    {boardType !== 'notice' && (
                        <div className="w-full mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">태그</label>
                            <TagInput tags={tags} onTagsChange={handleTagsChange} />
                            <p className="text-xs text-gray-500 mt-2 ml-1">
                                여러 개의 태그는 쉼표(,) 또는 엔터키로 구분하여 입력할 수 있습니다
                            </p>
                        </div>
                    )}

                    {/* 에러 메시지 */}
                    {error && (
                        <div className="w-full mb-6 px-4 py-3 rounded-[15px] bg-red-50 border border-red-100">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* 버튼 영역 */}
                    <div className="flex justify-between w-full border border-[#F9FAFB] rounded-[10px] p-2 sm:p-3">
                        <button
                            onClick={() =>
                                typeParam === 'notice' ? router.push('/post/notice') : router.push('/post')
                            }
                            className="bg-[#980ffa] text-white py-[10px] px-[20px] rounded-[10px] text-[12px] border-none"
                        >
                            목록
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (boardType === 'notice' && !isAdmin)}
                            className={`py-[10px] px-[20px] rounded-[10px] text-[12px] border-none
                            ${boardType === 'notice' && !isAdmin
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-[#980ffa] text-white hover:bg-[#870edf] transition-all'
                                }`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                                    <span>저장 중...</span>
                                </div>
                            ) : (
                                '수정하기'
                            )}
                        </button>
                    </div>
                </div>
            </div>

        </main>
    )
}

export default EditPostPage