'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoginMember } from '@/stores/auth/loginMember';
import { fetchApi } from '@/utils/api';
import { handleLike } from '@/utils/likeHandler';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface User {
  id: number;
  userName: string;
  academyCode?: string;
  academyName?: string;
  // ...other user properties
}

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
  hasImage?: boolean;  // 이미지 첨부 여부
  isLiked?: boolean;
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
  const [isMounted, setIsMounted] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCount, setSearchCount] = useState(0);
  const [pageSize, setPageSize] = useState('10');
  const [sortType, setSortType] = useState('등록일순');
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [filterType, setFilterType] = useState('태그');
  const [minLikes, setMinLikes] = useState<string | null>(null);
  const [postType, setPostType] = useState('free');
  const [academyCodeChecked, setAcademyCodeChecked] = useState(false);
  const [academyAlertShown, setAcademyAlertShown] = useState(false);
  const academyAlertRef = useRef(false);
  const prevPostTypeRef = useRef<string>(postType);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [likingPosts, setLikingPosts] = useState<Set<number>>(new Set());

  // 1. 컴포넌트 마운트 시 클라이언트 사이드 렌더링 활성화
  useEffect(() => {
    setIsMounted(true);

    // URL 파라미터 처리
    if (searchParams) {
      // type 파라미터 처리
      if (searchParams.has('type')) {
        const type = searchParams.get('type');
        if (type) {
          // 이전 타입과 다를 경우 상태 초기화
          if (prevPostTypeRef.current !== type) {
            resetStateForTypeChange(type);
          }
          setPostType(type);
          prevPostTypeRef.current = type;
          
          // type이 popular인 경우 자동으로 minLikes 10 설정
          if (type === 'popular' && !searchParams.has('minLikes')) {
            setMinLikes('10');
          }
        }
      } else {
        // type 파라미터가 없으면 기본값으로 초기화
        if (prevPostTypeRef.current !== 'free') {
          resetStateForTypeChange('free');
        }
        setPostType('free');
        prevPostTypeRef.current = 'free';
      }

      // minLikes 파라미터 처리
      if (searchParams.has('minLikes')) {
        setMinLikes(searchParams.get('minLikes'));
      } else if (postType !== 'popular') {
        setMinLikes(null);
        // 태그 선택 상태 초기화
        setSelectedTag(null);
        // 태그 활성화 상태도 초기화
        setPopularTags(prevTags =>
          prevTags.map(tag => ({
            ...tag,
            isActive: false
          }))
        );
      }

      // 헤더에서 전달된 검색 파라미터 처리
      if (searchParams.has('keyword')) {
        const keyword = searchParams.get('keyword');
        if (keyword) {
          setSearchKeyword(keyword);
          setSearchMode(true);
        }
      }

      // 정렬 타입 파라미터 처리
      if (searchParams.has('sortType')) {
        const sort = searchParams.get('sortType');
        if (sort) {
          setSortType(sort);
        }
      }

      // 필터 타입 파라미터 처리
      if (searchParams.has('filterType')) {
        const filter = searchParams.get('filterType');
        if (filter) {
          setFilterType(filter);
        }
      }
    }
  }, [searchParams]);

  // 로그인 여부 확인 및 리다이렉트
  useEffect(() => {
    if (!isLogin) {
      router.push('/login');
    }
  }, [isLogin, router]);

  // 처음 로드 시 설정
  useEffect(() => {
    if (isMounted && isLogin && !academyCodeChecked) {
      // 해당 로직 제거: 백엔드가 토큰에서 userId로 academyCode를 직접 찾기 때문에 체크가 필요 없음
      // 로그인 상태만 확인하고 항상 true로 설정
      console.log('게시판 - 사용자 로그인됨, ID:', loginMember?.userName);
      setAcademyCodeChecked(true);
    }
  }, [isLogin, isMounted, loginMember, academyCodeChecked]);

  // 학원 등록 알림 표시 함수
  const showAcademyAlert = () => {
    if (!academyAlertRef.current) {
      academyAlertRef.current = true;
      setAcademyAlertShown(true);
      alert('먼저 학원을 등록해주세요');
      router.push('/home');
    }
  };

  // 2. 게시물 데이터 가져오는 함수
  const fetchPosts = async (page: number, size: string, sort: string, keyword?: string, tag?: string, minLikesParam?: string | null) => {
    if (!isMounted || academyAlertRef.current) return;

    setLoading(true);
    try {
      // 백엔드는 0부터 시작하는 페이지 인덱스를 사용하므로 page - 1
      let url = `/api/v1/posts?page=${page}&size=${size}&type=${postType}`;

      // size와 정렬 방식 추가
      url += `&size=${size}`;
      url += `&sortType=${encodeURIComponent(sort)}`;

      // 필터 유형에 따라 적절한 파라미터 추가
      if (keyword && keyword.trim() !== '') {
        if (filterType === '태그') {
          url += `&tag=${encodeURIComponent(keyword)}`;
        } else {
          url += `&keyword=${encodeURIComponent(keyword)}`;
          url += `&searchType=${encodeURIComponent(filterType)}`;
        }
      }

      if (tag && tag.trim() !== '') {
        url += `&tag=${encodeURIComponent(tag)}`;
      }

      // minLikes 파라미터 추가
      if (minLikesParam || postType === 'popular') {
        // postType이 popular이고 minLikes가 없으면 기본값 10 사용
        const likesValue = minLikesParam || (postType === 'popular' ? '10' : null);
        if (likesValue) {
          url += `&minLikes=${likesValue}`;
          console.log('좋아요 최소 개수:', likesValue);
        }
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
          hasImage: post.hasImage || false // API에서 hasImage 필드가 없으면 false로 설정
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

  // 12. 인기 태그 불러오기 함수
  const fetchPopularTags = async () => {
    if (!isMounted || academyAlertShown) return; // 학원 등록 알림이 이미 표시된 경우 API 호출 중단

    setTagsLoading(true);
    try {
      // 상대 경로 사용
      let url = `/api/v1/posts/tags/popular`;

      // 인기게시판의 경우 항상 minLikes=10 파라미터 적용
      if (postType === 'popular') {
        url += `?minLikes=10&type=${postType}`;
        console.log('인기게시판 인기 태그 요청:', url);
      }
      // 자유게시판의 경우 기존 로직 유지
      else if (minLikes) {
        url += `?minLikes=${minLikes}&type=${postType}`;
        console.log('인기 태그 - 좋아요 최소 개수:', minLikes);
      } else {
        url += `?type=${postType}`;
      }

      console.log('인기 태그 요청 URL:', url);

      // fetchApi 사용
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

          // academyCode 관련 오류 확인
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
        setPopularTags(data.map((tag: any) => ({
          name: tag.name,
          count: tag.count,
          isActive: selectedTag === tag.name // 선택된 태그 유지
        })));
      } else if (data && Array.isArray(data.content)) {
        setPopularTags(data.content.map((tag: any) => ({
          name: tag.name,
          count: tag.count,
          isActive: selectedTag === tag.name // 선택된 태그 유지
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

  // 13. 의존성 변경 시 게시물 데이터 다시 불러오기
  useEffect(() => {
    if (isMounted) {
      // academyAlertRef가 true인 경우 API 호출 방지
      if (!academyAlertRef.current) {
        fetchPosts(currentPage, pageSize, sortType, searchKeyword, selectedTag || undefined, minLikes);
      }
    }
  }, [currentPage, pageSize, sortType, searchKeyword, selectedTag, minLikes, isMounted, postType]);

  // 14. 컴포넌트 마운트 시 인기 태그 불러오기
  useEffect(() => {
    if (isMounted) {
      // academyAlertRef가 true인 경우 API 호출 방지
      if (!academyAlertRef.current) {
        fetchPopularTags();
      }
    }
  }, [isMounted, minLikes, postType]);

  // 15. 인기 태그 클릭 처리 함수
  const handleTagClick = (tagName: string) => {
    // 15-1. 이미 선택된 태그를 다시 클릭하면 해제, 아니면 선택
    setSelectedTag(selectedTag === tagName ? null : tagName);
    // 15-2. 태그 목록의 활성 상태 업데이트
    setPopularTags(prevTags =>
      prevTags.map(tag => ({
        ...tag,
        isActive: tag.name === tagName && selectedTag !== tagName
      }))
    );
    // 15-3. 태그 변경 시 첫 페이지로 이동
    setCurrentPage(1);
  };

  // 16. 페이지 크기 변경 처리 함수
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(e.target.value);
    setCurrentPage(1);
  };

  // 17. 정렬 방식 변경 처리 함수
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortType = e.target.value;
    console.log(`정렬 방식 변경: ${newSortType}`);
    setSortType(newSortType);
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동

    // 현재 검색 조건 유지하면서 새로운 정렬 방식으로 데이터 다시 불러오기
    fetchPosts(1, pageSize, newSortType, searchKeyword, selectedTag || undefined, minLikes);
  };

  // 18. 검색 처리 함수
  const handleSearch = (keyword: string) => {
    // 18-1. 검색 시 선택된 태그 초기화
    setSelectedTag(null);
    // 18-2. 태그의 활성 상태 초기화
    setPopularTags(prevTags =>
      prevTags.map(tag => ({
        ...tag,
        isActive: false
      }))
    );
    // 18-3. 검색어 설정
    setSearchKeyword(keyword);
    // 18-4. 첫 페이지로 이동
    setCurrentPage(1);
    // 18-5. 검색 모드 활성화
    setSearchMode(true);
  };

  // 19. 필터 유형 변경 처리 함수
  const handleFilterChange = (type: string) => {
    // 필터 타입이 변경된 경우에만 상태 업데이트
    if (type !== filterType) {
      console.log(`필터 유형 변경: ${filterType} -> ${type}`);
      setFilterType(type);
      // 여기서는 fetchPosts를 직접 호출하지 않아 불필요한 API 호출 방지
    }
  };

  // 상태 초기화 함수 추가
  const resetAllFilters = () => {
    setSearchMode(false);
    setSearchKeyword('');
    setSortType('등록일순');
    setPageSize('10');
    setCurrentPage(1);
    setSelectedTag(null);
    setFilterType('태그');

    // 태그 활성화 상태 초기화
    setPopularTags(prevTags =>
      prevTags.map(tag => ({
        ...tag,
        isActive: false
      }))
    );

    // 현재 minLikes 유지하면서 데이터 다시 불러오기
    const likesValue = postType === 'popular' ? '10' : minLikes;
    fetchPosts(1, '10', '등록일순', '', undefined, likesValue);
  };

  // 게시판 타입 변경 시 상태 초기화 함수
  const resetStateForTypeChange = (newType: string) => {
    console.log(`게시판 타입 변경: ${prevPostTypeRef.current} -> ${newType}`);
    setCurrentPage(1);
    setPosts([]);
    setTotalPages(1);
    setSearchCount(0);
    setSelectedTag(null);
    setSearchMode(false);
    setSearchKeyword('');
    
    // 인기게시판으로 변경 시 minLikes 설정
    if (newType === 'popular') {
      setMinLikes('10');
    } else if (prevPostTypeRef.current === 'popular') {
      setMinLikes(null);
    }
    
    // 태그 활성화 상태 초기화
    setPopularTags(prevTags =>
      prevTags.map(tag => ({
        ...tag,
        isActive: false
      }))
    );
  };

  const handleLikeClick = async (post: Post, event: React.MouseEvent) => {
    event.preventDefault(); // Link 컴포넌트의 기본 동작 방지

    if (likingPosts.has(post.id)) return; // 이미 처리 중인 경우 중복 요청 방지

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

  // 20. 컴포넌트 렌더링 시작
  // 서버 사이드 렌더링 또는 초기 렌더링 중에는 최소한의 UI만 표시
  if (!isMounted) {
    return (
      <main className="bg-[#f9fafc] min-h-screen pb-8">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="text-center py-8">페이지 로딩 중...</div>
        </div>
      </main>
    );
  }

  // 로그인되지 않은 경우 로딩 표시
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
        {/* 인기 게시판 / 자유 게시판 탭 UI */}
        <div className="flex space-x-4 mb-6">
          <button 
            className={`py-2 px-4 text-lg font-semibold rounded-t-lg transition-colors ${
              postType === 'free' 
                ? 'bg-white text-[#9C50D4] border-t border-l border-r border-gray-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => {
              if (postType !== 'free') {
                router.push('/post');
              }
            }}
          >
            자유게시판
          </button>
          <button 
            className={`py-2 px-4 text-lg font-semibold rounded-t-lg transition-colors ${
              postType === 'popular' 
                ? 'bg-white text-[#9C50D4] border-t border-l border-r border-gray-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => {
              if (postType !== 'popular') {
                router.push('/post?type=popular');
              }
            }}
          >
            인기글
          </button>
        </div>

        {/* 게시글 작성 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{postType === 'popular' ? '인기글' : '자유게시판'}</h1>
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

        {/* 검색 및 필터 */}
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
        {!searchMode && !minLikes && (
          <div className="bg-white rounded-lg shadow p-4">
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
                <h2 className="text-lg font-medium text-gray-900">"{searchKeyword}" 검색 결과</h2>
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
                    '{searchKeyword}' 검색어를 변경하여 다시 시도해보세요
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
        inline-flex items-center px-3 py-1.5 text-sm rounded-full transition-colors
        ${active
          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
        }
      `}
    >
      #{text}
      <span className="ml-1.5 text-xs text-gray-500">
        ({count})
      </span>
    </button>
  );
}

// 필터 드롭다운
function FilterDropdown({ value, onChange }: { value: string; onChange: (type: string) => void }) {
  return (
    <select
      className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md hover:border-purple-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="태그">태그</option>
      <option value="제목">제목</option>
      <option value="작성자">작성자</option>
    </select>
  );
}

// 검색 입력 필드
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
          filterType === '태그' ? '태그로 검색 (예: 개발, 디자인)'
            : filterType === '제목' ? '제목으로 검색'
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

// 정렬 드롭다운
function SortDropdown({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) {
  return (
    <select
      className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md hover:border-purple-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
      value={value}
      onChange={onChange}
    >
      <option value="등록일순">등록일순</option>
      <option value="댓글순">댓글순</option>
      <option value="조회순">조회순</option>
      <option value="좋아요순">좋아요순</option>
    </select>
  );
}

// 페이지 버튼
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

// 게시물 아이템 컴포넌트 (카드형)
function PostCard({ id, title, nickname, time, viewCount, commentCount, likeCount, tags, isLiked, onLikeClick, likingPosts }: {
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
}) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-all duration-200 border-b-4 border-transparent hover:border-b-4 hover:border-b-[#9C50D4]">
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
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
          </h3>
        </Link>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded-md"
            >
              #{tag}
            </span>
          ))}
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
            <span className="text-sm">{commentCount}</span>
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
      </div>
    </div>
  );
}

// 리스트형 게시물 컴포넌트
function PostListItem({ id, title, nickname, time, viewCount, commentCount, likeCount, tags, isLiked, onLikeClick, likingPosts }: {
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
}) {
  return (
    <div className="p-6 hover:bg-gray-50 transition-all duration-200 group border-l-4 border-transparent hover:border-l-4 hover:border-l-[#9C50D4] hover:shadow-md">
      <Link href={`/post/${id}`} className="block">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
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
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{nickname}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{time}</span>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#9C50D4] transition-colors line-clamp-1">
          {title}
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded-md"
            >
              #{tag}
            </span>
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
    // 같은 해의 경우 월일만 표시, 다른 해의 경우 연월일 모두 표시
    const year = date.getFullYear();
    const currentYear = now.getFullYear();

    if (year === currentYear) {
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    } else {
      return `${year}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
  }
}

// 게시물에 수정 정보 추가 및 표시 함수
function getFormattedTime(creationTime: string, modificationTime?: string): string {
  if (modificationTime) {
    // 수정 시간이 있는 경우 "(수정)" 표시 추가
    return `${formatRelativeTime(modificationTime)} (수정)`;
  }
  // 수정 시간이 없는 경우 생성 시간만 표시
  return formatRelativeTime(creationTime);
}

// 날짜 포맷팅 함수
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

// 게시글 내용 요약 함수
function summarizeContent(content: string): string {
  // HTML 태그 제거
  const textContent = content.replace(/<[^>]+>/g, '');
  // 공백 정리
  const trimmedContent = textContent.replace(/\s+/g, ' ').trim();
  // 100자로 제한하고 말줄임표 추가
  return trimmedContent.length > 100 ? `${trimmedContent.slice(0, 100)}...` : trimmedContent;
}
