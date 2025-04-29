'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoginMember } from '@/stores/auth/loginMember';

const TiptapEditor = dynamic(() => import('@/components/editor/TiptapEditor'), { ssr: false });

type BoardType = 'free' | 'notice';

interface TagInputProps {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
}

const sanitizeTag = (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    const trimmed = input.trim();
    return trimmed.startsWith('#') ? trimmed.substring(1).trim() : trimmed;
};

const TagInput: React.FC<TagInputProps> = ({ tags, onTagsChange }) => {
    const [inputValue, setInputValue] = useState('');
    const [isComposing, setIsComposing] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.includes(',')) {
            const parts = value.split(',');
            parts.slice(0, -1).forEach(part => {
                const trimmed = part.trim();
                if (trimmed) addTag(trimmed);
            });
            setInputValue(parts[parts.length - 1]);
            return;
        }
        setInputValue(value);
    };

    const addTag = (rawInput: string) => {
        const newTag = sanitizeTag(rawInput);
        if (!newTag || tags.includes(newTag)) return false;
        onTagsChange([...tags, newTag]);
        return true;
    };

    const addCurrentTag = () => {
        if (addTag(inputValue)) setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isComposing) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            addCurrentTag();
        }
    };

    const handleCompositionStart = () => setIsComposing(true);
    const handleCompositionEnd = () => setIsComposing(false);
    const handleBlur = () => {
        if (inputValue.trim() && !isComposing) addCurrentTag();
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="border-2 border-gray-100 rounded-[15px] p-2 bg-[#fcfaff]">
            <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag, index) => (
                    <div
                        key={`tag-${index}-${tag}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0e7ff] rounded-full border-2 border-[#e6d6ff] text-[#6b21a8]"
                        onClick={() => removeTag(tag)}
                        title="클릭하여 제거"
                    >
                        <span className="text-sm font-medium">#{tag}</span>
                        <span className="material-icons text-sm opacity-0 group-hover/tag:opacity-100 transition-opacity">close</span>
                    </div>
                ))}
                <div className="relative flex-grow min-w-[200px]">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        placeholder="태그 입력 후 쉼표(,) 또는 엔터"
                        className="w-full py-1.5 px-3 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                    />
                </div>
            </div>
        </div>
    );
};

const NewPostPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const typeParam = searchParams.get('type') || 'free';
    const academyCode = searchParams.get('academyCode');
    const { isLogin, loginMember } = useGlobalLoginMember();

    const boardType: BoardType = typeParam === 'notice' ? 'notice' : 'free';

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [tempIdList, setTempIdList] = useState<string[]>([]);

    useEffect(() => {
        const checkAdmin = async () => {
            if (isLogin && loginMember) {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/check`, {
                        method: 'GET',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    const isAdminResult = await response.json();
                    setIsAdmin(isAdminResult === true);
                } catch (e) {
                    console.error('권한 확인 중 오류:', e);
                }
            }
        };
        checkAdmin();
    }, [isLogin, loginMember]);

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
                    <p className="text-gray-600 mb-6">게시글을 작성하려면 로그인이 필요합니다.</p>
                    <p className="text-gray-600 mb-6">로그인 페이지로 이동합니다...</p>
                </div>
            </div>
        );
    }

    const handleImageUploadSuccess = (tempId: string) => {
        setTempIdList(prevList => [...prevList, tempId]);
    };

    const handleImageDelete = (tempId: string) => {
        setTempIdList(prevList => prevList.filter(id => id !== tempId));
    };

    const handleSubmit = async () => {
        if (!title.trim()) return setError('제목을 입력해주세요.');
        if (!content.trim()) return setError('내용을 입력해주세요.');
        if (boardType === 'notice' && !isAdmin) return setError('공지사항 작성 권한이 없습니다.');
        if (isSubmitting) return;
        setError('');

        setIsSubmitting(true);

        try {
            const finalTags = boardType === 'notice' ? [] : tags.filter(tag => tag.trim() !== '');
            const postData = {
                title,
                content,
                tags: finalTags,
                tempIdList: tempIdList,
                academyCode: academyCode,
                boardType: boardType,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
                credentials: 'include',
            });

            if (!response.ok) {
                let errorMsg = '게시글 등록에 실패했습니다.';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || `서버 응답 오류: ${response.status}`;
                } catch {
                    errorMsg = response.statusText || `서버 오류: ${response.status}`;
                }
                throw new Error(errorMsg);
            }

            const responseData = await response.json();

            const redirectUrl = boardType === 'notice'
                ? `/post/notice?${academyCode ? `academyCode=${academyCode}&` : ''}type=notice`
                : `/post/${responseData.id}`;
            router.push(redirectUrl);

        } catch (e) {
            console.error(e);
            const error = e as Error;
            setError(error.message || '게시글 등록에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="bg-[#f9fafc] min-h-screen pb-8">
            <div className="max-w-[1140px] mx-auto px-4 pt-14">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                        {boardType === 'notice' ? '공지사항 작성' : '새 글쓰기'}
                    </h1>
                    <button
                        onClick={() => {
                            const noticeUrl = academyCode
                                ? `/post/notice?academyCode=${academyCode}&type=notice`
                                : '/post/notice?type=notice';
                            router.push(typeParam === 'notice' ? noticeUrl : '/post');
                        }}
                        className="flex items-center gap-2 text-gray-600 hover:text-[#980ffa] transition-colors"
                    >
                        <span className="material-icons">arrow_back</span>
                        <span>목록으로</span>
                    </button>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-[20px] shadow-lg border border-[#F9FAFB] transition-shadow hover:shadow-xl">
                    {/* 제목 입력 */}
                    <div className="w-full mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력해주세요"
                            className="w-full border border-gray-200 rounded-[15px] py-4 px-5 text-base focus:outline-none focus:ring-2 focus:ring-[#980ffa] focus:border-transparent transition-shadow hover:shadow-sm bg-gray-50"
                        />
                    </div>

                    {/* Tiptap 에디터 적용 */}
                    <div className="w-full mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">내용</label>
                        <div className="border border-gray-200 rounded-[15px] overflow-hidden transition-shadow hover:shadow-sm">
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

                    {/* 태그 */}
                    {boardType !== 'notice' && (
                        <div className="w-full mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">태그</label>
                            <TagInput tags={tags} onTagsChange={setTags} />
                            <p className="text-xs text-gray-500 mt-2 ml-1">
                                여러 개의 태그는 쉼표(,) 또는 엔터키로 구분하여 입력할 수 있습니다.
                            </p>
                        </div>
                    )}

                    {/* 에러 메시지 */}
                    {error && (
                        <div className="w-full mb-6 px-4 py-3 rounded-[15px] bg-red-50 border border-red-100">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* 버튼 */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => router.push(typeParam === 'notice'
                                ? (academyCode ? `/post/notice?academyCode=${academyCode}&type=notice` : '/post/notice?type=notice')
                                : '/post')}
                            className="px-6 py-3 rounded-[15px] text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (boardType === 'notice' && !isAdmin)}
                            className={`px-6 py-3 rounded-[15px] text-white shadow-md transition-all transform
                ${boardType === 'notice' && !isAdmin
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-[#980ffa] hover:bg-[#8400df] hover:scale-105 hover:shadow-lg'}
                disabled:opacity-50 disabled:hover:scale-100`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                                    <span>등록 중...</span>
                                </div>
                            ) : (
                                '등록하기'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default NewPostPage;



