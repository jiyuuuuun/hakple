'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoginMember } from '@/stores/auth/loginMember';
import { fetchApi } from '@/utils/api';

// LoginMember 타입 명확히 정의
interface LoginMember {
  id: number;
  nickname: string;
  isAdmin: boolean;
  // ... 기타 필요한 필드
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
  hasImage?: boolean;  // 이미지 첨부 여부
}

export default function NoticePage() {
  // 타입 명확히 지정
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

  // 검색 및 정렬 관련 상태 추가
  const [searchMode, setSearchMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCount, setSearchCount] = useState(0);
  const [pageSize, setPageSize] = useState('10');
  const [sortType, setSortType] = useState('등록일순');
  const [filterType, setFilterType] = useState('제목');
  const [academyCode, setAcademyCode] = useState<string | null>(null);
  const [academyName, setAcademyName] = useState<string>('');
  const [postType, setPostType] = useState<string | null>(null);

  // 관리자 상태를 별도의 상태로 관리
  const [isAdminState, setIsAdminState] = useState(false);

  // isAdmin 체크 함수 수정
  const isAdmin = () => isAdminState || (loginMember && !!loginMember.isAdmin);

  // 초기 로딩 시 관리자 권한 확인
  useEffect(() => {
    const checkAdminPermission = async () => {
      if (isLogin && loginMember) {
        try {
          const response = await fetchApi('/api/v1/admin/check', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
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

  // URL 파라미터 처리
  useEffect(() => {
    if (searchParams) {
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

      // 아카데미 코드 파라미터 처리
      if (searchParams.has('academyCode')) {
        const code = searchParams.get('academyCode');
        if (code) {
          setAcademyCode(code);
        }
      }

      // 포스트 타입 파라미터 처리
      if (searchParams.has('type')) {
        const type = searchParams.get('type');
        if (type) {
          setPostType(type);
        }
      }
    }

    // URL 경로에서 아카데미 코드 추출 (ex: /post/notice/ABC1234)
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 3) {
      const codeFromPath = pathParts[3];
      if (codeFromPath && codeFromPath !== '') {
        setAcademyCode(codeFromPath);
      }
    }
  }, [searchParams]);

  // 로그인 확인
  useEffect(() => {
    if (!isLogin) {
      router.push('/login');
    }
  }, [isLogin, router]);

  // 공지사항 데이터 가져오기
  useEffect(() => {
    if (isLogin && academyCode && postType) {
      fetchNoticeBoards();
    } else if (isLogin && (!academyCode || !postType)) {
      // URL 파라미터에서 값 가져오기가 완료된 후에만 API 호출
      const pathParts = window.location.pathname.split('/');
      const urlHasAcademyCode = pathParts.length > 3 && pathParts[3] && pathParts[3] !== '';

      if (urlHasAcademyCode || (searchParams.has('academyCode') && searchParams.has('type'))) {
        fetchNoticeBoards();
      }
    }
  }, [isLogin, currentPage, pageSize, sortType, searchKeyword, academyCode, postType]);

  // 아카데미 정보 가져오기
  useEffect(() => {
    if (academyCode) {
      fetchAcademyInfo();
    }
  }, [academyCode]);

  // 공지사항 데이터 가져오는 함수
  const fetchNoticeBoards = async () => {
    setLoading(true);
    try {
      let url = `/api/v1/posts/notice?page=${currentPage}&size=${pageSize}`;

      // 정렬 방식 추가
      url += `&sortType=${encodeURIComponent(sortType)}`;

      // 검색어가 있는 경우 추가
      if (searchKeyword && searchKeyword.trim() !== '') {
        if (filterType === '제목') {
          url += `&keyword=${encodeURIComponent(searchKeyword)}`;
        } else if (filterType === '작성자') {
          url += `&keyword=${encodeURIComponent(searchKeyword)}`;
        }
      }

      // URL에서 아카데미 코드 확인
      const currentAcademyCode = academyCode || searchParams.get('academyCode');
      // 아카데미 코드가 있는 경우 추가
      if (currentAcademyCode) {
        url += `&academyCode=${encodeURIComponent(currentAcademyCode)}`;
      }

      // URL에서 포스트 타입 확인
      const currentPostType = postType || searchParams.get('type');
      // 포스트 타입 추가
      if (currentPostType) {
        url += `&type=${encodeURIComponent(currentPostType)}`;
      }

      console.log('공지사항 API 요청 URL:', url);
      const response = await fetchApi(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      console.log(response);

      if (!response.ok) {
        throw new Error('공지사항을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data && Array.isArray(data.content)) {
        setPosts(data.content.map((post: Post) => ({
          ...post,
          hasImage: post.hasImage || false, // API에서 hasImage 필드가 없으면 false로 설정
          commentCount: post.commentCount || 0 // API에서 commentCount 필드가 없으면 0으로 설정
        })));
        setTotalPages(data.totalPages || 1);
        setSearchCount(data.totalElements || 0);
      } else {
        setPosts([]);
        setTotalPages(1);
        setSearchCount(0);
      }
    } catch (error) {
      console.error('공지사항을 불러오는데 실패했습니다:', error);
      setPosts([]);
      setTotalPages(1);
      setSearchCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 아카데미 정보 조회
  const fetchAcademyInfo = async () => {
    if (!academyCode) return;

    try {
      const response = await fetchApi(`/api/v1/admin/academies/${academyCode}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAcademyName(data.academyName || '학원 정보 없음');
      } else {
        setAcademyName('학원 정보 없음');
      }
    } catch (error) {
      console.error('학원 정보를 불러오는데 실패했습니다:', error);
      setAcademyName('학원 정보 없음');
    }
  };

  // 페이지 크기 변경 처리 함수
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(e.target.value);
    setCurrentPage(1);
  };

  // 정렬 방식 변경 처리 함수
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortType = e.target.value;
    console.log(`정렬 방식 변경: ${newSortType}`);
    setSortType(newSortType);
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동

    // 정렬 변경 시 데이터 새로 불러오기
    fetchNoticeBoards();
  };

  // 검색 처리 함수
  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1);
    setSearchMode(true);
  };

  // 필터 유형 변경 처리 함수
  const handleFilterChange = (type: string) => {
    if (type !== filterType) {
      console.log(`필터 유형 변경: ${filterType} -> ${type}`);
      setFilterType(type);
    }
  };

  // 상태 초기화 함수
  const resetAllFilters = () => {
    setSearchMode(false);
    setSearchKeyword('');
    setSortType('등록일순');
    setPageSize('10');
    setCurrentPage(1);
    setFilterType('제목');

    // 초기화 후 데이터 다시 불러오기
    fetchNoticeBoards();
  };

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

  // 로그인되지 않은 경우 로딩 화면 표시
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
    <main className="bg-[#f9fafc] min-h-screen pb-8">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex justify-between items-center my-6 pt-14">
          <div>
            <h1 className="text-2xl font-bold">
              공지사항
              {isAdmin() && academyName && academyCode && (
                <span className="ml-2 text-[#8C4FF2]">: {academyName}</span>
              )}
            </h1>
          </div>
          {/* 관리자만 글쓰기 버튼 노출 */}
          {isAdmin() && (
            <Link
              href={`/post/new?type=notice&academyCode=${academyCode}`}
              className="bg-[#980ffa] rounded-[10px] text-[#ffffff] py-[8px] px-[15px] text-base no-underline flex items-center"
            >
              <span className="material-icons text-base text-[#ffffff] mr-[8px]">edit</span>
              새 글쓰기
            </Link>
          )}
        </div>

        {searchMode && (
          <div className="pt-14 pb-[20px] bg-[#ffffff] rounded-lg mb-6">
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
        )}

        <div className="flex justify-between items-center my-6 pb-[25px] pt-[25px] bg-[#ffffff] rounded-lg">
          <div className="flex pl-[15px] pr-[15px]">
            <div className="pr-[15px]">
              <FilterDropdown value={filterType} onChange={handleFilterChange} />
            </div>
            <SearchInput filterType={filterType} onSearch={handleSearch} />
          </div>
          <div className="flex items-center pr-[15px]">
            <SortDropdown value={sortType} onChange={handleSortChange} />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">로딩 중...</div>
        ) : (
          <>
            <div className="rounded-[10px] bg-[#ffffff] border-[#eeeeee] p-[15px]">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className="px-[15px] py-[20px] bg-white border border-[#eeeeee] rounded-[10px] m-[15px] cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/post/${post.id}`)}
                  >
                    <h3 className="text-xl font-semibold text-[#333333] mb-4">
                      {post.title}
                      {post.hasImage && (
                        <span className="material-icons text-base text-[#980ffa] ml-2 align-middle">image</span>
                      )}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-base text-[#666666]">{post.nickname}</span>
                        <span className="text-sm text-[#999999]">•</span>
                        <span className="text-base text-[#999999]">
                          {getFormattedTime(post.creationTime, post.modificationTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-[15px]">
                        <div className="flex items-center gap-2">
                          <span className="material-icons text-base text-[#999999]">visibility</span>
                          <span className="text-sm text-[#999999]">{post.viewCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-icons text-base text-[#999999]">chat_bubble_outline</span>
                          <span className="text-sm text-[#999999]">{post.commentCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-icons text-base text-[#999999]">favorite_border</span>
                          <span className="text-sm text-[#999999]">{post.likeCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-[#666666]">
                  <p className="text-lg">등록된 공지사항이 없습니다.</p>
                  {searchKeyword && <p className="text-base">&apos;{searchKeyword}&apos; 검색어를 변경하여 다시 시도해보세요.</p>}
                </div>
              )}
            </div>

            {posts.length > 0 && (
              <div className="flex justify-between items-center py-6">
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

