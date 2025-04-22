'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoginMember } from '@/stores/auth/loginMember';
import { fetchApi } from '@/utils/api';

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
  boardLikes?: number;
  boardComments?: number;
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
  const [academyCodeChecked, setAcademyCodeChecked] = useState(false);
  const [academyAlertShown, setAcademyAlertShown] = useState(false);
  const academyAlertRef = useRef(false);

  // 1. 컴포넌트 마운트 시 클라이언트 사이드 렌더링 활성화
  useEffect(() => {
    setIsMounted(true);
    
    // URL 파라미터 처리
    if (searchParams) {
      // minLikes 파라미터 처리
      if (searchParams.has('minLikes')) {
        setMinLikes(searchParams.get('minLikes'));
      } else {
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
      console.log('게시판 - 사용자 로그인됨, ID:', loginMember?.id);
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
    if (!isMounted || academyAlertRef.current) return; // 이미 알림이 표시되었으면 API 호출 중단
    
    setLoading(true);
    try {
      // 3. URL 구성 - 상대경로 사용
      let url = `/api/v1/posts?page=${page}&size=${size}`;
      
      // 정렬 방식 추가 (확실히 적용되도록 별도 처리)
      url += `&sortType=${encodeURIComponent(sort)}`;
      console.log(`정렬 방식: ${sort}`);
      
      // 4. 필터 유형에 따라 적절한 파라미터 추가
      if (keyword && keyword.trim() !== '') {
        if (filterType === '태그') {
          // 4-1. 태그 필터인 경우 tag 파라미터 사용
          url += `&tag=${encodeURIComponent(keyword)}`;
          console.log('태그로 검색:', keyword);
        } else {
          // 4-2. 제목이나 작성자 필터인 경우 keyword 파라미터 사용
          url += `&keyword=${encodeURIComponent(keyword)}`;
          console.log('검색어로 검색:', keyword);
        }
      }
      
      // 5. 인기 태그 클릭으로 인한 태그 필터
      if (tag && tag.trim() !== '') {
        url += `&tag=${encodeURIComponent(tag)}`;
        console.log('태그로 검색:', tag);
      }
      
      // minLikes 파라미터 추가
      if (minLikesParam) {
        url += `&minLikes=${minLikesParam}`;
        console.log('좋아요 최소 개수:', minLikesParam);
      }
      
      console.log('API 요청 URL:', url);
      
      // 6. API 요청 보내기 - fetchApi 사용
      const response = await fetchApi(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      // 7. 응답 처리
      if (!response.ok) {
        let errorMessage = '게시물을 가져오는 중 오류가 발생했습니다.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          
          // academyCode 관련 오류 확인
          if (errorMessage.includes('아카데미 코드가 등록되지 않았습니다') || 
              errorMessage.includes('먼저 학원을 등록해주세요')) {
            showAcademyAlert();
            return;
          }
        } catch (e) {
          errorMessage = `API 에러: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // 8. 데이터 추출 및 가공
      const data = await response.json();
      console.log('응답 데이터:', data);
      
      // 9. 응답 데이터 처리 및 상태 업데이트
      if (data && Array.isArray(data.content)) {
        
        setPosts(data.content.map((post: any) => ({
          ...post,
          commentCount: post.commentCount || (post.boardComments ? post.boardComments.length || 0 : 0),
          likeCount: post.likeCount || (post.boardLikes ? post.boardLikes.length || 0 : 0)
        })));
        setTotalPages(data.totalPages || 1);
        setSearchCount(data.totalElements || 0);
      } else {
        console.log('예상과 다른 API 응답 형식:', data);
        if (Array.isArray(data)) {
          
          setPosts(data.map((post: any) => ({
            ...post,
            commentCount: post.commentCount || (post.boardComments ? post.boardComments.length || 0 : 0),
            likeCount: post.likeCount || (post.boardLikes ? post.boardLikes.length || 0 : 0)
          })));
          setTotalPages(1);
          setSearchCount(data.length);
        } else {
          setPosts([]);
          setTotalPages(1);
          setSearchCount(0);
        }
      }
    } catch (error: any) {
      // 10. 오류 처리
      console.log('게시물을 가져오는 중 오류가 발생했습니다:', error.message);
      setPosts([]);
      setTotalPages(1);
      setSearchCount(0);
    } finally {
      // 11. 로딩 상태 종료
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
      
      // minLikes 파라미터 추가
      if (minLikes) {
        url += `?minLikes=${minLikes}`;
        console.log('인기 태그 - 좋아요 최소 개수:', minLikes);
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
          isActive: false
        })));
      } else if (data && Array.isArray(data.content)) {
        setPopularTags(data.content.map((tag: any) => ({
          name: tag.name,
          count: tag.count,
          isActive: false
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
  }, [currentPage, pageSize, sortType, searchKeyword, selectedTag, minLikes, isMounted]);

  // 14. 컴포넌트 마운트 시 인기 태그 불러오기
  useEffect(() => {
    if (isMounted) {
      // academyAlertRef가 true인 경우 API 호출 방지
      if (!academyAlertRef.current) {
        fetchPopularTags();
      }
    }
  }, [isMounted, minLikes]);

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
    fetchPosts(1, '10', '등록일순', '', undefined, minLikes);
  };

  // 20. 컴포넌트 렌더링 시작
  // 서버 사이드 렌더링 또는 초기 렌더링 중에는 최소한의 UI만 표시
  if (!isMounted) {
    return (
      <main className="bg-[#f9fafc] min-h-screen pb-8">
        <div className="max-w-[1140px] mx-auto px-4 pt-14">
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
    <main className="bg-[#f9fafc] min-h-screen pb-8">
      <div className="max-w-[1140px] mx-auto px-4">
        {searchMode ? (
          <div className="pt-14 pb-[20px] bg-[#ffffff] rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[#333333] mb-2 pl-[20px] pt-[20px]">&quot;{searchKeyword}&quot; 검색 결과</h2>
                <p className="text-sm text-[#666666] pl-[20px] pb-[20px]">총 {searchCount}개의 게시물이 검색되었습니다.</p>
              </div>
              <button 
                onClick={resetAllFilters}
                className="bg-[#f2f2f2] text-[#666666] rounded-[5px] py-[5px] px-[10px] text-sm mr-[20px] hover:bg-[#e5e5e5] flex items-center"
              >
                <span className="material-icons text-sm mr-[5px]">refresh</span>
                초기화
              </button>
            </div>
          </div>
        ) : popularTags.length > 0 ? (
          <div className="pt-14 pb-[20px] bg-[#ffffff] rounded-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#333333] mb-4 pl-[20px] pt-[20px]">인기 태그</h2>
              {(selectedTag || sortType !== '등록일순' || pageSize !== '10' || filterType !== '태그') && (
                <button 
                  onClick={resetAllFilters}
                  className="bg-[#f2f2f2] text-[#666666] rounded-[5px] py-[5px] px-[10px] text-sm mr-[20px] hover:bg-[#e5e5e5] flex items-center"
                >
                  <span className="material-icons text-sm mr-[5px]">refresh</span>
                  초기화
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-[5px] pl-[20px] pr-[20px] pb-[20px]">
              {tagsLoading ? (
                <p className="text-sm text-[#666666]">태그 로딩 중...</p>
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
        ) : (
          <div className="pt-14 pb-[5px]"></div>
        )}
        
        {!minLikes && (
          <div className="flex justify-end m-[5px] pt-[10px] pb-[5px] ">
            <Link href="/post/new" className="bg-[#980ffa] rounded-[10px] text-[#ffffff] py-[5px] px-[10px] text-sm no-underline flex items-center">
              <span className="material-icons text-sm text-[#ffffff] mr-[5px]">edit</span>
              새 글쓰기
            </Link>
          </div>
        )}
        
        <div className="flex justify-between items-center my-5 pb-[20px] pt-[20px] bg-[#ffffff] rounded-lg">
          <div className="flex pl-[10px] pr-[10px]">
            <div className="pr-[10px]">
              <FilterDropdown value={filterType} onChange={handleFilterChange} />
            </div>
            <SearchInput filterType={filterType} onSearch={handleSearch} />
          </div>
          <div className="flex items-center">
            {/* {(searchKeyword || selectedTag || sortType !== '등록일순' || pageSize !== '10' || filterType !== '태그') && (
              <button 
                onClick={resetAllFilters}
                className="bg-[#f2f2f2] text-[#666666] rounded-[5px] py-[5px] px-[10px] text-sm mr-[10px] hover:bg-[#e5e5e5] flex items-center"
              >
                <span className="material-icons text-sm mr-[5px]">refresh</span>
                초기화
              </button>
            )} */}
            <SortDropdown value={sortType} onChange={handleSortChange} />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : (
          <>
            <div className="rounded-[10px] bg-[#ffffff]  border-[#eeeeee] p-[10px]">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostItem 
                    key={post.id}
                    id={post.id}
                    title={post.title}
                    nickname={post.nickname}
                    time={getFormattedTime(post.creationTime, post.modificationTime)}
                    viewCount={post.viewCount}
                    commentCount={post.commentCount}
                    likeCount={post.likeCount}
                    tags={post.tags}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-[#666666]">
                  검색 결과가 없습니다.
                  {searchKeyword && <p className="mt-2">&apos;{searchKeyword}&apos; 검색어를 변경하여 다시 시도해보세요.</p>}
                </div>
              )}
            </div>

            {posts.length > 0 && (
              <div className="flex justify-between items-center pb-[5px] pt-[5px]">
                <div className="m-[10px]">
                  <select 
                    className="px-4 py-[7px] text-sm text-[#666666] bg-white border border-[#e5e5e5] rounded hover:bg-gray-50 cursor-pointer focus:outline-none"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                  >
                    <option value="10">10개씩 보기</option>
                    <option value="15">15개씩 보기</option>
                    <option value="20">20개씩 보기</option>
                  </select>
                </div>
                <div className="flex items-center gap-[10px]">
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
                  <div className="pr-[10px]">
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
      className={`px-3 py-[11px] text-sm border-none ${
        active 
          ? 'bg-[#980ffa] text-[#ffffff]' 
          : 'bg-[#f2f2f2] text-[#555555] hover:bg-[#e5e5e5]'
      }`}
      onClick={onClick}
    >
      #{text} ({count})
    </button>
  );
}

// 필터 드롭다운
function FilterDropdown({ value, onChange }: { value: string; onChange: (type: string) => void }) {
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // 값이 실제로 변경된 경우에만 onChange 호출
    if (e.target.value !== value) {
      onChange(e.target.value);
    }
  };
  
  // 클릭 이벤트 중지 함수 추가
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  
  return (
    <div className="relative" onClick={handleClick}>
      <select 
        className="px-4 py-[7px] text-sm text-[#333333] border border-[#e5e5e5] rounded-[10px] bg-white cursor-pointer focus:outline-none"
        value={value}
        onChange={handleFilterChange}
      >
        <option value="태그">태그</option>
        <option value="제목">제목</option>
        <option value="작성자">작성자</option>
      </select>
    </div>
  );
}

// 검색 입력 필드
function SearchInput({ filterType, onSearch }: { filterType: string; onSearch: (keyword: string) => void }) {
  const [inputValue, setInputValue] = useState('');
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      onSearch(inputValue.trim());
    }
  };

  const handleSearchClick = () => {
    if (inputValue.trim() !== '') {
      onSearch(inputValue.trim());
    }
  };

  const getPlaceholder = () => {
    switch (filterType) {
      case '태그':
        return '태그를 입력하세요 (예: 개발, 디자인)';
      case '제목':
        return '제목을 입력하세요';
      case '작성자':
        return '작성자를 입력하세요';
      default:
        return '검색어를 입력하세요';
    }
  };
  
  return (
    <div className="relative w-[300px]">
      <div className="flex items-center border border-[#e5e5e5] rounded">
        <span 
          className="material-icons text-[#999999] pt-[2px] pb-[2px] p-[10px] ml-[2px] cursor-pointer" 
          onClick={handleSearchClick}
        >
          search
        </span>
        <input 
          type="text" 
          placeholder={getPlaceholder()} 
          className="pl-[5px] pr-4 py-[8px] w-full text-sm border-none focus:outline-none"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
}

// 정렬 드롭다운
function SortDropdown({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) {
  return (
    <div className="relative">
      <select 
        className="p-[7px] mr-[10px] text-sm text-[#333333] border border-[#e5e5e5] rounded-[10px] bg-white cursor-pointer focus:outline-none"
        value={value}
        onChange={onChange}
      >
        <option value="등록일순">등록일순</option>
        <option value="댓글순">댓글순</option>
        <option value="조회순">조회순</option>
        <option value="좋아요순">좋아요순</option>
      </select>
    </div>
  );
}

// 페이지 버튼
function PageButton({ text, active = false, disabled = false, onClick }: { text: string; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  const baseClasses = "flex items-center justify-center min-w-8 h-8 px-2 rounded";
  
  if (disabled) {
    return (
      <button disabled className={`${baseClasses} text-[#cccccc] bg-white cursor-not-allowed border border-[#e5e5e5]`}>
        {text}
      </button>
    );
  }
  
  if (active) {
    return (
      <button className={`${baseClasses} text-[#ffffff] bg-[#980ffa] font-medium border-0`}>
        {text}
      </button>
    );
  }
  
  return (
    <button className={`${baseClasses} text-[#555555] bg-white hover:bg-[#f5f5f5] border border-[#e5e5e5]`} onClick={onClick}>
      {text}
    </button>
  );
}

// 게시물 아이템 컴포넌트
function PostItem({ id, title, nickname, time, viewCount, commentCount, likeCount, tags }: { 
  id: number;
  title: string;
  nickname: string;
  time: string; 
  viewCount: number; 
  commentCount: number; 
  likeCount: number; 
  tags: string[] 
}) {
  return (
    <div className="px-[10px] py-[10px] bg-white border border-[#eeeeee] rounded-[10px] m-[10px]">
      <Link href={`/post/${id}`} className="block mb-3 no-underline">
        <h3 className="text-lg font-semibold text-[#333333] hover:text-[#980ffa]">{title}</h3>
      </Link>
      
      <div className="flex items-center justify-between mb-3 gap-[10px]">
        <div className="flex items-center gap-2">
          <div className="w-[30px] h-[30px] rounded-full bg-[#f2f2f2] flex items-center justify-center overflow-hidden">
            <span className="material-icons text-sm text-[#999999]">person</span>
          </div>
          <span className="text-sm text-[#666666] pl-[10px]">{nickname}</span>
          <span className="text-xs text-[#999999] pl-[10px]">•</span>
          <span className="text-sm text-[#999999] pl-[10px]">{time}</span>
        </div>
        
        <div className="flex items-center gap-[10px] pr-[10px]">
          <div className="flex items-center gap-1">
            <span className="material-icons text-sm text-[#999999]">visibility</span>
            <span className="text-xs text-[#999999]">{viewCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-icons text-sm text-[#999999]">chat_bubble_outline</span>
            <span className="text-xs text-[#999999]">{commentCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-icons text-sm text-[#999999]">favorite_border</span>
            <span className="text-xs text-[#999999]">{likeCount}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-[10px] mb-3 pt-[10px]">
        {tags.map((tag, index) => (
          <span key={index} className="text-xs px-2 py-0.5 bg-[#f5f5f5] text-[#666666] rounded-full">
            #{tag}
          </span>
        ))}
      </div>
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
