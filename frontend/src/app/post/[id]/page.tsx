'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGlobalLoginMember } from '@/stores/auth/loginMember';

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
  isOwner?: boolean;
}

interface Comment {
  id: number;
  nickname: string;
  content: string;
  creationTime: string;
  likeCount: number;
  userId: number;
  isLiked?: boolean;
  isReported?: boolean;
  isOwner?: boolean;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLogin } = useGlobalLoginMember();
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
        // 게시글 데이터 로드 API 호출 (쿠키 기반 인증 사용)
        console.log('게시글 상세 정보 요청 시작, 인증 상태:', isLogin ? '로그인됨' : '로그인안됨');
        
        // 이미 조회한 경우 postView=false로 설정
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${params.id}?postView=${!hasViewed}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 쿠키 인증 사용
        });
        
        // 조회 기록 저장
        if (!hasViewed) {
          viewedPosts[postKey] = true;
          sessionStorage.setItem('viewedPosts', JSON.stringify(viewedPosts));
        }
        
        if (!response.ok) {
          let errorMsg = '게시글을 불러오는데 실패했습니다.';
          
          // 401 오류(인증 실패)인 경우 특별 처리
          if (response.status === 401) {
            console.log('인증이 필요한 리소스에 접근 시도했습니다.');
            errorMsg = '인증이 필요한 기능입니다.';
          } else {
            try {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.indexOf("application/json") !== -1) {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
              } else {
                errorMsg = `서버 오류: ${response.status}`;
              }
            } catch {
              errorMsg = `서버 오류: ${response.status}`;
            }
          }
          throw new Error(errorMsg);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || contentType.indexOf("application/json") === -1) {
          throw new Error("서버에서 유효한 데이터를 반환하지 않았습니다.");
        }
        
        const postData = await response.json();
        setPost(postData); // 게시글 데이터 먼저 설정하여 UI가 렌더링되도록 함
        
        // 로그인 상태일 때만 추가 데이터 조회
        if (isLogin) {
          // 비동기로 처리하고 await 하지 않음 - UI 블로킹 방지
          Promise.all([
            // 좋아요 상태 확인
            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${params.id}/like-status`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // 쿠키 인증 사용
            }).then(async res => {
              if (res.ok) {
                const likeData = await res.json();
                setIsLiked(likeData.isLiked);
              } else {
                console.log('좋아요 상태 확인 실패:', await res.text());
                setIsLiked(false);
              }
            }).catch(err => {
              console.log('좋아요 상태 확인 중 오류:', err);
              setIsLiked(false);
            }),
            
            // 신고 상태 확인
            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${params.id}/report-status`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // 쿠키 인증 사용
            }).then(async res => {
              if (res.ok) {
                const reportData = await res.json();
                setIsReported(reportData.isReported);
              } else {
                console.log('신고 상태 확인 실패:', await res.text());
                setIsReported(false);
              }
            }).catch(err => {
              console.log('신고 상태 확인 중 오류:', err);
              setIsReported(false);
            }),
            
            // 게시글 작성자 여부 확인
            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${params.id}/is-owner`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // 쿠키 인증 사용
            }).then(async res => {
              if (res.ok) {
                const ownerData = await res.json();
                setPost(prev => prev ? { ...prev, isOwner: ownerData.isOwner } : null);
                console.log('게시글 작성자 여부:', ownerData.isOwner);
              } else {
                console.log('게시글 작성자 확인 실패:', await res.text());
                setPost(prev => prev ? { ...prev, isOwner: false } : null);
              }
            }).catch(err => {
              console.log('게시글 작성자 확인 중 오류:', err);
              setPost(prev => prev ? { ...prev, isOwner: false } : null);
            }),
            
            // 댓글 목록 조회
            fetchComments(postData.id).then(commentsData => {
              setComments(commentsData);
            })
          ]);
        } else {
          setComments([]);
        }
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
  }, [params.id, isLogin, router]);

  // 게시글 좋아요 기능
  const handleLike = async () => {
    if (!post || isLiking) return;
    
    // 로그인 여부 확인
    if (!isLogin) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    
    setIsLiking(true);
    try {
      // 백엔드의 토글 API 호출 - 이미 좋아요 했으면 취소, 안했으면 좋아요 추가
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 인증 사용
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

  // 게시글 메뉴 토글
  const togglePostMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPostMenu(!showPostMenu);
    setShowCommentMenu(null);
  };

  // 게시글 수정 페이지로 이동
  const handleEdit = () => {
    if (!post) return;
    
    // 로그인 여부 확인
    if (!isLogin) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    
    // 작성자 여부 확인
    if (!post.isOwner) {
      alert('자신의 게시글만 수정할 수 있습니다.');
      return;
    }
    
    router.push(`/post/${post.id}/edit`);
    setShowPostMenu(false);
  };

  // 게시글 삭제 기능
  const handleDelete = async () => {
    if (!post || !confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    
    // 로그인 여부 확인
    if (!isLogin) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    
    // 작성자 여부 확인
    if (!post.isOwner) {
      alert('자신의 게시글만 삭제할 수 있습니다.');
      return;
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${post.id}`, {
        method: 'DELETE',
        credentials: 'include', // 쿠키 인증 사용
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

  // 게시글 신고 기능
  const handleReport = async (id: number) => {
    if (!post || isReported || isReporting) return;
    
    // 로그인 여부 확인
    if (!isLogin) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    
    // 자신의 게시글인지 확인
    if (post.isOwner) {
      alert('자신의 게시글은 신고할 수 없습니다.');
      setShowPostMenu(false);
      return;
    }
    
    setIsReporting(true);
    try {
      // 백엔드 게시글 신고 API 호출
      console.log('게시글 신고 요청:', id);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 인증 사용
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
      // 로그인 체크
      if (!isLogin) {
        console.log('로그인이 필요한 기능입니다.');
        return [];
      }
      
      console.log(`댓글 목록 조회 API 호출: 게시글 ID ${postId}`);
      
      try {
        // 백엔드 API에서 좋아요 상태를 포함한 댓글 목록 조회
        const commentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/comments/by-post/${postId}`, {
          credentials: 'include', // 쿠키 인증 사용
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache' // 캐시 방지
          },
        });
        
        if (!commentsResponse.ok) {
          console.error('댓글 목록 조회 실패:', await commentsResponse.text());
          return [];
        }
        
        // 응답이 텍스트 형식일 경우 처리
        const commentsText = await commentsResponse.text();
        
        if (!commentsText.trim()) {
          console.log('게시글에 댓글이 없습니다.');
          return [];
        }
        
        let commentsData;
        try {
          commentsData = JSON.parse(commentsText);
          console.log('댓글 목록 조회 성공:', commentsData);
          
          if (commentsData && commentsData.length > 0) {
            const firstComment = commentsData[0];
            console.log('첫 번째 댓글 객체 구조:', Object.keys(firstComment));
            console.log('isLiked 속성 타입:', typeof firstComment.isLiked);
            console.log('isLiked 속성 값:', firstComment.isLiked);
          }
        } catch (e) {
          console.error('댓글 목록 JSON 파싱 오류:', e);
          return [];
        }
        
        // 댓글이 없으면 빈 배열 반환
        if (!commentsData || commentsData.length === 0) {
          return [];
        }
        
        // 각 댓글의 신고 상태와 본인 작성 여부 확인 (병렬 처리)
        const commentStatusPromises = commentsData.map(async (comment: Comment) => {
          try {
            // 1. 신고 상태 확인
            const reportStatusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/comments/reports/${comment.id}/status`, {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (reportStatusResponse.ok) {
              const reportStatus = await reportStatusResponse.json();
              comment.isReported = reportStatus.isReported;
            } else {
              comment.isReported = false;
            }
            
            // 2. 본인 작성 여부 확인
            const ownerStatusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/comments/reports/${comment.id}/is-owner`, {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (ownerStatusResponse.ok) {
              const ownerStatus = await ownerStatusResponse.json();
              comment.isOwner = ownerStatus.isOwner;
            } else {
              comment.isOwner = false;
            }
            
          } catch (error) {
            console.error(`댓글 ID ${comment.id}의 상태 확인 중 오류:`, error);
            comment.isReported = false;
            comment.isOwner = false;
          }
          return comment;
        });
        
        // 모든 댓글의 상태를 기다림
        const commentsWithStatus = await Promise.all(commentStatusPromises);
        
        console.log('댓글 목록과 상태 로드 완료:', commentsWithStatus);
        return commentsWithStatus;
        
      } catch (error) {
        console.error('댓글 정보 로드 중 오류:', error);
        return [];
      }
    } catch (error) {
      console.error('댓글 목록 불러오기 오류:', error);
      return [];
    }
  };

  // 댓글 등록
  const handleCommentSubmit = async () => {
    if (!commentInput.trim() || !post) return;
    
    // 로그인 여부 확인
    if (!isLogin) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    
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
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 인증 사용
        body: JSON.stringify(commentData)
      });
      
      // 응답이 텍스트 형식이므로 text()로 읽습니다
      const responseText = await response.text();
      
      if (response.ok) {
        console.log('댓글 등록 성공:', responseText);
        // 댓글 입력창 초기화
        setCommentInput('');
        // 댓글 목록 새로고침
        const updatedComments = await fetchComments(post.id);
        setComments(updatedComments);
      } else {
        console.error('댓글 등록 실패:', responseText);
        alert(`댓글 등록에 실패했습니다: ${responseText}`);
      }
    } catch (error) {
      console.error('댓글 등록 중 오류:', error);
      alert('댓글 등록 중 오류가 발생했습니다.');
    }
  };

  // 댓글 메뉴 토글
  const toggleCommentMenu = (e: React.MouseEvent, commentId: number) => {
    e.stopPropagation();
    // 같은 메뉴를 클릭하면 토글, 다른 메뉴를 클릭하면 그 메뉴를 엶
    setShowCommentMenu(showCommentMenu === commentId ? null : commentId);
    setShowPostMenu(false);
  };

  // 댓글 수정 버튼 클릭 이벤트 핸들러 수정
  const startCommentEdit = (commentId: number, content: string) => {
    console.log('댓글 수정 시작:', commentId, content);
    
    // 댓글 찾기
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    // 작성자 여부 확인
    if (!comment.isOwner) {
      alert('자신의 댓글만 수정할 수 있습니다.');
      setShowCommentMenu(null);
      return;
    }
    
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
    
    // 로그인 여부 확인
    if (!isLogin) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    
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
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 인증 사용
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
        const updatedComments = await fetchComments(post.id);
        setComments(updatedComments);
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
    // 댓글 찾기
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    // 작성자 여부 확인
    if (!comment.isOwner) {
      alert('자신의 댓글만 삭제할 수 있습니다.');
      setShowCommentMenu(null);
      return;
    }
    
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?') || !post) return;
    
    // 로그인 여부 확인
    if (!isLogin) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    
    try {
      console.log('댓글 삭제 요청:', commentId);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include', // 쿠키 인증 사용
      });
      
      // 응답이 텍스트 형식이므로 text()로 읽습니다
      const responseText = await response.text();
      
      if (response.ok) {
        console.log('댓글 삭제 성공:', responseText);
        // 댓글 목록 새로고침
        const updatedComments = await fetchComments(post.id);
        setComments(updatedComments);
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

  // 댓글 좋아요 기능
  const handleCommentLike = async (commentId: number) => {
    if (!post || commentLikingId === commentId) return;
    
    // 로그인 여부 확인
    if (!isLogin) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    
    setCommentLikingId(commentId);
    try {
      // 현재 댓글의 좋아요 상태 확인
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;
      
      const isCurrentlyLiked = Boolean(comment.isLiked);
      console.log(`댓글 ID ${commentId}의 현재 좋아요 상태:`, isCurrentlyLiked);
      
      // 좋아요 토글 UI 즉시 반영 (옵티미스틱 업데이트)
      const newLikedState = !isCurrentlyLiked;
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { 
              ...c, 
              likeCount: newLikedState 
                ? c.likeCount + 1          // 좋아요 추가 시 +1
                : Math.max(0, c.likeCount - 1),  // 좋아요 취소 시 -1 (음수 방지)
              isLiked: newLikedState        // 좋아요 상태 토글
            }
          : c
      ));
      
      // 백엔드의 토글 API 호출 - 이미 좋아요 했으면 취소, 안했으면 좋아요 추가
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/likes/comments/${commentId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 인증 사용
      });
      
      if (!response.ok) {
        // API 호출 실패 시 원래 상태로 복원
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { 
                ...c, 
                likeCount: isCurrentlyLiked 
                  ? c.likeCount + 1          // 원래 좋아요 상태 복원
                  : Math.max(0, c.likeCount - 1),  
                isLiked: isCurrentlyLiked        // 원래 좋아요 상태 복원
              }
            : c
        ));
        throw new Error('좋아요 처리에 실패했습니다.');
      }
      
      // API 호출 성공 로그
      console.log(`댓글 좋아요 ${newLikedState ? '추가' : '취소'} 완료:`, commentId);
      
    } catch (err) {
      console.error('댓글 좋아요 처리 중 오류:', err);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setCommentLikingId(null);
    }
  };

  // 댓글 신고
  const handleCommentReport = async (commentId: number) => {
    // 로그인 여부 확인
    if (!isLogin) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    
    // 댓글 찾기
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    // 자신의 댓글인지 확인
    if (comment.isOwner) {
      alert('자신의 댓글은 신고할 수 없습니다.');
      setShowCommentMenu(null);
      return;
    }
    
    // 이미 신고한 댓글인지 확인
    if (comment.isReported) {
      alert('이미 신고한 댓글입니다.');
      setShowCommentMenu(null);
      return;
    }
    
    try {
      // 백엔드 댓글 신고 API 호출
      console.log('댓글 신고 요청:', commentId);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/comments/reports/${commentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 인증 사용
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`댓글 신고 실패: ${errorText}`);
      }
      
      // 신고 성공 시 해당 댓글의 신고 상태 업데이트
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, isReported: true } 
          : c
      ));
      
      alert('댓글을 신고했습니다.');
      setShowCommentMenu(null);
    } catch (error) {
      console.error('댓글 신고 처리 중 오류:', error);
      alert('댓글 신고 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4" style={{ width: '971px' }}>
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
      <div className="container mx-auto p-4" style={{ width: '971px' }}>
        <div className="bg-white p-6 text-center">
          <h1 className="text-xl font-semibold text-red-500 mb-4">오류 발생</h1>
          <p className="mb-4">{error}</p>
          <div className="flex justify-center gap-4">
            {error.includes('로그인이 필요') && (
              <Link href="/login" className="bg-[#980ffa] text-white px-4 py-2 rounded-md">
                로그인하기
              </Link>
            )}
            <button 
              onClick={() => router.push('/post')}
              className="bg-gray-500 text-white px-4 py-2 rounded-md"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto p-4" style={{ width: '971px' }}>
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
    <div className="mx-auto p-5 bg-[#f9fafc] flex flex-col items-center" style={{ width: '100%' }}>
      {/* 게시판 타이틀 */}
      {/* <div className="p-[10px] pt-5 rounded mb-4">
        <Link href="/post">
          <h1 className="text-2xl font-bold cursor-pointer hover:text-[#980ffa] transition-colors">글 상세</h1>
        </Link>
      </div> */}
      
      {/* 게시글 상세 컴포넌트 */}
      <div className="bg-[#ffffff] p-[30px] mb-4 rounded border border-[#F9FAFB]" style={{ width: '971px' }}>
        {/* 게시글 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="w-[50px] h-[50px] rounded-full bg-gray-400 flex items-center justify-center overflow-hidden mr-3">
              <span className="material-icons text-white text-[30px]">account_circle</span>
            </div>
            <span className="font-medium mr-[10px]">{post.nickname}</span>
            <span className="text-gray-500 text-sm">
              {post.modificationTime && post.modificationTime.trim() 
                ? `${formatTime(post.modificationTime)} (수정)` 
                : formatTime(post.creationTime)}
            </span>
          </div>
          {isLogin && (
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
                  {post.isOwner && (
                    <>
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
                    </>
                  )}
                  <button 
                    className={`flex items-center w-full text-left p-[5px] m-[5px] text-sm hover:${isReported || post?.isOwner ? 'bg-gray-50' : 'bg-gray-100'} border-none bg-[#ffffff] m-[5px] menu-item`}
                    onClick={() => handleReport(post.id)}
                    disabled={isReported || post?.isOwner}
                  >
                    <span className={`material-icons ${isReported || post?.isOwner ? 'text-gray-400' : 'text-gray-500'} m-[5px] mr-2`}>flag</span>
                    {isReported ? '신고 완료' : post?.isOwner ? '본인 게시글' : '글 신고'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <h1 className="text-xl font-bold mb-2 pl-2">{post.title}</h1>
        
        {/* 게시글 내용 */}
        <div className="py-4 pl-5">
          <div 
            className="tiptap-content-wrapper"
            dangerouslySetInnerHTML={createMarkup()}
          />
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
          {isLogin ? (
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
          ) : (
            <div className="text-center">
              <Link href="/login" className="flex items-center justify-center rounded-[10px] py-1 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                <span className="material-icons m-[5px]">favorite_border</span>
                <span className="m-[5px]">좋아요</span>
                <span className="m-[5px]">{post.likeCount}</span>
              </Link>
              <p className="text-xs text-gray-500 mt-1">좋아요를 누르려면 로그인하세요</p>
            </div>
          )}
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
      <div className="p-[10px] pt-5 rounded mb-4 flex justify-between items-center" style={{ width: '971px' }}>
        <h3 className="font-medium">{comments.length}개의 댓글</h3>
        <button
          onClick={() => router.push('/post')}
          className="bg-[#980ffa] text-[#ffffff] py-[10px] px-[20px] rounded-[3px] border-none text-[12px]"
        >
          목록
        </button>
      </div>
      
      {/* 댓글 컴포넌트와 입력 영역을 감싸는 컨테이너 */}
      <div className="bg-[#ffffff] rounded border border-[#f9fafb] mb-4 p-[20px] m-[10px]" style={{ width: '971px' }}>
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
                      <div className="relative ml-auto" ref={(el) => { commentMenuRefs.current[comment.id] = el; }}>
                        <button 
                          className="text-gray-500 bg-[#ffffff] border-none menu-button"
                          onClick={(e) => toggleCommentMenu(e, comment.id)}
                        >
                          <span className="material-icons">more_horiz</span>
                        </button>
                        
                        {/* 댓글 드롭다운 메뉴 */}
                        {showCommentMenu === comment.id && (
                          <div className="absolute right-0 top-full mt-1 bg-[#ffffff] shadow-md rounded-md z-10 w-[120px] border-none m-[5px]">
                            {comment.isOwner && (
                              <>
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
                              </>
                            )}
                            <button 
                              className={`flex items-center w-full text-left p-[5px] m-[5px] text-sm hover:${comment.isReported || comment.isOwner ? 'bg-gray-50' : 'bg-gray-100'} border-none bg-[#ffffff] m-[5px] menu-item`}
                              onClick={() => handleCommentReport(comment.id)}
                              disabled={comment.isReported || comment.isOwner}
                            >
                              <span className={`material-icons m-[5px] mr-2 ${comment.isReported || comment.isOwner ? 'text-gray-400' : 'text-gray-500'}`}>flag</span>
                              {comment.isReported ? '신고 완료' : comment.isOwner ? '본인 댓글' : '댓글 신고'}
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
                        className={`flex items-center text-sm border-none ${
                          Boolean(comment.isLiked) ? 'text-pink-500 hover:text-pink-600 bg-pink-50' : 'text-gray-500 hover:text-gray-600'
                        } hover:bg-gray-100 rounded-full px-2 py-1 transition-colors duration-200`}
                        onClick={() => handleCommentLike(comment.id)}
                        disabled={commentLikingId === comment.id}
                        aria-label={Boolean(comment.isLiked) ? '좋아요 취소' : '좋아요'}
                      >
                        <span className={`material-icons text-sm mr-1 m-[5px] ${
                          Boolean(comment.isLiked) ? 'text-pink-500 animate-pulse-like' : 'text-gray-500'
                        }`}>
                          {Boolean(comment.isLiked) ? 'favorite' : 'favorite_border'}
                        </span>
                        <span className={Boolean(comment.isLiked) ? 'text-pink-500 font-medium' : 'text-gray-500'}>
                          {comment.likeCount}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            {isLogin 
              ? "첫 번째 댓글을 작성해보세요."
              : "댓글을 보려면 로그인이 필요합니다."}
          </div>
        )}
        
        {/* 댓글 입력 컴포넌트 - 로그인 상태에 따라 다르게 표시 */}
        {isLogin ? (
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
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
            <Link href="/login" className="bg-[#980ffa] text-white px-4 py-2 rounded-md inline-block">
              로그인하기
            </Link>
          </div>
        )}
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
        
        /* 직접적인 선택자로 변경하여 우선순위 높임 */
        div.tiptap-content-wrapper h1 {
          font-size: 2em !important;
          font-weight: bold !important;
          margin: 0.8em 0 0.5em !important;
          color: #333 !important;
          line-height: 1.2 !important;
        }
        
        div.tiptap-content-wrapper h2 {
          font-size: 1.5em !important;
          font-weight: bold !important;
          margin: 0.8em 0 0.5em !important;
          color: #333 !important;
          line-height: 1.3 !important;
        }
        
        div.tiptap-content-wrapper h3 {
          font-size: 1.17em !important;
          font-weight: bold !important;
          margin: 0.8em 0 0.5em !important;
          color: #333 !important;
          line-height: 1.4 !important;
        }

        /* 에디터 스타일이 적용될 수 있도록 추가 설정 */
        .tiptap-content-wrapper * {
          max-width: 100%;
        }
        
        .tiptap-content-wrapper img {
          max-width: 100%;
          height: auto;
        }

        /* 인용구 스타일 */
        div.tiptap-content-wrapper blockquote {
          border-left: 3px solid #980ffa !important;
          padding-left: 1em !important;
          margin-left: 0 !important;
          color: #555 !important;
        }
        
        /* 목록 스타일 수정 */
        div.tiptap-content-wrapper ul,
        div.tiptap-content-wrapper ol {
          padding-left: 1.5em !important;
        }
        
        div.tiptap-content-wrapper ul {
          list-style-type: disc !important;
        }
        
        div.tiptap-content-wrapper ol {
          list-style-type: decimal !important;
        }
        
        div.tiptap-content-wrapper ul li,
        div.tiptap-content-wrapper ol li {
          color: #333 !important;
        }
        
        div.tiptap-content-wrapper ul li::marker,
        div.tiptap-content-wrapper ol li::marker {
          color: #000000 !important;
        }

        /* 좋아요 애니메이션 효과 */
        @keyframes pulse-like {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        
        .animate-pulse-like {
          animation: pulse-like 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}
