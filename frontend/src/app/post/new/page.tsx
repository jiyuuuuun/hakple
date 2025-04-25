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
                    const isAdminResult = await res.json();
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
    }, [isLogin]);
    }, [isLogin, router]);

    // 로그인되지 않은 경우 로딩 표시
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

    // 태그 변경 핸들러 - 서버로 전송하기 전에 중복 확인 추가
    const handleTagsChange = (newTags: string[]) => {
        // 중복 태그를 제거하여 설정 (서버에서 분리된 태그가 있을 경우 대비)
        const uniqueTags = [...new Set(newTags)];
        setTags(uniqueTags);
    };

    // 이미지 업로드 성공 시 호출될 콜백 함수 (하나의 tempId를 받아 리스트에 추가)
    const handleImageUploadSuccess = (tempId: string) => {
        setTempIdList(prevList => [...prevList, tempId]);
    };

    // 에디터에서 이미지 삭제 시 호출될 콜백 함수 (tempId를 받아 리스트에서 제거)
    const handleImageDelete = (tempId: string) => {
        setTempIdList(prevList => prevList.filter(id => id !== tempId));
        // 백엔드에 즉시 삭제 요청은 하지 않음 (글 저장 시 최종 처리)
    };

    const handleSubmit = async () => {
        if (!title.trim()) return setError('제목을 입력해주세요.');
        if (!content.trim()) return setError('내용을 입력해주세요.');
        if (boardType === 'notice' && !isAdmin) return setError('공지사항 작성 권한이 없습니다.');
        if (isSubmitting) return; // 중복 제출 방지
        setError(''); // 이전 오류 메시지 초기화
        if (!title.trim()) {
            setError('제목을 입력해주세요.');
            return;
        }

        if (!content.trim()) {
            setError('내용을 입력해주세요.');
            return;
        }

        // 공지사항 권한 확인
        if (boardType === 'notice' && !isAdmin) {
            setError('공지사항 작성 권한이 없습니다. 관리자만 작성할 수 있습니다.');
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');
            const finalTags = tags.filter(tag => tag.trim());

            const postData = {
            // 빈 태그만 필터링하고, 태그 형식을 그대로 유지
            const finalTags = boardType === 'notice' ? [] : tags.filter(tag => tag.trim() !== '');

            // API 호출을 위한 데이터 구성
            // academyCode가 있으면 사용, 없으면 undefined로 전송하여 서버에서 토큰의 사용자 정보 사용
            const postData: {
                title: string;
                content: string;
                tags: string[];
                boardType: BoardType;
                academyCode?: string;
                tempIdList: string[];
            } = {
                title,
                content,
                tags: finalTags,
                type: boardType,
                ...(academyCode && { academyCode }),
                boardType: boardType,
                academyCode: academyCode || undefined,
                tempIdList: tempIdList
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts`, {

            console.log('요청 데이터:', postData);

            // 게시글 생성 요청
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
                credentials: 'include',
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText);
            }

            const data = await res.json();
            if (uploadedTempIds.length && data.id) {
                await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/images/link-to-board`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tempIds: uploadedTempIds, boardId: data.id }),
                    credentials: 'include',
                });
            // 응답 데이터 확인
            const responseData = await response.json();
            console.log('서버 응답:', responseData);

            // 이미지가 업로드되었고 게시글 ID가 있으면 이미지 연결 요청
            if (tempIdList.length > 0 && responseData.id) {
                try {
                    const linkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/images/link-to-board`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tempIds: tempIdList,
                            boardId: responseData.id,
                            content: content,
                            usedImageUrls: []
                        }),
                        credentials: 'include',
                    });

                    if (linkResponse.ok) {
                        console.log('이미지 연결 성공:', await linkResponse.json());
                    } else {
                        console.error('이미지 연결 실패:', linkResponse.status);
                    }
                } catch (linkError) {
                    console.error('이미지 연결 중 오류:', linkError);
                    // 게시글은 생성되었으므로 전체 프로세스를 실패로 처리하지 않음
                }
            }

            const redirectUrl = boardType === 'notice'
                ? `/post/notice?${academyCode ? `academyCode=${academyCode}&` : ''}type=notice`
                : '/post';
            router.push(redirectUrl);
        } catch (e: any) {
            console.error(e);
            setError(e.message || '게시글 등록에 실패했습니다.');
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
                            className="w-full border border-gray-200 rounded-[15px] py-4 px-5 text-base focus:outline-none focus:ring-2 focus:ring-[#980ffa] focus:border-transparent transition-shadow hover:shadow-sm"
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



