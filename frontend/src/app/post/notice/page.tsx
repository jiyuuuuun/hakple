'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoginMember } from '@/stores/auth/loginMember';
import { fetchApi } from '@/utils/api';
import { handleLike } from '@/utils/likeHandler';
import PostListSkeleton from '@/components/PostListSkeleton';

interface LoginMember {
    id: number;
    nickname: string;
    isAdmin: boolean;
}

interface Post {
    id: number;
    title: string;
    nickname: string;
    creationTime: string;
    modificationTime?: string;
    viewCount: number;
    commentCount: number;
    likeCount: number;
    tags: string[];
    hasImage?: boolean;
    isLiked?: boolean;
    profileImageUrl?: string;
}

export default function NoticePage() {
    const { isLogin, loginMember } = useGlobalLoginMember() as {
        isLogin: boolean;
        loginMember: LoginMember | null;
    };
    const router = useRouter();
    const searchParams = useSearchParams();
    const [posts, setPosts] = useState<Post[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchMode, setSearchMode] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchCount, setSearchCount] = useState(0);
    const [pageSize, setPageSize] = useState('10');
    const [sortType, setSortType] = useState('creationTime');
    const [filterType, setFilterType] = useState('title');
    const [academyCode, setAcademyCode] = useState<string | null>(null);
    const [academyName] = useState<string>('');
    const [postType, setPostType] = useState<string | null>(null);
    const [isAdminState, setIsAdminState] = useState(false);
    const [likingPosts, setLikingPosts] = useState<Set<number>>(new Set());
    const [showScrollTopButton, setShowScrollTopButton] = useState(false);

    const isAdmin = () => isAdminState || (loginMember && !!loginMember.isAdmin);

    useEffect(() => {
        const checkAdminPermission = async () => {
            if (isLogin && loginMember) {
                try {
                    const response = await fetchApi('/api/v1/admin/check', {
                        method: 'GET',
                    });

                    if (response.ok) {
                        const isAdminResult = await response.json();
                        setIsAdminState(isAdminResult === true);
                        console.log('관리자 권한 확인 결과:', isAdminResult);
                    }
                } catch (error) {
                    console.error('관리자 권한 확인 중 오류 발생:', error);
                }
            }
        };

        checkAdminPermission();
    }, [isLogin, loginMember]);

    useEffect(() => {
        if (searchParams) {
            if (searchParams.has('keyword')) {
                const keyword = searchParams.get('keyword');
                if (keyword) {
                    setSearchKeyword(keyword);
                    setSearchMode(true);
                }
            }

            if (searchParams.has('sortType')) {
                const sort = searchParams.get('sortType');
                if (sort) {
                    setSortType(sort);
                }
            }

            if (searchParams.has('filterType')) {
                const filter = searchParams.get('filterType');
                if (filter) {
                    setFilterType(filter);
                }
            }

            if (searchParams.has('academyCode')) {
                const code = searchParams.get('academyCode');
                if (code) {
                    setAcademyCode(code);
                }
            }

            if (searchParams.has('type')) {
                const type = searchParams.get('type');
                if (type) {
                    setPostType(type);
                }
            }
        }

        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 3) {
            const codeFromPath = pathParts[3];
            if (codeFromPath && codeFromPath !== '') {
                setAcademyCode(codeFromPath);
            }
        }
    }, [searchParams]);

    useEffect(() => {
        if (!isLogin) {
            router.push('/login');
        }
    }, [isLogin, router]);

    useEffect(() => {
        if (isLogin && academyCode && postType) {
            fetchNoticeBoards();
        } else if (isLogin && (!academyCode || !postType)) {
            const pathParts = window.location.pathname.split('/');
            const urlHasAcademyCode = pathParts.length > 3 && pathParts[3] && pathParts[3] !== '';

            if (urlHasAcademyCode || (searchParams.has('academyCode') && searchParams.has('type'))) {
                fetchNoticeBoards();
            }
        }
    }, [isLogin, currentPage, pageSize, sortType, searchKeyword, academyCode, postType]);

    const fetchNoticeBoards = async () => {
        setLoading(true);
        try {
            let url = `/api/v1/posts/notice?page=${currentPage}&size=${pageSize}`;

            url += `&sortType=${encodeURIComponent(sortType)}`;

            if (searchKeyword && searchKeyword.trim() !== '') {
                url += `&keyword=${encodeURIComponent(searchKeyword)}`;
                url += `&searchType=${encodeURIComponent(filterType)}`;
            }

            const currentAcademyCode = academyCode || searchParams.get('academyCode');
            if (currentAcademyCode) {
                url += `&academyCode=${encodeURIComponent(currentAcademyCode)}`;
            }

            const currentPostType = postType || searchParams.get('type');
            if (currentPostType) {
                url += `&type=${encodeURIComponent(currentPostType)}`;
            }

            console.log('공지사항 API 요청 URL:', url);
            const response = await fetchApi(url, {
                method: 'GET',
            });

            console.log(response);


            const [postsResponse, likeStatusResponse] = await Promise.all([
                fetchApi(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                }),
                fetchApi('/api/v1/posts/my/like-status', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                }),
            ]);


            if (!postsResponse.ok || !likeStatusResponse.ok) {
                let errorMessage = '공지사항 또는 좋아요 상태를 불러오지 못했습니다.';
                if (!postsResponse.ok) {
                    try {
                        const errData = await postsResponse.json();
                        errorMessage = errData.message || errorMessage;
                    } catch (jsonParseError) {
                        console.warn('Failed to parse posts error response JSON:', jsonParseError);
                    }
                } else {
                    try {
                        const errData = await likeStatusResponse.json();
                        errorMessage = errData.message || errorMessage;
                    } catch (jsonParseError) {
                        console.warn('Failed to parse like status error response JSON:', jsonParseError);
                    }
                }
                throw new Error(errorMessage);
            }

            const postData = await postsResponse.json();
            const likedPostIds: number[] = await likeStatusResponse.json();

            if (postData && Array.isArray(postData.content)) {
                const processedPosts = postData.content.map((post: Post) => ({
                    ...post,
                    hasImage: post.hasImage || false,
                    commentCount: post.commentCount || 0,
                    isLiked: likedPostIds.includes(post.id),
                    profileImageUrl: post.profileImageUrl
                }));
                setPosts(processedPosts);
                setTotalPages(postData.totalPages || 1);
                setSearchCount(postData.totalElements || 0);
            } else {
                setPosts([]);
                setTotalPages(1);
                setSearchCount(0);
            }
        } catch (error) {
            console.error('공지사항을 불러오는데 실패했습니다:', error);
            let message = 'Unknown error';
            if (error instanceof Error) {
                message = error.message;
            } else if (typeof error === 'string') {
                message = error;
            }
            console.error('Error details:', message);
            setPosts([]);
            setTotalPages(1);
            setSearchCount(0);
        } finally {
            setLoading(false);
        }
    };

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(e.target.value);
        setCurrentPage(1);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSortType = e.target.value;
        setSortType(newSortType);
        setCurrentPage(1);
    };

    const handleSearch = (keyword: string) => {
        setSearchKeyword(keyword);
        setCurrentPage(1);
        setSearchMode(true);
    };

    const handleFilterChange = (type: string) => {
        if (type !== filterType) {
            setFilterType(type);
        }
    };

    const resetAllFilters = () => {
        setSearchMode(false);
        setSearchKeyword('');
        setSortType('creationTime');
        setPageSize('10');
        setCurrentPage(1);
        setFilterType('title');
    };

    function formatRelativeTime(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();

        if (diffMs < 60 * 1000) {
            return '방금 전';
        }

        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 60) {
            return `${diffMinutes}분 전`;
        } else if (diffHours < 24) {
            const minutes = diffMinutes % 60;
            if (minutes === 0) {
                return `${diffHours}시간 전`;
            }
            return `${diffHours}시간 ${minutes}분 전`;
        } else if (diffDays < 7) {
            return `${diffDays}일 전`;
        } else {
            const year = date.getFullYear();
            const currentYear = now.getFullYear();

            if (year === currentYear) {
                return `${date.getMonth() + 1}월 ${date.getDate()}일`;
            } else {
                return `${year}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
            }
        }
    }

    function getFormattedTime(creationTime: string, modificationTime?: string): string {
        if (modificationTime) {
            return `${formatRelativeTime(modificationTime)} (수정)`;
        }
        return formatRelativeTime(creationTime);
    }

    const handleLikeClick = async (post: Post, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (likingPosts.has(post.id)) return;

        const currentIsLiked = post.isLiked || false;

        setLikingPosts(prev => new Set([...prev, post.id]));

        try {
            await handleLike({
                post,
                isLiked: currentIsLiked,
                isLogin,
                setIsLiked: (newLiked: boolean) => {
                    setPosts(prevPosts =>
                        prevPosts.map(p =>
                            p.id === post.id ? { ...p, isLiked: newLiked } : p
                        )
                    );
                },
                setPost: (updateFn: (prev: Post) => Post) => {
                    setPosts(prevPosts =>
                        prevPosts.map(p =>
                            p.id === post.id ? updateFn(p) : p
                        )
                    );
                },
                setIsLiking: () => {
                    setLikingPosts(prev => {
                        const next = new Set(prev);
                        next.delete(post.id);
                        return next;
                    });
                },
            });
        } catch (error) {
            console.error('좋아요 처리 중 오류:', error);
            setLikingPosts(prev => {
                const next = new Set(prev);
                next.delete(post.id);
                return next;
            });
        }
    };

    // Scroll event handler
    const handleScroll = () => {
        if (window.scrollY > 300) {
            setShowScrollTopButton(true);
        } else {
            setShowScrollTopButton(false);
        }
    };

    // Add/remove scroll event listener
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Scroll to top function
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    if (!isLogin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <h2 className="text-2xl font-bold mb-4">로그인 필요</h2>
                    <p className="text-gray-600 mb-6">공지사항에 접근하려면 로그인이 필요합니다.</p>
                    <p className="text-gray-600 mb-6">로그인 페이지로 이동합니다...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        공지사항
                        {isAdmin() && academyName && academyCode && (
                            <span className="ml-2 text-[#9C50D4]">: {academyName}</span>
                        )}
                    </h1>
                    {isAdmin() && (
                        <Link
                            href={`/post/new?type=notice&academyCode=${academyCode}`}
                            className="bg-[#9C50D4] hover:bg-[#8544B2] transition-all rounded-lg text-white py-2 px-4 text-base font-medium flex items-center gap-2"
                        >
                            <span className="material-icons text-base">edit</span>
                            새 글쓰기
                        </Link>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-6 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">검색 필터</label>
                            <select
                                className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md hover:border-purple-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                value={filterType}
                                onChange={(e) => handleFilterChange(e.target.value)}
                            >
                                <option value="title">제목</option>
                                <option value="content">내용</option>
                                <option value="nickname">작성자</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">검색</label>
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-icons text-gray-400 text-lg">search</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder={
                                        filterType === 'title' ? '제목으로 검색'
                                            : filterType === 'content' ? '내용으로 검색'
                                                : '작성자로 검색'
                                    }
                                    className="w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md hover:border-purple-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && searchKeyword.trim()) {
                                            handleSearch(searchKeyword.trim());
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">정렬</label>
                            <select
                                className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md hover:border-purple-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                value={sortType}
                                onChange={handleSortChange}
                            >
                                <option value="creationTime">등록일순</option>
                                <option value="commentCount">댓글순</option>
                                <option value="viewCount">조회순</option>
                                <option value="likeCount">좋아요순</option>
                            </select>
                        </div>
                    </div>
                </div>

                {searchMode && (
                    <div className="bg-white rounded-lg shadow p-4 mb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-medium text-gray-900">&quot;{searchKeyword}&quot; 검색 결과</h2>
                                <p className="text-sm text-gray-500 mt-1">총 {searchCount}개의 게시물</p>
                            </div>
                            <button
                                onClick={resetAllFilters}
                                className="inline-flex items-center px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <span className="material-icons text-sm mr-1">refresh</span>
                                초기화
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <PostListSkeleton count={10} />
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow">
                            {posts.length > 0 ? (
                                posts.map((post, index) => (
                                    <div key={post.id}>
                                        <div 
                                            className="p-6 hover:bg-gray-50 transition-all duration-200 group border-l-4 border-transparent hover:border-l-4 hover:border-l-[#9C50D4] hover:shadow-md cursor-pointer"
                                            onClick={() => router.push(`/post/${post.id}`)}
                                        >
                                            <div className="flex items-center gap-4 mb-2">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                                    {post.profileImageUrl ? (
                                                        <img
                                                            src={post.profileImageUrl}
                                                            alt={`${post.nickname} 프로필 이미지`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const img = e.target as HTMLImageElement;
                                                                img.onerror = null;
                                                                img.style.display = 'none';
                                                                const icon = img.nextElementSibling;
                                                                if (icon) {
                                                                    icon.classList.remove('hidden');
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="material-icons text-gray-400 text-2xl">account_circle</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">{post.nickname}</span>
                                                    <span className="text-gray-400">•</span>
                                                    <span className="text-gray-500">{getFormattedTime(post.creationTime, post.modificationTime)}</span>
                                                </div>
                                            </div>

                                            <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
                                                {post.title}
                                                {post.hasImage && (
                                                    <span className="material-icons text-base text-[#980ffa] ml-2 align-middle">image</span>
                                                )}
                                            </h2>

                                            <div className="flex items-center gap-6 text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => handleLikeClick(post, e)}
                                                        className={`flex items-center gap-1 group/like transition-all p-1 rounded-full hover:bg-gray-100 ${post.isLiked ? 'text-[#980ffa]' : 'text-[#999999] hover:text-[#980ffa]'}`}
                                                        disabled={likingPosts.has(post.id)}
                                                    >
                                                        <span className={`material-icons text-base ${likingPosts.has(post.id) ? 'animate-pulse' : ''}`}>
                                                            {post.isLiked ? 'favorite' : 'favorite_border'}
                                                        </span>
                                                    </button>
                                                    <span className="text-sm text-[#999999]">{post.likeCount}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.5}
                                                            d="M8 12h.01M12 12h.01M16 12h.01M12 21a9 9 0 1 0-9-9c0 1.488.36 2.89 1 4.127L3 21l4.873-1C9.11 20.64 10.512 21 12 21z"
                                                        />
                                                    </svg>
                                                    <span className="text-sm">{post.commentCount}</span>
                                                </div>
                                                <div className="flex items-center gap-2 ml-auto">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.5}
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.5}
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                    <span className="text-sm">{post.viewCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {index < posts.length - 1 && (
                                            <div className="mx-6 border-b border-gray-200"></div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-lg shadow p-16 text-center">
                                    <p className="text-gray-500 text-lg mb-1">공지사항이 없습니다</p>
                                    {searchKeyword && (
                                        <p className="text-gray-400 text-sm">
                                            &apos;{searchKeyword}&apos; 검색어를 변경하여 다시 시도해보세요
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {posts.length > 0 && (
                            <div className="bg-white rounded-lg shadow p-4 mt-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <select
                                        className="w-32 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-md hover:border-purple-400 focus:outline-none focus:border-[#9C50D4] focus:ring-1 focus:ring-[#9C50D4] transition-colors"
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                    >
                                        <option value="10">10개씩 보기</option>
                                        <option value="15">15개씩 보기</option>
                                        <option value="20">20개씩 보기</option>
                                    </select>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`min-w-[32px] h-8 px-2 text-sm rounded-md transition-colors ${
                                                currentPage === 1
                                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                            }`}
                                        >
                                            이전
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`min-w-[32px] h-8 px-2 text-sm rounded-md transition-colors ${
                                                    currentPage === page
                                                        ? 'bg-purple-100 text-purple-700 font-medium'
                                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`min-w-[32px] h-8 px-2 text-sm rounded-md transition-colors ${
                                                currentPage === totalPages
                                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                            }`}
                                        >
                                            다음
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                {/* Scroll to Top Button */}
                {showScrollTopButton && (
                    <button
                        onClick={scrollToTop}
                         className="fixed bottom-[300px] right-4 md:right-10 z-50 p-3 bg-[#9C50D4] text-white rounded-full shadow-lg hover:bg-[#8544B2] transition-all duration-300"
                        aria-label="맨 위로 스크롤"
                    >
                        <span className="material-icons">arrow_upward</span>
                    </button>
                )}
            </div>
        </main>
    );
}