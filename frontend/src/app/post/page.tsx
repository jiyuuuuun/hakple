'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoginMember } from '@/stores/auth/loginMember';
import { fetchApi } from '@/utils/api';
import { handleLike } from '@/utils/likeHandler';

interface Post {
  id: number;
  title: string;
  content: string;
  nickname: string;
  creationTime: string;
  modificationTime?: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  tags: string[];
  boardLikes?: number;
  boardComments?: number;
  hasImage?: boolean;
  isLiked?: boolean;
  profileImageUrl?: string;
}

interface Tag {
  name: string;
  count: number;
  isActive?: boolean;
}

export default function PostPage() {
  const { isLogin, loginMember } = useGlobalLoginMember();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [postType, setPostType] = useState<'free'|'popular'>(() =>
    searchParams.get('type') === 'popular' ? 'popular' : 'free'
  );
  const prevType = useRef(postType);
  const [searchKeyword, setSearchKeyword] = useState<string>(
    searchParams.get('keyword') ?? ''
  );
  const [sortType, setSortType] = useState<string>(
    searchParams.get('sortType') ?? 'creationTime'
  );
  const [filterType, setFilterType] = useState<string>(
    searchParams.get('filterType') ?? 'tag'
  );
  const [currentPage, setCurrentPage] = useState<number>(
    Number(searchParams.get('page') ?? 1)
  );
  const [pageSize, setPageSize] = useState<string>(
    searchParams.get('size') ?? '10'
  );
  const [isMounted, setIsMounted] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [academyAlertShown, setAcademyAlertShown] = useState(false);
  const academyAlertRef = useRef(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [likingPosts, setLikingPosts] = useState<Set<number>>(new Set());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLogin) {
      router.push('/login');
    }
  }, [isLogin, router]);

  useEffect(() => {
    if (isMounted && isLogin && !academyAlertRef.current) {
      console.log('게시판 - 사용자 로그인됨, ID:', loginMember?.userName);
    }
  }, [isLogin, isMounted, loginMember, academyAlertRef]);

  const showAcademyAlert = () => {
    if (!academyAlertRef.current) {
      academyAlertRef.current = true;
      setAcademyAlertShown(true);
      alert('먼저 학원을 등록해주세요');
      router.push('/home');
    }
  };

  useEffect(() => {
    setSearchKeyword(searchParams.get('keyword') ?? '');
    setSortType(searchParams.get('sortType') ?? 'creationTime');
    setFilterType(searchParams.get('filterType') ?? 'tag');
    setCurrentPage(Number(searchParams.get('page') ?? 1));
    setPageSize(searchParams.get('size') ?? '10');
    const t = searchParams.get('type');
    const newType = t === 'popular' ? 'popular' : 'free';
    if (prevType.current !== newType) {
      setPostType(newType);
      prevType.current = newType;
      setCurrentPage(1);
    }
  }, [searchParams]);

  const boardType = searchParams.get('type') === 'popular' ? 'popular' : 'free';

  const fetchPosts = async (page: number, size: string, sort: string, keyword?: string, tag?: string) => {
    if (!isMounted || academyAlertRef.current) return;

    setLoading(true);
    try {
      const typeParam = boardType;
      let url = `/api/v1/posts?page=${page}&size=${size}&type=${typeParam}`;

      url += `&sortType=${encodeURIComponent(sort)}`;

      if (keyword && keyword.trim() !== '') {
        if (filterType === 'tag') {
          url += `&tag=${encodeURIComponent(keyword)}`;
        } else {
          url += `&keyword=${encodeURIComponent(keyword)}`;
        }
        url += `&searchType=${encodeURIComponent(filterType)}`;
      }

      if (tag && tag.trim() !== '') {
        url += `&tag=${encodeURIComponent(tag)}`;
      }

      console.log('게시글 목록 요청 URL:', url);

      const [postsResponse, likeStatusResponse] = await Promise.all([
        fetchApi(url, {
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
        let errorMessage = '게시글 또는 좋아요 상태를 불러오지 못했습니다.';
        if (!postsResponse.ok) {
          const errData = await postsResponse.json();
          errorMessage = errData.message || errorMessage;
        } else {
          const errData = await likeStatusResponse.json();
          errorMessage = errData.message || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const postData = await postsResponse.json();
      const likedPostIds: number[] = await likeStatusResponse.json();

      if (postData && Array.isArray(postData.content)) {
        setPosts(postData.content.map((post: Post) => ({
          ...post,
          isLiked: likedPostIds.includes(post.id),
          commentCount: post.commentCount || (post.boardComments ? post.boardComments : 0),
          likeCount: post.likeCount || (post.boardLikes ? post.boardLikes : 0),
          hasImage: post.hasImage || false
        })));
        setTotalPages(postData.totalPages || 1);
        setSearchCount(postData.totalElements || 0);
      } else {
        console.log('예상과 다른 API 응답 형식:', postData);
        setPosts([]);
        setTotalPages(1);
        setSearchCount(0);
      }
    } catch (error: any) {
      console.log('게시물을 가져오는 중 오류가 발생했습니다:', error.message);
      setPosts([]);
      setTotalPages(1);
      setSearchCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularTags = async () => {
    if (!isMounted || academyAlertShown) return;

    setTagsLoading(true);
    try {
      const url = `/api/v1/posts/tags/popular?type=${postType}`;

      console.log('인기 태그 요청 URL:', url);

      const response = await fetchApi(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          const errorMessage = errorData.message || '인기 태그를 불러오는데 실패했습니다.';

          if (errorMessage.includes('아카데미 코드가 등록되지 않았습니다') ||
            errorMessage.includes('먼저 학원을 등록해주세요')) {
            showAcademyAlert();
            return;
          }

          throw new Error(errorMessage);
        } catch (error) {
          throw new Error('인기 태그를 불러오는데 실패했습니다.');
        }
      }

      const data = await response.json();
      console.log('인기 태그 데이터:', data);

      if (Array.isArray(data)) {
        setPopularTags((data as {name:string; count:number}[]).map(tag => ({
          name: tag.name,
          count: tag.count,
          isActive: selectedTag === tag.name
        })));
      } else if (data && Array.isArray(data.content)) {
        setPopularTags((data.content as {name:string; count:number}[]).map(tag => ({
          name: tag.name,
          count: tag.count,
          isActive: selectedTag === tag.name
        })));
      } else {
        setPopularTags([]);
      }
    } catch (error: any) {
      console.log('인기 태그를 가져오는 중 오류가 발생했습니다:', error.message);
      setPopularTags([]);
    } finally {
      setTagsLoading(false);
    }
  };

  useEffect(() => {
    if (!isMounted || academyAlertRef.current) return;
    fetchPosts(currentPage, pageSize, sortType, searchKeyword, selectedTag || undefined);
  }, [isMounted, searchParams, currentPage, pageSize, sortType, searchKeyword, selectedTag]);

  useEffect(() => {
    if (isMounted) {
      if (!academyAlertRef.current) {
        fetchPopularTags();
      }
    }
  }, [isMounted, postType]);

  const handleTagClick = (tagName: string) => {
    setSelectedTag(selectedTag === tagName ? null : tagName);
    setPopularTags(prevTags =>
      prevTags.map(tag => ({
        ...tag,
        isActive: tag.name === tagName && selectedTag !== tagName
      }))
    );
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortType = e.target.value;
    console.log(`정렬 방식 변경: ${newSortType}`);
    setSortType(newSortType);
    setCurrentPage(1);

    fetchPosts(1, pageSize, newSortType, searchKeyword, selectedTag || undefined);
  };

  const handleSearch = (keyword: string) => {
    setSelectedTag(null);
    setPopularTags(prevTags =>
      prevTags.map(tag => ({
        ...tag,
        isActive: false
      }))
    );
    setSearchKeyword(keyword);
    setCurrentPage(1);
    setSearchMode(true);
  };

  const handleFilterChange = (type: string) => {
    if (type !== filterType) {
      console.log(`필터 유형 변경: ${filterType} -> ${type}`);
      setFilterType(type);
    }
  };

  const resetAllFilters = () => {
    setSearchMode(false);
    setSearchKeyword('');
    setSortType('creationTime');
    setPageSize('10');
    setCurrentPage(1);
    setSelectedTag(null);
    setFilterType('tag');

    setPopularTags(prevTags =>
      prevTags.map(tag => ({
        ...tag,
        isActive: false
      }))
    );

    fetchPosts(1, '10', 'creationTime', '', undefined);
  };

  const handleLikeClick = async (post: Post, event: React.MouseEvent) => {
    event.preventDefault();

    if (likingPosts.has(post.id)) return;

    const isLiked = post.isLiked || false;

    setLikingPosts(prev => new Set([...prev, post.id]));

    try {
      await handleLike({
        post,
        isLiked,
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

  if (!isMounted) {
    return (
      <main className="bg-[#f9fafc] min-h-screen pb-8">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="text-center py-8">페이지 로딩 중...</div>
        </div>
      </main>
    );
  }

  if (!isLogin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">로그인 필요</h2>
          <p className="text-gray-600 mb-6">게시판에 접근하려면 로그인이 필요합니다.</p>
          <p className="text-gray-600 mb-6">로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        {/* 인기 게시판 / 자유 게시판 탭 UI 개선 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full shadow-md p-1.5 flex space-x-1">
            <Link
              href="/post?type=free"
              className={`py-2.5 px-8 rounded-full transition-all duration-300 font-semibold text-base flex items-center gap-2 ${
                postType === 'free' 
                  ? 'bg-[#9C50D4] text-white shadow-lg transform scale-105' 
                  : 'text-gray-600 hover:bg-purple-50'
              }`}
            >
              <span className="material-icons text-[20px]">forum</span>
              자유게시판
            </Link>
            <Link
              href="/post?type=popular"
              className={`py-2.5 px-8 rounded-full transition-all duration-300 font-semibold text-base flex items-center gap-2 ${
                postType === 'popular' 
                  ? 'bg-[#9C50D4] text-white shadow-lg transform scale-105' 
                  : 'text-gray-600 hover:bg-purple-50'
              }`}
            >
              <span className="material-icons text-[20px]">trending_up</span>
              인기글
            </Link>
          </div>
        </div>

        {/* 타이틀 + 새 글쓰기 + 뷰모드 토글 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {loginMember?.academyName
              ? postType === 'popular'
                ? `${loginMember.academyName}의 인기글`
                : `${loginMember.academyName}의 게시판`
              : postType === 'popular'
                ? '인기글'
                : '게시판'}
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/post/new"
              className="bg-[#9C50D4] hover:bg-[#8544B2] transition-all rounded-lg text-white py-2 px-4 text-base font-medium flex items-center gap-2"
            >
              <span className="material-icons text-base">edit</span>
              새 글쓰기
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-md ${viewMode === 'card' ? 'bg-[#9C50D4] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <span className="material-icons text-base">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-[#9C50D4] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <span className="material-icons text-base">view_list</span>
              </button>
            </div>
          </div>
        </div>

        {/* 필터/검색/정렬 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">검색 필터</label>
              <FilterDropdown value={filterType} onChange={handleFilterChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">검색</label>
              <SearchInput filterType={filterType} onSearch={handleSearch} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">정렬</label>
              <SortDropdown value={sortType} onChange={handleSortChange} />
            </div>
          </div>
        </div>

        {/* 인기 태그 */}
        {!searchMode && postType !== 'popular' && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">인기 태그</h2>
            <div className="flex flex-wrap gap-2">
              {tagsLoading ? (
                <p className="text-sm text-gray-500">태그 로딩 중...</p>
              ) : (
                popularTags.map((tag, index) => (
                  <Tag
                    key={`tag-${tag.name}-${index}`}
                    text={tag.name}
                    count={tag.count.toString()}
                    active={tag.isActive || false}
                    onClick={() => handleTagClick(tag.name)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* 검색 결과 */}
        {searchMode && (
          <div className="bg-white rounded-lg shadow p-4">
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

        {/* 게시물 목록 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9C50D4]"></div>
          </div>
        ) : (
          <>
            {posts.length > 0 ? (
              <>
                {viewMode === 'card' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        id={post.id}
                        title={post.title}
                        nickname={post.nickname}
                        time={formatDate(post.creationTime)}
                        viewCount={post.viewCount}
                        commentCount={post.commentCount}
                        likeCount={post.likeCount}
                        tags={post.tags}
                        isLiked={post.isLiked}
                        onLikeClick={(e) => handleLikeClick(post, e)}
                        likingPosts={likingPosts}
                        hasImage={post.hasImage || false}
                        profileImageUrl={post.profileImageUrl}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow">
                    {posts.map((post, index) => (
                      <div key={post.id}>
                        <PostListItem
                          id={post.id}
                          title={post.title}
                          nickname={post.nickname}
                          time={formatDate(post.creationTime)}
                          viewCount={post.viewCount}
                          commentCount={post.commentCount}
                          likeCount={post.likeCount}
                          tags={post.tags}
                          isLiked={post.isLiked}
                          onLikeClick={(e) => handleLikeClick(post, e)}
                          likingPosts={likingPosts}
                          hasImage={post.hasImage || false}
                          profileImageUrl={post.profileImageUrl}
                        />
                        {index < posts.length - 1 && (
                          <div className="mx-6 border-b border-gray-200"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-16 text-center">
                <p className="text-gray-500 text-lg mb-1">게시물이 없습니다</p>
                {searchKeyword && (
                  <p className="text-gray-400 text-sm">
                    &apos;{searchKeyword}&apos; 검색어를 변경하여 다시 시도해보세요
                  </p>
                )}
              </div>
            )}

            {/* 페이지네이션 */}
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
                    <PageButton
                      text="이전"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    />
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PageButton
                        key={page}
                        text={page.toString()}
                        active={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                      />
                    ))}
                    <PageButton
                      text="다음"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// 태그 컴포넌트
function Tag({ text, count, active = false, onClick }: { text: string; count: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center px-3 py-1 text-sm rounded-full transition-colors cursor-pointer
        ${active
          ? 'bg-[#9C50D4] text-white'
          : 'bg-purple-50 text-[#9C50D4] hover:bg-purple-100'
        }
      `}
    >
      #{text}
      {count && (
        <span className="ml-1 text-xs text-gray-400">
          ({count})
        </span>
      )}
    </button>
  );
}

function FilterDropdown({ value, onChange }: { value: string; onChange: (type: string) => void }) {
  return (
    <select
      className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md hover:border-purple-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="tag">태그</option>
      <option value="title">제목</option>
      <option value="content">내용</option>
      <option value="nickname">작성자</option>
    </select>
  );
}

function SearchInput({ filterType, onSearch }: { filterType: string; onSearch: (keyword: string) => void }) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  return (
    <div className="relative flex-1">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="material-icons text-gray-400 text-lg">search</span>
      </div>
      <input
        type="text"
        placeholder={
          filterType === 'tag' ? '태그로 검색 (예: 개발, 디자인)'
            : filterType === 'title' ? '제목으로 검색'
              : filterType === 'content' ? '내용으로 검색'
                : '작성자로 검색'
        }
        className="w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md hover:border-purple-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
      />
    </div>
  );
}

function SortDropdown({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) {
  return (
    <select
      className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md hover:border-purple-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
      value={value}
      onChange={onChange}
    >
       <option value="creationTime">등록일순</option>
        <option value="commentCount">댓글순</option>
        <option value="viewCount">조회순</option>
        <option value="likeCount">좋아요순</option>
    </select>
  );
}

function PageButton({ text, active = false, disabled = false, onClick }: { text: string; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        min-w-[32px] h-8 px-2 text-sm rounded-md transition-colors
        ${active
          ? 'bg-purple-100 text-purple-700 font-medium'
          : disabled
            ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
        }
      `}
    >
      {text}
    </button>
  );
}

function PostCard({ id, title, nickname, time, viewCount, commentCount, likeCount, tags, isLiked, onLikeClick, likingPosts, hasImage, profileImageUrl }: {
  id: number;
  title: string;
  nickname: string;
  time: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  tags: string[];
  isLiked?: boolean;
  onLikeClick?: (e: React.MouseEvent) => void;
  likingPosts: Set<number>;
  hasImage: boolean;
  profileImageUrl?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-all duration-200 border-b-4 border-transparent hover:border-b-4 hover:border-b-[#9C50D4]">
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={`${nickname}의 프로필 이미지`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // 추가 오류 이벤트 방지
                    target.style.display = 'none'; // 이미지 숨기기
                    target.parentElement!.innerHTML = `
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    `;
                  }}
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{nickname}</p>
              <p className="text-sm text-gray-500">{time}</p>
            </div>
          </div>
        </div>

        <Link href={`/post/${id}`} className="block no-underline">
          <h3 className="text-xl font-semibold text-gray-900 mb-3 hover:text-[#9C50D4] transition-colors line-clamp-2">
            {title}
            {hasImage && (
              <span className="material-icons text-base text-[#980ffa] ml-2 align-middle">image</span>
            )}
          </h3>
        </Link>

        <div className="flex flex-wrap gap-2 mb-4 min-h-[28px]">
          {tags?.length > 0 ? (
            tags.map((tag, index) => (
              <span
                key={index}
                className="text-sm text-[#9C50D4] bg-purple-50 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="invisible inline-block px-2 py-1 text-xs">#태그자리</span>
          )}
        </div>



        <div className="flex items-center gap-6 text-gray-500">
          <button
            onClick={onLikeClick}
            className={`flex items-center gap-2 group/like transition-all ${isLiked ? 'text-[#9C50D4]' : 'hover:text-[#9C50D4]'}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 group-hover/like:scale-110 transition-transform ${likingPosts.has(id) ? 'animate-pulse' : ''}`}
              fill={isLiked ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-sm">{likeCount}</span>
          </button>

          {/* 댓글 버튼 */}
          <Link
            href={`/post/${id}`}
            className="flex items-center gap-2 group/comment hover:text-[#9C50D4] transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 group-hover/comment:scale-110 transition-transform"
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
            <span className="text-sm">{commentCount}</span>
          </Link>

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
            <span className="text-sm">{viewCount}</span>
          </div>
        </div>
      </div>
    </div >
  );
}

function PostListItem({ id, title, nickname, time, viewCount, commentCount, likeCount, tags, isLiked, onLikeClick, likingPosts, hasImage, profileImageUrl }: {
  id: number;
  title: string;
  nickname: string;
  time: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  tags: string[];
  isLiked?: boolean;
  onLikeClick?: (e: React.MouseEvent) => void;
  likingPosts: Set<number>;
  hasImage: boolean;
  profileImageUrl?: string;
}) {
  return (
    <div className="p-6 hover:bg-gray-50 transition-all duration-200 group border-l-4 border-transparent hover:border-l-4 hover:border-l-[#9C50D4] hover:shadow-md">
      <Link href={`/post/${id}`} className="block">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={`${nickname}의 프로필 이미지`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // 추가 오류 이벤트 방지
                  target.style.display = 'none'; // 이미지 숨기기
                  target.parentElement!.innerHTML = `
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  `;
                }}
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{nickname}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{time}</span>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#9C50D4] transition-colors line-clamp-1">
          {title}
          {hasImage && (
            <span className="material-icons text-base text-[#980ffa] ml-2 align-middle">image</span>
          )}
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <span key={index} className="text-sm text-[#9C50D4] bg-purple-50 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors cursor-pointer">#{tag}</span>
          ))}
        </div>



        <div className="flex items-center gap-6 text-gray-500">
          <button
            onClick={onLikeClick}
            className={`flex items-center gap-1 group/like transition-all ${isLiked ? 'text-[#9C50D4]' : 'hover:text-[#9C50D4]'}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 group-hover/like:scale-110 transition-transform ${likingPosts.has(id) ? 'animate-pulse' : ''}`}
              fill={isLiked ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-sm group-hover/like:text-[#9C50D4]">{likeCount}</span>
          </button>
          <div className="flex items-center gap-2 group/comment hover:text-[#9C50D4] transition-all">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 group-hover/comment:scale-110 transition-transform"
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
            <span className="text-sm group-hover/comment:text-[#9C50D4]">{commentCount}</span>
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
            <span className="text-sm">{viewCount}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

// 시간을 상대적으로 표시하는 함수
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // 1분 미만
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}

function summarizeContent(content: string): string {
  const textContent = content.replace(/<[^>]+>/g, '');
  const trimmedContent = textContent.replace(/\s+/g, ' ').trim();
  return trimmedContent.length > 100 ? `${trimmedContent.slice(0, 100)}...` : trimmedContent;
}
