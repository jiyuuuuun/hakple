'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Post {
  id: number;
  title: string;
  content: string;
  nickname: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  tags: string[];
  creationTime: string;
  modificationTime?: string;
  isReported?: boolean;
  isLiked?: boolean;
}

interface Comment {
  id: number;
  nickname: string;
  content: string;
  creationTime: string;
  likeCount: number;
  userId: number;
  isLiked?: boolean;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [lastEditedCommentId, setLastEditedCommentId] = useState<number | null>(null);
  const isMounted = useRef(false);
  // 드롭다운 메뉴 상태 관리
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showCommentMenu, setShowCommentMenu] = useState<number | null>(null);
  // 외부 클릭 감지를 위한 ref
  const postMenuRef = useRef<HTMLDivElement>(null);
  const commentMenuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [commentLikingId, setCommentLikingId] = useState<number | null>(null);
  // 댓글 수정 입력창 참조
  const editCommentRef = useRef<HTMLTextAreaElement>(null);
  // 게시글 신고 상태
  const [isReported, setIsReported] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  // 외부 클릭 감지 - 메뉴와 수정 모드 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // 메뉴 버튼 클릭은 무시
      const target = event.target as Element;
      if (target.closest('.menu-button') || target.closest('.menu-item')) {
        return;
      }
      
      if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) {
        setShowPostMenu(false);
      }
      
      // 활성화된 댓글 메뉴가 있을 때만 체크
      if (showCommentMenu !== null) {
        const activeRef = commentMenuRefs.current[showCommentMenu];
        if (activeRef && !activeRef.contains(event.target as Node)) {
          setShowCommentMenu(null);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCommentMenu]);
  
  // 편집 중인 댓글 ID가 변경될 때마다 콘솔에 기록
  useEffect(() => {
    console.log('편집 중인 댓글 ID 변경:', editingCommentId);
    console.log('편집 중인 댓글 내용:', editCommentContent);
  }, [editingCommentId, editCommentContent]);

  //
  // 게시글 관련 기능
  //

  // 게시글 상세 정보 로드
  useEffect(() => {
    const fetchPostDetail = async () => {
      if (!params.id) return;
      
      // 마운트 체크 (React 18 StrictMode 대응)
      if (isMounted.current) {
        return;
      }
      isMounted.current = true;
      
      // 세션 스토리지에서 이미 조회했는지 확인
      const viewedPosts = JSON.parse(sessionStorage.getItem('viewedPosts') || '{}');
      const postKey = `post_${params.id}`;
      const hasViewed = viewedPosts[postKey];
      
      setLoading(true);
      try {
        // 이미 조회한 경우 postView=false로 설정
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${params.id}?postView=${!hasViewed}`);
        
        // 조회 기록 저장
        if (!hasViewed) {
          viewedPosts[postKey] = true;
          sessionStorage.setItem('viewedPosts', JSON.stringify(viewedPosts));
        }
        
        if (!response.ok) {
          let errorMsg = '게시글을 불러오는데 실패했습니다.';
          try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              const errorData = await response.json();
              errorMsg = errorData.message || errorMsg;
            } else {
              errorMsg = `서버 오류: ${response.status}`;
            }
          } catch (e) {
            errorMsg = `서버 오류: ${response.status}`;
          }
          throw new Error(errorMsg);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || contentType.indexOf("application/json") === -1) {
          throw new Error("서버에서 유효한 데이터를 반환하지 않았습니다.");
        }
        
        const postData = await response.json();
        
        // 게시글 좋아요 상태 확인 API 호출
        try {
          const likeCheckResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${params.id}/like-status`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (likeCheckResponse.ok) {
            const likeData = await likeCheckResponse.json();
            // API에서 반환된 좋아요 상태 설정
            setIsLiked(likeData.isLiked);
          } else {
            console.error('좋아요 상태 확인 실패:', await likeCheckResponse.text());
            setIsLiked(false);
          }
        } catch (error) {
          console.error('좋아요 상태 확인 중 오류:', error);
          setIsLiked(false);
        }
        
        // 게시글 신고 상태 확인 API 호출
        try {
          const reportCheckResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${params.id}/report-status`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (reportCheckResponse.ok) {
            const reportData = await reportCheckResponse.json();
            // API에서 반환된 신고 상태 설정
            setIsReported(reportData.isReported);
          } else {
            console.error('신고 상태 확인 실패:', await reportCheckResponse.text());
            setIsReported(false);
          }
        } catch (error) {
          console.error('신고 상태 확인 중 오류:', error);
          setIsReported(false);
        }
        
        setPost(postData);
        
        // 항상 별도 API로 댓글 조회 (데이터 일관성 및 최신성 보장)
        fetchComments(postData.id);
      } catch (err) {
        console.error('게시글 상세 정보를 불러오는 중 오류:', err);
        setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPostDetail();
    
    // 언마운트 시 ref 초기화하지 않음 - 중요!
    return () => {};
  }, [params.id]);

  // 게시글 좋아요 기능
  const handleLike = async () => {
    if (!post || isLiking) return;
    
    setIsLiking(true);
    try {
      // 백엔드의 토글 API 호출 - 이미 좋아요 했으면 취소, 안했으면 좋아요 추가
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('좋아요 처리에 실패했습니다.');
      }
      
      // 좋아요 상태 토글
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      
      // 좋아요 수 업데이트 (좋아요 추가/취소에 따라 +1/-1)
      setPost(prev => {
        if (!prev) return null;
        return {
          ...prev,
          likeCount: newLikedState 
            ? prev.likeCount + 1 
            : Math.max(0, prev.likeCount - 1) // 음수 방지
        };
      });
      
    } catch (err) {
      console.error('좋아요 처리 중 오류:', err);
    } finally {
      setIsLiking(false);
    }
  };

  // 게시글 삭제 기능
  const handleDelete = async () => {
    if (!post || !confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${post.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('게시글 삭제에 실패했습니다.');
      }
      
      alert('게시글이 삭제되었습니다.');
      router.push('/post');
    } catch (err) {
      console.error('게시글 삭제 중 오류:', err);
      alert(err instanceof Error ? err.message : '게시글 삭제에 실패했습니다.');
    }
  };

  // 게시글 메뉴 토글
  const togglePostMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPostMenu(!showPostMenu);
    setShowCommentMenu(null);
  };

  // 게시글 수정 페이지로 이동
  const handleEdit = () => {
    if (!post) return;
    router.push(`/post/${post.id}/edit`);
    setShowPostMenu(false);
  };

  // 게시글 신고 기능
  const handleReport = async (id: number) => {
    if (!post || isReported || isReporting) return;
    
    setIsReporting(true);
    try {
      // 백엔드 게시글 신고 API 호출
      console.log('게시글 신고 요청:', id);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`게시글 신고 실패: ${errorText}`);
      }
      
      // 신고 성공 시 상태 업데이트
      setIsReported(true);
      
      alert(`게시글을 신고했습니다.`);
      setShowPostMenu(false);
      setShowCommentMenu(null);
    } catch (error) {
      console.error('게시글 신고 중 오류:', error);
      alert('게시글 신고 중 오류가 발생했습니다.');
    } finally {
      setIsReporting(false);
    }
  };

  //
  // 댓글 관련 기능
  //

  // 댓글 목록 불러오기
  const fetchComments = async (postId: number) => {
    try {
      // 댓글 목록 조회 API 호출 (게시글 ID로 필터링)
      console.log(`댓글 목록 조회 API 호출: 게시글 ID ${postId}`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/comments/by-post/${postId}`);
      
      // 응답이 텍스트 형식일 경우 처리
      const responseText = await response.text();
      
      if (response.ok) {
        try {
          // 응답이 JSON 형식인지 확인하고 파싱
          if (responseText.trim()) {
            const commentsData = JSON.parse(responseText);
            console.log('댓글 목록 조회 성공:', commentsData);
            setComments(commentsData);
          } else {
            console.log('게시글에 댓글이 없습니다.');
            setComments([]);
          }
        } catch (e) {
          console.error('JSON 파싱 오류:', e);
          setComments([]);
        }
      } else {
        console.error('댓글 목록 조회 실패:', responseText);
        setComments([]);
      }
    } catch (error) {
      console.error('댓글 목록 조회 중 오류:', error);
      setComments([]);
    }
  };

  // 댓글 등록
  const handleCommentSubmit = async () => {
    if (!commentInput.trim() || !post) return;
    
    try {
      // 백엔드에서 이미 사용자 ID를 7로 하드코딩하고 있으므로 commenterId는 전송하지 않음
      const commentData = {
        boardId: post.id,
        content: commentInput
      };
      
      console.log('댓글 등록 요청 데이터:', commentData);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      });
      
      // 응답이 텍스트 형식이므로 text()로 읽습니다
      const responseText = await response.text();
      
      if (response.ok) {
        console.log('댓글 등록 성공:', responseText);
        // 댓글 입력창 초기화
        setCommentInput('');
        // 댓글 목록 새로고침
        fetchComments(post.id);
      } else {
        console.error('댓글 등록 실패:', responseText);
        alert(`댓글 등록에 실패했습니다: ${responseText}`);
      }
    } catch (error) {
      console.error('댓글 등록 중 오류:', error);
      alert('댓글 등록 중 오류가 발생했습니다.');
    }
  };

  // 메뉴에서 댓글 수정 버튼 클릭 시 호출
  const startCommentEdit = (commentId: number, content: string) => {
    console.log('댓글 수정 시작:', commentId, content);
    
    // 이미 수정 중인 댓글이 있고 내용이 변경된 경우, 변경 사항 저장 여부 확인
    if (editingCommentId !== null && editCommentContent !== '' && editingCommentId !== commentId) {
      if (!confirm('다른 댓글 수정 중입니다. 변경 사항을 저장하지 않고 계속하시겠습니까?')) {
        return;
      }
    }
    
    // 메뉴 닫기
    setShowCommentMenu(null);
    
    // 댓글 수정 상태 설정
    setEditingCommentId(commentId);
    setEditCommentContent(content);
    
    // 다음 렌더링 후 입력창에 포커스
    setTimeout(() => {
      if (editCommentRef.current) {
        editCommentRef.current.focus();
      }
    }, 100);
  };

  // 댓글 수정 버튼 클릭 핸들러
  const handleCommentEdit = (commentId: number, content: string, e?: React.MouseEvent) => {
    // 이벤트 버블링 방지
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    console.log('댓글 수정 요청:', commentId, content);
    
    // 수정 시작 함수 호출
    startCommentEdit(commentId, content);
  };

  // 댓글 수정 취소
  const cancelCommentEdit = () => {
    // 내용이 변경된 경우에만 확인
    if (editingCommentId !== null) {
      const originalComment = comments.find(c => c.id === editingCommentId);
      if (originalComment && editCommentContent !== originalComment.content) {
        if (!confirm('변경 사항을 저장하지 않고 취소하시겠습니까?')) {
          return;
        }
      }
    }
    
    console.log('댓글 수정 취소');
    setEditingCommentId(null);
    setEditCommentContent('');
  };

  // 댓글 수정 제출
  const submitCommentEdit = async () => {
    if (!editingCommentId || !editCommentContent.trim() || !post) return;
    
    try {
      // 백엔드 API 요구사항에 맞춰 수정
      const commentData = {
        id: editingCommentId,
        boardId: post.id,
        content: editCommentContent,
        commenterId: editingCommentId
      };
      
      console.log('댓글 수정 요청 데이터:', commentData, 'ID가 포함되어 있는지 확인:', editingCommentId);
      
      // POST 메서드 사용 (PUT은 지원되지 않음)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/comments/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      });
      
      // 응답이 텍스트 형식이므로 text()로 읽습니다
      const responseText = await response.text();
      
      if (response.ok) {
        console.log('댓글 수정 성공:', responseText);
        // 수정된 댓글 ID 저장 (하이라이트 효과용)
        setLastEditedCommentId(editingCommentId);
        // 수정 모드 종료
        setEditingCommentId(null);
        setEditCommentContent('');
        // 댓글 목록 새로고침
        fetchComments(post.id);
        // 5초 후 하이라이트 효과 제거
        setTimeout(() => {
          setLastEditedCommentId(null);
        }, 5000);
      } else {
        console.error('댓글 수정 실패:', responseText);
        alert(`댓글 수정에 실패했습니다: ${responseText}`);
      }
    } catch (error) {
      console.error('댓글 수정 중 오류:', error);
      alert('댓글 수정 중 오류가 발생했습니다.');
    }
  };

  // 댓글 삭제
  const handleCommentDelete = async (commentId: number) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?') || !post) return;
    
    try {
      console.log('댓글 삭제 요청:', commentId);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/comments/${commentId}`, {
        method: 'DELETE'
      });
      
      // 응답이 텍스트 형식이므로 text()로 읽습니다
      const responseText = await response.text();
      
      if (response.ok) {
        console.log('댓글 삭제 성공:', responseText);
        // 댓글 목록 새로고침
        fetchComments(post.id);
        setShowCommentMenu(null);
      } else {
        console.error('댓글 삭제 실패:', responseText);
        alert(`댓글 삭제에 실패했습니다: ${responseText}`);
      }
    } catch (error) {
      console.error('댓글 삭제 중 오류:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  // 댓글 좋아요
  const handleCommentLike = async (commentId: number) => {
    if (!post || commentLikingId === commentId) return;
    
    setCommentLikingId(commentId);
    try {
      // 현재 댓글의 좋아요 상태 확인
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;
      
      const isCurrentlyLiked = comment.isLiked || false;
      
      // 토글 API 호출 (추가/삭제 통합)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/likes/comments/${commentId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // 응답이 텍스트 형식이므로 text()로 읽습니다
      const responseText = await response.text();
      
      if (response.ok) {
        console.log('댓글 좋아요 토글 성공:', responseText);
        
        // 옵티미스틱 UI 업데이트 (API 응답 기다리지 않고 먼저 UI 업데이트)
        setComments(comments.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                likeCount: isCurrentlyLiked 
                  ? Math.max(0, comment.likeCount - 1)  // 좋아요 취소 시 (최소 0)
                  : comment.likeCount + 1,              // 좋아요 추가 시
                isLiked: !isCurrentlyLiked              // 좋아요 상태 토글
              }
            : comment
        ));
      } else {
        console.error('댓글 좋아요 토글 실패:', responseText);
        alert(`댓글 좋아요 처리에 실패했습니다: ${responseText}`);
      }
    } catch (error) {
      console.error('댓글 좋아요 처리 중 오류:', error);
    } finally {
      setCommentLikingId(null);
    }
  };

  // 댓글 신고
  const handleCommentReport = async (commentId: number) => {
    try {
      // 현재 백엔드에 댓글 신고 API가 구현되어 있지 않으므로 임시 처리
      console.log('댓글 신고 요청:', commentId);
      alert(`댓글을 신고했습니다. (신고 처리는 백엔드 구현 후 완료됩니다)`);
      setShowCommentMenu(null);
    } catch (error) {
      console.error('댓글 신고 처리 중 오류:', error);
      alert('댓글 신고 중 오류가 발생했습니다.');
    }
  };

  // 댓글 메뉴 토글
  const toggleCommentMenu = (e: React.MouseEvent, commentId: number) => {
    e.stopPropagation();
    // 같은 메뉴를 클릭하면 토글, 다른 메뉴를 클릭하면 그 메뉴를 엶
    setShowCommentMenu(showCommentMenu === commentId ? null : commentId);
    setShowPostMenu(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-white p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded mb-6 w-1/4"></div>
          <div className="h-48 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-white p-6 text-center">
          <h1 className="text-xl font-semibold text-red-500 mb-4">오류 발생</h1>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => router.push('/post')}
            className="bg-[#980ffa] text-white px-4 py-2 rounded-md"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-white p-6 text-center">
          <h1 className="text-xl font-semibold mb-4">게시글을 찾을 수 없습니다</h1>
          <button 
            onClick={() => router.push('/post')}
            className="bg-[#980ffa] text-white px-4 py-2 rounded-md"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // HTML 컨텐츠를 안전하게 렌더링하기 위한 객체
  const createMarkup = () => {
    return { __html: post.content };
  };

  const formatTime = (timeString: string) => {
    // 30분 전, 1시간 전 등으로 표시하거나 날짜 형식으로 표시
    const date = new Date(timeString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    } else if (diffMinutes < 24 * 60) {
      return `${Math.floor(diffMinutes / 60)}시간 전`;
    } else {
      return `${date.toLocaleDateString()}`;
    }
  };

  return (
    <div className="mx-auto p-5 max-w-[1000px] bg-gray-100">
      {/* 게시판 타이틀 */}
      <div className="p-[10px] pt-5 rounded mb-4">
        <h1 className="text-2xl font-bold">익명 판</h1>
      </div>
      
      {/* 게시글 상세 컴포넌트 */}
      <div className="bg-[#ffffff] p-[30px] mb-4 rounded border border-[#F9FAFB]">
        {/* 게시글 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="w-[50px] h-[50px] rounded-full bg-gray-400 flex items-center justify-center overflow-hidden mr-3">
              <span className="material-icons text-white text-[30px]">account_circle</span>
            </div>
            <span className="font-medium mr-[10px]">{post.nickname}</span>
            <span className="text-gray-500 text-sm">
              {post.modificationTime 
                ? `${formatTime(post.modificationTime)} (수정)` 
                : formatTime(post.creationTime)}
            </span>
          </div>
          <div className="relative" ref={postMenuRef}>
            <button 
              className="text-gray-500 bg-[#ffffff] border-none menu-button"
              onClick={togglePostMenu}
            >
              <span className="material-icons">more_horiz</span>
            </button>
            
            {/* 게시글 드롭다운 메뉴 */}
            {showPostMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[#ffffff] shadow-md rounded-md z-10 w-[120px] border-none m-[5px]">
                <button 
                  className="flex items-center w-full text-left p-[5px] text-sm hover:bg-gray-100 border-none bg-[#ffffff] m-[5px] text-[#2563EB] text-blue-500 menu-item edit-button"
                  onClick={handleEdit}
                >
                  <span className="material-icons text-[#2563EB] mr-2 m-[5px]">edit</span>
                  글 수정
                </button>
                <button 
                  className="flex items-center w-full text-left p-[5px] text-[#DC2626] m-[5px] text-sm hover:bg-gray-100 border-none bg-[#ffffff] m-[5px] text-red-500 menu-item"
                  onClick={handleDelete}
                >
                  <span className="material-icons m-[5px] text-red-500 mr-2 text-[#DC2626]">delete</span>
                  글 삭제
                </button>
                <button 
                  className="flex items-center w-full text-left p-[5px] m-[5px] text-sm m-[5px] hover:bg-gray-100 border-none bg-[#ffffff] m-[5px] menu-item"
                  onClick={() => handleReport(post.id)}
                  disabled={isReported}
                >
                  <span className={`material-icons ${isReported ? 'text-gray-400' : 'text-gray-500'} m-[5px] mr-2`}>flag</span>
                  {isReported ? '신고 완료' : '글 신고'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <h1 className="text-xl font-bold mb-2 pl-2">{post.title}</h1>
        
        {/* 게시글 내용 */}
        <div className="py-4 pl-5">
          <div className="prose max-w-none post-content" dangerouslySetInnerHTML={createMarkup()}></div>
        </div>
        
        {/* 조회수, 댓글 아이콘 */}
        <div className="flex items-center text-gray-500 space-x-4 mb-2 pl-5">
          <div className="flex items-center">
            <span className="material-icons text-sm mr-1 m-[5px]">visibility</span>
            <span className="text-sm m-[5px]">{post.viewCount}</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons text-sm mr-1 m-[5px]">comment</span>
            <span className="text-sm m-[5px]">{comments.length}</span>
          </div>
        </div>
        
        {/* 좋아요 버튼 */}
        <div className="flex justify-center my-4">
          <button 
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center justify-center rounded-[10px] py-1 px-6 border-none transition-colors ${
              isLiked 
                ? 'bg-pink-100 hover:bg-pink-200 text-pink-600' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span className="material-icons m-[5px]">{isLiked ? 'favorite' : 'favorite_border'}</span>
            <span className="m-[5px]">좋아요</span>
            <span className="m-[5px]">{post.likeCount}</span>
          </button>
        </div>
        
        {/* 태그 목록 */}
        <div className="flex flex-wrap gap-2 mt-3 mb-2 pl-2">
          {post.tags && post.tags.map((tag, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-sm m-[5px]">
              #{tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* 댓글 개수 표시 */}
      <div className="p-[10px] pt-5 rounded mb-4 flex justify-between items-center">
        <h3 className="font-medium">{comments.length}개의 댓글</h3>
        <button
          onClick={() => router.push('/post')}
          className="bg-[#980ffa] text-[#ffffff] py-[10px] px-[20px] rounded-[3px] border-none text-[12px]"
        >
          목록
        </button>
      </div>
      
      {/* 댓글 컴포넌트와 입력 영역을 감싸는 컨테이너 */}
      <div className="bg-[#ffffff] rounded border border-[#f9fafb] mb-4 p-[20px] m-[10px]">
        {/* 댓글 목록 */}
        {comments.length > 0 ? (
          <div className="space-y-4 mb-4">
            {comments.map(comment => (
              <div key={comment.id} className={`p-[10px] border ${editingCommentId === comment.id ? 'border-[#980ffa]' : 'border-[#EFEFEF]'} rounded-[10px] transition-all duration-300`}>
                {editingCommentId === comment.id ? (
                  // 댓글 수정 모드
                  <div className="py-[10px] rounded-[10px] bg-purple-50">
                    <div className="flex items-center mb-2 pl-4">
                      <div className="w-[40px] h-[40px] rounded-full bg-gray-400 flex items-center justify-center overflow-hidden mr-3">
                        <span className="material-icons text-white text-[24px]">account_circle</span>
                      </div>
                      <span className="font-medium mr-2">{comment.nickname}</span>
                      <span className="text-purple-600 text-sm font-medium">댓글 수정 중...</span>
                    </div>
                    <div className="flex px-4">
                      <textarea
                        ref={editCommentRef}
                        value={editCommentContent}
                        onChange={(e) => setEditCommentContent(e.target.value)}
                        placeholder="댓글을 수정하세요..."
                        className="flex-1 border border-gray-300 rounded-[10px] py-2 outline-none focus:border-[#980ffa] h-[100px] resize-none pl-[10px] pt-[10px]"
                      />
                    </div>
                    <div className="flex justify-end mt-2 p-[10px] space-x-2">
                      <button
                        onClick={cancelCommentEdit}
                        className="bg-gray-200 text-gray-700 py-[10px] px-[20px] rounded-[3px] border-none text-[12px]"
                      >
                        취소
                      </button>
                      <button
                        onClick={submitCommentEdit}
                        className="bg-[#980ffa] text-[#ffffff] py-[10px] px-[20px] rounded-[3px] border-none text-[12px]"
                      >
                        수정
                      </button>
                    </div>
                  
                  </div>
                ) : (
                  // 일반 댓글 표시 모드
                  <div className={`flex flex-col transition-all duration-300 ${
                    lastEditedCommentId === comment.id 
                      ? 'bg-purple-50 border-l-4 border-[#980ffa] px-2 py-1 rounded animate-highlight-fade' 
                      : ''
                  }`}>
                    {/* 1줄: 프로필 이미지, 닉네임, 시간 */}
                    <div className="flex items-center mb-2">
                      <div className="w-[40px] h-[40px] rounded-full bg-gray-400 flex items-center justify-center overflow-hidden mr-3">
                        <span className="material-icons text-white text-[24px]">account_circle</span>
                      </div>
                      <span className="font-medium mr-2">{comment.nickname}</span>
                      <span className="text-gray-500 text-sm m-[5px]">{formatTime(comment.creationTime)}</span>
                      {lastEditedCommentId === comment.id && (
                        <span className="text-purple-600 text-xs bg-purple-100 px-2 py-1 rounded-full ml-2 animate-pulse-light">
                          방금 수정됨
                        </span>
                      )}
                      <div className="relative ml-auto" ref={el => commentMenuRefs.current[comment.id] = el}>
                        <button 
                          className="text-gray-500 bg-[#ffffff] border-none menu-button"
                          onClick={(e) => toggleCommentMenu(e, comment.id)}
                        >
                          <span className="material-icons">more_horiz</span>
                        </button>
                        
                        {/* 댓글 드롭다운 메뉴 */}
                        {showCommentMenu === comment.id && (
                          <div className="absolute right-0 top-full mt-1 bg-[#ffffff] shadow-md rounded-md z-10 w-[120px] border-none m-[5px]">
                            <button 
                              className="flex items-center w-full text-left p-[5px] text-sm hover:bg-gray-100 border-none bg-[#ffffff] m-[5px] text-[#2563EB] text-blue-500 menu-item edit-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                console.log('수정 버튼 클릭:', comment.id);
                                startCommentEdit(comment.id, comment.content);
                              }}
                            >
                              <span className="material-icons text-[#2563EB] mr-2 m-[5px]">edit</span>
                              댓글 수정
                            </button>
                            <button 
                              className="flex items-center w-full text-left p-[5px] text-[#DC2626] m-[5px] text-sm hover:bg-gray-100 border-none bg-[#ffffff] m-[5px] text-red-500 menu-item"
                              onClick={() => handleCommentDelete(comment.id)}
                            >
                              <span className="material-icons m-[5px] text-red-500 mr-2 text-[#DC2626]">delete</span>
                              댓글 삭제
                            </button>
                            <button 
                              className="flex items-center w-full text-left p-[5px] m-[5px] text-sm m-[5px] hover:bg-gray-100 border-none bg-[#ffffff] m-[5px] menu-item"
                              onClick={() => handleCommentReport(comment.id)}
                            >
                              <span className="material-icons text-gray-500 m-[5px] mr-2">flag</span>
                              댓글 신고
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 2줄: 댓글 내용 */}
                    <p className="text-gray-800 mb-2 pl-[10px]">{comment.content}</p>
                    
                    {/* 3줄: 좋아요 표시와 숫자 */}
                    <div className="flex items-center">
                      <button 
                        className={`flex items-center text-sm bg-[#ffffff] border-none ${
                          comment.isLiked ? 'text-pink-500' : 'text-gray-500'
                        }`}
                        onClick={() => handleCommentLike(comment.id)}
                      >
                        <span className="material-icons text-sm mr-1 m-[5px]">
                          {comment.isLiked ? 'favorite' : 'favorite_border'}
                        </span>
                        <span>{comment.likeCount}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            첫 번째 댓글을 작성해보세요.
          </div>
        )}
        
        {/* 댓글 입력 컴포넌트 */}
        <div className="py-[10px] rounded-[10px]">
          <div className="flex">
            <textarea
              placeholder="댓글을 입력하세요..."
              className="flex-1 border border-gray-300 rounded-[10px] py-2 outline-none focus:border-[#980ffa] h-[100px] resize-none pl-[10px] pt-[10px]"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />
          </div>
          <div className="flex justify-end mt-2 p-[10px]">
            <button
              onClick={handleCommentSubmit}
              className="bg-[#980ffa] text-[#ffffff] py-[10px] px-[20px] rounded-[3px] border-none text-[12px]"
            >
              등록
            </button>
          </div>
        </div>
      </div>

      {/* 이미지 정렬 관련 스타일 */}
      <style jsx global>{`
        /* 게시글 내용 이미지 기본 스타일 */
        .post-content img {
          max-width: 100%;
          display: block;
        }
        
        /* 이미지 정렬 스타일 */
        .post-content [data-text-align=center],
        .post-content [style*="text-align: center"] {
          text-align: center !important;
        }
        
        .post-content [data-text-align=right],
        .post-content [style*="text-align: right"] {
          text-align: right !important;
        }
        
        .post-content [data-text-align=left],
        .post-content [style*="text-align: left"] {
          text-align: left !important;
        }
        
        .post-content [data-text-align=center] img {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        
        .post-content [data-text-align=right] img {
          margin-left: auto !important;
          margin-right: 0 !important;
        }
        
        .post-content [data-text-align=left] img {
          margin-left: 0 !important;
          margin-right: auto !important;
        }
        
        /* image-resizer 컨테이너 스타일 */
        .post-content .image-resizer {
          display: block;
          position: relative;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
      `}</style>
    </div>
  );
}
