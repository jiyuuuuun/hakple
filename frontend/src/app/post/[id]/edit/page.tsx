'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { fetchApi } from '@/utils/api'

const TiptapEditor = dynamic(() => import('@/components/editor/TiptapEditor'), { ssr: false })

type BoardType = 'free' | 'notice';

interface TagInputProps {
    tags: string[]
    onTagsChange: (tags: string[]) => void
}

const sanitizeTag = (input: string): string => {
    if (!input || typeof input !== 'string') return ''

    const trimmed = input.trim()
    if (!trimmed) return ''

    return trimmed.startsWith('#') ? trimmed.substring(1).trim() : trimmed
}

const TagInput: React.FC<TagInputProps> = ({ tags, onTagsChange }) => {

    const [inputValue, setInputValue] = useState('') 
    const [isComposing, setIsComposing] = useState(false) 

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value

        if (value.includes(',')) {
            const parts = value.split(',')
            if (parts.length > 1) {
                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i].trim()
                    if (part) {
                        addTag(part)
                    }
                }
                setInputValue(parts[parts.length - 1])
                return
            }
        }

        setInputValue(value)
    }

    const addTag = (rawInput: string) => {
        if (!rawInput || !rawInput.trim()) return false

        const newTag = sanitizeTag(rawInput)
        if (!newTag) return false

        if (tags.includes(newTag)) return false

        onTagsChange([...tags, newTag])
        return true
    }

    const addCurrentTag = () => {
        if (addTag(inputValue)) {
            setInputValue('')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isComposing) return

        if (e.key === 'Enter') {
            e.preventDefault()
            addCurrentTag()
        } else if (e.key === ',') {
            e.preventDefault()
        }
    }

    const handleCompositionStart = () => {
        setIsComposing(true)
    }

    const handleCompositionEnd = () => {
        setIsComposing(false)
    }

    const handleBlur = () => {
        if (inputValue.trim() && !isComposing) {
            addCurrentTag()
        }
    }

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

const EditPostPage = () => {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const typeParam = searchParams.get('type') || 'free'
    const academyCode = searchParams.get('academyCode')
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
    const [tempIdList, setTempIdList] = useState<string[]>([])
    const [initialImageUrls, setInitialImageUrls] = useState<string[]>([])

    useEffect(() => {
        const checkAdminPermission = async () => {
            if (isLogin && loginMember) {
                try {
                    const response = await fetchApi(`/api/v1/admin/check`, {
                        method: 'GET',
                    });
                    
                    if (response.ok) {
                        const isAdminResult = await response.json();
                        setIsAdmin(isAdminResult === true);
                    } else {
                         setIsAdmin(false);
                    }
                } catch (error) {
                    console.error('[Admin Check] Error during check:', error);
                    setIsAdmin(false);
                } finally {
                    setAdminCheckComplete(true);
                }
            } else {
                setAdminCheckComplete(true); 
            }
        };
        
        checkAdminPermission();
    }, [isLogin, loginMember]);

    useEffect(() => {
        if (adminCheckComplete && boardType === 'notice' && !isAdmin && !isLoading) {
            router.push(`/post/${postId}`);
        }
    }, [adminCheckComplete, isAdmin, boardType, isLoading, postId, router]);

    const fetchPostData = useCallback(async () => {
        if (!isLogin || !loginMember) { 
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetchApi(`/api/v1/posts/${postId}`, {
                method: 'GET',
            })

            if (!response.ok) {
                throw new Error('게시글을 불러오는데 실패했습니다.')
            }

            const data = await response.json();

            setTitle(data.title);

            setContent(data.content);

            setTags(
              Array.isArray(data.tags) 
                ? data.tags
                    .filter((tag: unknown): tag is string => typeof tag === 'string' && tag.trim() !== '') 
                : []
            );

            setBoardType(data.boardType);
            setInitialImageUrls(data.imageUrls || []);

            const ownerUserName = data.userName;
            
            const loggedInUserName = loginMember?.userName?.trim();
            const postOwnerName = ownerUserName?.trim();
            const hasPermission = isAdmin || (loggedInUserName && postOwnerName !== undefined && loggedInUserName === postOwnerName);

            if (hasPermission) {
              setError('');
            } else {
              setError('게시글을 수정할 권한이 없습니다.');
            }

        } catch (err) {
            console.error('게시글 로딩 실패:', err)
            setError(err instanceof Error ? err.message : '게시글을 불러오는 데 실패했습니다.')
        } finally {
            setIsLoading(false)
        }
    }, [postId, isLogin, loginMember, isAdmin]);

    useEffect(() => {

        if (adminCheckComplete && isLogin && loginMember) {
             fetchPostData();
        } else if (!isLogin) {
            router.push('/login');
        } else {
             setIsLoading(true); 
        }
    }, [adminCheckComplete, isLogin, loginMember, fetchPostData]); 

    useEffect(() => {
        if (!isLogin) {
             router.push('/login');
        }
    }, [isLogin, router]);

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

    const handleTagsChange = (newTags: string[]) => {
        const uniqueTags = [...new Set(newTags)]
        setTags(uniqueTags)
    }

    const handleImageUploadSuccess = (tempId: string) => {
      setTempIdList(prevList => [...prevList, tempId]);
    };

    const handleImageDelete = (tempId: string) => {
      setTempIdList(prevList => prevList.filter(id => id !== tempId));
    };

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
        if (isSubmitting) return

        if (!title.trim()) {
            setError('제목을 입력해주세요.')
            return
        }

        if (!content.trim()) {
            setError('내용을 입력해주세요.')
            return
        }

        if (boardType === 'notice' && !isAdmin) {
            setError('공지사항 수정 권한이 없습니다. 관리자만 수정할 수 있습니다.');
            return;
        }

        try {
            setIsSubmitting(true)
            setError('')

            const currentImageUrls = extractImageUrlsFromHtml(content);

            const finalUsedImageUrls = currentImageUrls.filter(url => initialImageUrls.includes(url));

            const finalTags = boardType === 'notice' ? [] : tags.filter((tag) => tag.trim() !== '');

            const postData: {
                title: string
                content: string
                tags: string[]
                tempIdList: string[];
                usedImageUrls: string[];
            } = {
                title,
                content,
                tags: finalTags,
                tempIdList: tempIdList,
                usedImageUrls: finalUsedImageUrls
            }


            const response = await fetchApi(`/api/v1/posts/${postId}`, {
                method: 'PUT',
                body: JSON.stringify(postData),
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

            if (boardType === 'notice') {
                if (academyCode) {
                    router.push(`/post/notice?academyCode=${academyCode}&type=notice`);
                } else {
                    router.push('/post/notice?type=notice');
                }
            } else {
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
            <div className="max-w-[1140px] mx-auto px-4 pt-14">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                        {boardType === 'notice' ? '공지사항 수정' : '게시글 수정'}
                    </h1>
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
                    <div className="flex justify-end mt-8">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (boardType === 'notice' && !isAdmin)}
                            className={`bg-[#980ffa] text-white py-3 px-6 rounded-lg text-base font-medium flex items-center gap-2
                            ${boardType === 'notice' && !isAdmin
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'hover:bg-[#870edf] transition-all'
                                }`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                                    <span>저장 중...</span>
                                </div>
                            ) : (
                                <>
                                <span className="material-icons text-base">save</span>
                                수정하기
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default EditPostPage
