'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useGlobalLoginMember } from '@/stores/auth/loginMember';
import { fetchApi } from '@/utils/api';

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
    boardType?: string;
    type?: string;
    academyCode?: string;
    profileImageUrl?: string;
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
    profileImageUrl?: string;
}

export default function PostDetailPage() {
    const { isLogin } = useGlobalLoginMember();
    const router = useRouter();
    const params = useParams();
    const postId = params.id;
    const searchParams = useSearchParams();
    const academyCode = searchParams.get('academyCode');
    const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentInput, setCommentInput] = useState('');
    const [editCommentContent, setEditCommentContent] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [lastEditedCommentId, setLastEditedCommentId] = useState<number | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isReported, setIsReported] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const isMounted = useRef(false);

    const [showPostMenu, setShowPostMenu] = useState(false);
    const [showCommentMenu, setShowCommentMenu] = useState<number | null>(null);
    const postMenuRef = useRef<HTMLDivElement>(null);
    const commentMenuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const [commentLikingId, setCommentLikingId] = useState<number | null>(null);
    const editCommentRef = useRef<HTMLTextAreaElement>(null);

    const [showScrollTopButton, setShowScrollTopButton] = useState(false);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Element;
            if (target.closest('.menu-button') || target.closest('.menu-item')) {
                return;
            }

            if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) {
                setShowPostMenu(false);
            }

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

    useEffect(() => {
    }, [editingCommentId, editCommentContent]);

    useEffect(() => {
        const checkAdmin = async () => {
            if (isLogin) {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/check`, {
                        method: 'GET',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    if (response.ok) {
                        const isAdminResult = await response.json();
                        setIsCurrentUserAdmin(isAdminResult === true);
                    } else {
                        setIsCurrentUserAdmin(false);
                    }
                } catch (e) {
                    setIsCurrentUserAdmin(false);
                }
            } else {
                setIsCurrentUserAdmin(false);
            }
        };
        checkAdmin();
    }, [isLogin]);

    useEffect(() => {
        const fetchPostDetail = async () => {
            if (!postId) return;
            if (isMounted.current) {
                return;
            }
            isMounted.current = true;

            const viewedPosts = JSON.parse(sessionStorage.getItem('viewedPosts') || '{}');
            const postKey = `post_${postId}`;
            const hasViewed = viewedPosts[postKey];

            setLoading(true);
            setError(null);
            try {
                const searchParams = new URLSearchParams(window.location.search);
                const currentAcademyCode = academyCode || searchParams.get('academyCode');


                let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${postId}?postView=${!hasViewed}`;
                if (currentAcademyCode) {
                    url += `&academyCode=${encodeURIComponent(currentAcademyCode)}`;
                }

                const response = await fetchApi(url, {
                    method: 'GET',
                });

                if (!hasViewed) {
                    viewedPosts[postKey] = true;
                    sessionStorage.setItem('viewedPosts', JSON.stringify(viewedPosts));
                }

                if (!response.ok) {
                    let errorMsg = '게시글을 불러오는데 실패했습니다.';

                    if (response.status === 401) {
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

                if (currentAcademyCode && !postData.academyCode) {
                    postData.academyCode = currentAcademyCode;
                }

                setPost(postData);

                if (isLogin) {
                    Promise.all([
                        fetchApi(`/api/v1/posts/${params.id}/like-status`, {
                            method: 'GET',
                        }).then(async res => {
                            if (res.ok) {
                                const likeData = await res.json();
                                setIsLiked(likeData.isLiked);
                            } else {
                                setIsLiked(false);
                            }
                        }).catch(err => {
                            console.log('좋아요 상태 확인 중 오류:', err);
                            setIsLiked(false);
                        }),

                        fetchApi(`/api/v1/posts/${postId}/report-status`, {
                            method: 'GET',
                        }).then(async res => {
                            if (res.ok) {
                                const reportData = await res.json();
                                setIsReported(reportData.isReported);
                            } else {
                                setIsReported(false);
                            }
                        }).catch(err => {
                            console.log('신고 상태 확인 중 오류:', err);
                            setIsReported(false);
                        }),

                        fetchApi(`/api/v1/posts/${postId}/is-owner`, {
                            method: 'GET',
                        }).then(async res => {
                            if (res.ok) {
                                const ownerData = await res.json();
                                setPost(prev => prev ? { ...prev, isOwner: ownerData.isOwner } : null);
                            } else {
                                setPost(prev => prev ? { ...prev, isOwner: false } : null);
                            }
                        }).catch(err => {
                            console.log('게시글 작성자 확인 중 오류:', err);
                            setPost(prev => prev ? { ...prev, isOwner: false } : null);
                        }),

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

        return () => { };
    }, [postId, isLogin, router, academyCode, params.id]);

    const handleLike = async () => {
        if (!post || isLiking) return;

        if (!isLogin) {
            alert('로그인이 필요한 기능입니다.');
            return;
        }

        setIsLiking(true);
        try {
            const searchParams = new URLSearchParams(window.location.search);
            const currentAcademyCode = post.academyCode || academyCode || searchParams.get('academyCode');

            let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${post.id}/likes`;
            if (currentAcademyCode) {
                url += `?academyCode=${encodeURIComponent(currentAcademyCode)}`;
            }


            const response = await fetchApi(url, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('좋아요 처리에 실패했습니다.');
            }

            const newLikedState = !isLiked;
            setIsLiked(newLikedState);

            setPost(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    likeCount: newLikedState
                        ? prev.likeCount + 1
                        : Math.max(0, prev.likeCount - 1)
                };
            });

        } catch (err) {
            console.error('좋아요 처리 중 오류:', err);
        } finally {
            setIsLiking(false);
        }
    };

    const togglePostMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowPostMenu(!showPostMenu);
        setShowCommentMenu(null);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!post) return;
        if (!isLogin) {
            alert('로그인이 필요한 기능입니다.');
            return;
        }

        if (!isCurrentUserAdmin && !post.isOwner) {
            alert('수정 권한이 없습니다.');
            setShowPostMenu(false);
            return;
        }

        setShowPostMenu(false);

        const isNotice = post.type === 'notice' || post.boardType === 'notice';

        const searchParams = new URLSearchParams(window.location.search);
        const currentAcademyCode = post.academyCode || academyCode || searchParams.get('academyCode');


        let editUrl = `/post/${post.id}/edit${isNotice ? '?type=notice' : ''}`;
        if (currentAcademyCode) {
            editUrl += `${isNotice ? '&' : '?'}academyCode=${currentAcademyCode}`;
        }

        setTimeout(() => {
            router.push(editUrl);
        }, 100);
    };

    const handleDelete = async () => {
        if (!post || isCurrentUserAdmin) return;
        if (!isLogin) {
            alert('로그인이 필요한 기능입니다.');
            return;
        }

        if (!post.isOwner) {
            alert('자신의 게시글만 삭제할 수 있습니다.');
            setShowPostMenu(false);
            return;
        }

        if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

        try {
            const response = await fetchApi(`/api/v1/posts/${post.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('게시글 삭제에 실패했습니다.');
            }

            alert('게시글이 삭제되었습니다.');

            if (isNoticePost(post)) {
                const currentAcademyCode = post.academyCode || academyCode || searchParams.get('academyCode');
                const noticeUrl = currentAcademyCode ? `/post/notice?academyCode=${currentAcademyCode}&type=notice` : '/post/notice?type=notice';
                router.push(noticeUrl);
            } else {
                router.push('/post');
            }
        } catch (err) {
            console.error('게시글 삭제 중 오류:', err);
            alert(err instanceof Error ? err.message : '게시글 삭제에 실패했습니다.');
        }
    };

    const handleReport = async (id: number) => {
        if (!post || isReported || isReporting) return;

        if (!isLogin) {
            alert('로그인이 필요한 기능입니다.');
            return;
        }

        if (post.isOwner) {
            alert('자신의 게시글은 신고할 수 없습니다.');
            setShowPostMenu(false);
            return;
        }

        setIsReporting(true);
        try {
            const searchParams = new URLSearchParams(window.location.search);
            const currentAcademyCode = post.academyCode || academyCode || searchParams.get('academyCode');

            let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${id}/report`;
            if (currentAcademyCode) {
                url += `?academyCode=${encodeURIComponent(currentAcademyCode)}`;
            }


            const response = await fetchApi(url, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`게시글 신고 실패: ${errorText}`);
            }

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


    const fetchComments = async (postId: number) => {
        try {
            if (!isLogin) {
                return [];
            }


            try {
                const searchParams = new URLSearchParams(window.location.search);
                const currentAcademyCode = post?.academyCode || academyCode || searchParams.get('academyCode');

                let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/comments/by-post/${postId}`;
                if (currentAcademyCode) {
                    url += `?academyCode=${encodeURIComponent(currentAcademyCode)}`;
                }

                const commentsResponse = await fetchApi(url, {
                    method: 'GET',
                });

                if (!commentsResponse.ok) {
                    console.error('댓글 목록 조회 실패:', await commentsResponse.text());
                    return [];
                }

                const commentsText = await commentsResponse.text();

                if (!commentsText.trim()) {
                    return [];
                }

                let commentsData;
                try {
                    commentsData = JSON.parse(commentsText);

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

                if (!commentsData || commentsData.length === 0) {
                    return [];
                }

                const commentStatusPromises = commentsData.map(async (comment: Comment) => {
                    try {
                        const reportStatusResponse = await fetchApi(`/api/v1/comments/reports/${comment.id}/status`, {
                            method: 'GET',
                        });

                        if (reportStatusResponse.ok) {
                            const reportStatus = await reportStatusResponse.json();
                            comment.isReported = reportStatus.isReported;
                        } else {
                            comment.isReported = false;
                        }

                        const ownerStatusResponse = await fetchApi(`/api/v1/comments/reports/${comment.id}/is-owner`, {
                            method: 'GET',
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

                const commentsWithStatus = await Promise.all(commentStatusPromises);

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

    const handleCommentSubmit = async () => {
        if (!commentInput.trim() || !post) return;

        if (!isLogin) {
            alert('로그인이 필요한 기능입니다.');
            return;
        }

        try {
            const commentData = {
                boardId: post.id,
                content: commentInput
            };

            console.log('댓글 등록 요청 데이터:', commentData);

            const response = await fetchApi(`/api/v1/comments`, {
                method: 'POST',
                body: JSON.stringify(commentData)
            });

            const responseText = await response.text();

            if (response.ok) {
                setCommentInput('');
                const updatedComments = await fetchComments(post.id);
                setComments(updatedComments);
            } else {
                alert(`댓글 등록에 실패했습니다: ${responseText}`);
            }
        } catch (error) {
            console.error('댓글 등록 중 오류:', error);
            alert('댓글 등록 중 오류가 발생했습니다.');
        }
    };

    const toggleCommentMenu = (e: React.MouseEvent, commentId: number) => {
        e.stopPropagation();
        setShowCommentMenu(showCommentMenu === commentId ? null : commentId);
        setShowPostMenu(false);
    };

    const startCommentEdit = (commentId: number, content: string) => {

        const comment = comments.find(c => c.id === commentId);
        if (!comment) return;

        if (!isCurrentUserAdmin && !comment.isOwner) {
            alert('댓글 수정 권한이 없습니다.');
            setShowCommentMenu(null);
            return;
        }

        if (editingCommentId !== null && editCommentContent !== '' && editingCommentId !== commentId) {
            if (!confirm('다른 댓글 수정 중입니다. 변경 사항을 저장하지 않고 계속하시겠습니까?')) {
                return;
            }
        }

        setShowCommentMenu(null);

        setEditingCommentId(commentId);
        setEditCommentContent(content);

        setTimeout(() => {
            if (editCommentRef.current) {
                editCommentRef.current.focus();
            }
        }, 100);
    };

    const cancelCommentEdit = () => {
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

    const submitCommentEdit = async () => {
        if (!editingCommentId || !editCommentContent.trim() || !post) return;

        if (!isLogin) {
            alert('로그인이 필요한 기능입니다.');
            return;
        }

        try {
            const commentData = {
                commenterId: editingCommentId,
                content: editCommentContent.trim()
            };

            console.log('댓글 수정 요청 데이터:', commentData, 'commenterId:', editingCommentId);

            const response = await fetchApi(`/api/v1/comments/update`, {
                method: 'POST',
                body: JSON.stringify(commentData),
            });

            if (response.ok) {
                setLastEditedCommentId(editingCommentId);
                setEditingCommentId(null);
                setEditCommentContent('');
                const updatedComments = await fetchComments(post.id);
                setComments(updatedComments);
                setTimeout(() => {
                    setLastEditedCommentId(null);
                }, 5000);
            } else {
                const errorText = await response.text();
                console.error('댓글 수정 실패:', errorText);
                alert(`댓글 수정에 실패했습니다. 오류: ${errorText || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('댓글 수정 중 오류:', error);
            alert('댓글 수정 중 오류가 발생했습니다.');
        }
    };

    const handleCommentDelete = async (commentId: number) => {
        const comment = comments.find(c => c.id === commentId);
        if (!comment || isCurrentUserAdmin) return;
        if (!isLogin) {
            alert('로그인이 필요한 기능입니다.');
            return;
        }

        if (!comment.isOwner) {
            alert('자신의 댓글만 삭제할 수 있습니다.');
            setShowCommentMenu(null);
            return;
        }

        if (!confirm('정말 이 댓글을 삭제하시겠습니까?') || !post) return;

        try {

            const response = await fetchApi(`/api/v1/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                console.log('댓글 삭제 성공');
                const updatedComments = await fetchComments(post.id);
                setComments(updatedComments);
                setShowCommentMenu(null);
            } else {
                console.error('댓글 삭제 실패');
                alert('댓글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('댓글 삭제 중 오류:', error);
            alert('댓글 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleCommentLike = async (commentId: number) => {
        if (!post || commentLikingId === commentId) return;

        if (!isLogin) {
            alert('로그인이 필요한 기능입니다.');
            return;
        }

        setCommentLikingId(commentId);

        try {
            const comment = comments.find(c => c.id === commentId);
            if (!comment) return;

            const isCurrentlyLiked = Boolean(comment.isLiked);

            const newLikedState = !isCurrentlyLiked;
            setComments(prev => prev.map(c =>
                c.id === commentId
                    ? {
                        ...c,
                        likeCount: newLikedState
                            ? c.likeCount + 1
                            : Math.max(0, c.likeCount - 1),
                        isLiked: newLikedState
                    }
                    : c
            ));

            const response = await fetchApi(`/api/v1/likes/comments/${commentId}/toggle`, {
                method: 'POST',
            });

            if (!response.ok) {
                setComments(prev => prev.map(c =>
                    c.id === commentId
                        ? {
                            ...c,
                            likeCount: isCurrentlyLiked
                                ? c.likeCount + 1
                                : Math.max(0, c.likeCount - 1),
                            isLiked: isCurrentlyLiked
                        }
                        : c
                ));
                throw new Error('좋아요 처리에 실패했습니다.');
            }


        } catch (err) {
            console.error('댓글 좋아요 처리 중 오류:', err);
            alert('좋아요 처리 중 오류가 발생했습니다.');
        } finally {
            setCommentLikingId(null);
        }
    };

    const handleCommentReport = async (commentId: number) => {
        if (!post) return;

        if (!isLogin) {
            alert('로그인이 필요한 기능입니다.');
            return;
        }

        const comment = comments.find(c => c.id === commentId);
        if (!comment) return;

        if (comment.isOwner) {
            alert('자신의 댓글은 신고할 수 없습니다.');
            setShowCommentMenu(null);
            return;
        }

        if (comment.isReported) {
            alert('이미 신고한 댓글입니다.');
            setShowCommentMenu(null);
            return;
        }

        try {

            const response = await fetchApi(`/api/v1/comments/reports/${commentId}`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`댓글 신고 실패: ${errorText}`);
            }

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

    const isNoticePost = useCallback((post: Post | null) => {
        return post?.type === 'notice' || post?.boardType === 'notice';
    }, []);

    const handleAdminAction = async (
        itemId: number,
        itemType: 'post' | 'comment',
        targetStatus: 'inactive' | 'pending'
    ) => {
        if (!isCurrentUserAdmin) return;

        const itemTypeName = itemType === 'post' ? '게시글' : '댓글';
        const actionName = targetStatus === 'inactive' ? '비활성화' : '정지';
        const confirmMessage = `관리자 권한으로 이 ${itemTypeName}을(를) '${actionName}' 상태로 변경하시겠습니까?`;

        if (!confirm(confirmMessage)) return;

        const apiUrl = itemType === 'post'
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/posts/${itemId}/admin-status-change`
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/comments/${itemId}/admin-status-change`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: targetStatus })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`${itemTypeName} 상태 변경 실패: ${errorText || response.status}`);
            }

            alert(`${itemTypeName} 상태가 성공적으로 변경되었습니다.`);
            setShowPostMenu(false);
            setShowCommentMenu(null);

            if (itemType === 'post') {
                const listUrl = isNoticePost(post)
                    ? `/post/notice?academyCode=${post?.academyCode || academyCode || searchParams.get('academyCode')}&type=notice`
                    : '/post';
                router.push(listUrl.replace(/&?academyCode=undefined|&?academyCode=/g, ''));
            } else {
                if (post) {
                    const updatedComments = await fetchComments(post.id);
                    setComments(updatedComments);
                }
            }

        } catch (err) {
            console.error(`${itemTypeName} 상태 변경 중 오류:`, err);
            alert(err instanceof Error ? err.message : `${itemTypeName} 상태 변경에 실패했습니다.`);
        }
    };

    // Add/remove scroll event listener
    useEffect(() => {
        const handleScroll = () => {
          if (window.scrollY > 300) {
            setShowScrollTopButton(true);
          } else {
            setShowScrollTopButton(false);
          }
        };

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

    const createMarkup = () => {
        return { __html: post.content };
    };

    const formatTime = (timeString: string) => {
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
        <div className="mx-auto p-5 bg-[#f9fafc] min-h-screen">
            <div className="max-w-[1140px] mx-auto">
                {/* 게시글 상세 컴포넌트 */}
                <div className="bg-white p-8 rounded-[20px] shadow-lg border border-[#F9FAFB] transition-shadow hover:shadow-xl mb-6">
                    {/* 게시글 헤더 */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                                {post.profileImageUrl ? (
                                    <img
                                        src={post.profileImageUrl}
                                        alt={`${post.nickname}의 프로필 이미지`}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null; // 추가 오류 이벤트 방지
                                            target.style.display = 'none'; // 이미지 숨기기
                                            target.parentElement!.innerHTML = `
                                                <span class="material-icons text-[#980ffa] text-2xl">account_circle</span>
                                            `;
                                        }}

                                    />
                                ) : (
                                    <span className="material-icons text-[#980ffa] text-2xl">account_circle</span>
                                )}
                            </div>
                            <div>
                                <span className="font-semibold text-gray-800 block">{post.nickname}</span>
                                <span className="text-sm text-gray-500">
                                    {post.modificationTime && post.modificationTime.trim()
                                        ? `${formatTime(post.modificationTime)} (수정됨)`
                                        : formatTime(post.creationTime)}
                                </span>
                            </div>
                        </div>
                        {isLogin && (!isNoticePost(post) || isCurrentUserAdmin) && (
                            <div className="relative" ref={postMenuRef}>
                                <button
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors menu-button"
                                    onClick={togglePostMenu}
                                >
                                    <span className="material-icons text-gray-600">more_horiz</span>
                                </button>

                                {/* 게시글 드롭다운 메뉴 */}
                                {showPostMenu && post && (
                                    <div className="absolute right-0 top-full mt-2 bg-white rounded-[15px] shadow-lg z-10 w-[160px] overflow-hidden border border-gray-100">
                                        {isCurrentUserAdmin ? (
                                            post.isOwner ? (
                                                <>
                                                    <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors text-blue-600 menu-item" onClick={handleEdit}>
                                                        <span className="material-icons text-blue-600 mr-3">edit</span> 수정하기
                                                    </button>
                                                    <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors text-red-600 menu-item" onClick={() => handleAdminAction(post.id, 'post', 'inactive')}>
                                                        <span className="material-icons text-red-600 mr-3">delete</span> 삭제하기
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors text-orange-600 menu-item" onClick={() => handleAdminAction(post.id, 'post', 'inactive')}>
                                                        <span className="material-icons text-orange-600 mr-3">visibility_off</span> 비활성화
                                                    </button>
                                                    <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors text-purple-600 menu-item" onClick={() => handleAdminAction(post.id, 'post', 'pending')}>
                                                        <span className="material-icons text-purple-600 mr-3">block</span> 정지
                                                    </button>
                                                </>
                                            )
                                        ) : post.isOwner ? (
                                            <>
                                                <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors text-blue-600 menu-item" onClick={handleEdit}>
                                                    <span className="material-icons text-blue-600 mr-3">edit</span> 수정하기
                                                </button>
                                                <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors text-red-600 menu-item" onClick={handleDelete}>
                                                    <span className="material-icons text-red-600 mr-3">delete</span> 삭제하기
                                                </button>
                                            </>
                                        ) : (
                                            <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors menu-item" onClick={() => handleReport(post.id)} disabled={isReported}>
                                                <span className={`material-icons mr-3 ${isReported ? 'text-gray-400' : 'text-gray-600'}`}>flag</span>
                                                <span className={isReported ? 'text-gray-400' : 'text-gray-600'}>{isReported ? '신고 완료' : '신고하기'}</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 leading-tight">{post.title}</h1>

                    {/* 게시글 내용 */}
                    <div className="prose prose-lg max-w-none mb-8">
                        <div
                            className="tiptap-content-wrapper"
                            dangerouslySetInnerHTML={createMarkup()}
                        />
                    </div>

                    {/* 상호작용 버튼 영역 */}
                    <div className="flex flex-wrap items-center gap-6 py-4 border-t border-gray-100">
                        {/* 좋아요 버튼 */}
                        {isLogin ? (
                            <button
                                onClick={handleLike}
                                disabled={isLiking}
                                className={`flex items-center gap-2 group/like transition-all ${isLiked
                                    ? 'text-[#9C50D4]' // pink-500를 #9C50D4로 변경
                                    : 'text-gray-500 hover:text-[#9C50D4]'
                                    }`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-7 w-7 group-hover/like:scale-110 transition-transform ${isLiking ? 'animate-pulse' : ''}`}
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
                                <span className="text-base">{post.likeCount}</span>
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center gap-2 text-gray-500 hover:text-[#9C50D4] transition-all"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-7 w-7"
                                    fill="none"
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
                                <span className="text-base">{post.likeCount}</span>
                            </Link>
                        )}

                        {/* 댓글 수 */}
                        <div className="flex items-center gap-2 text-gray-500 hover:text-[#9C50D4] transition-colors group">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-7 w-7 group-hover:scale-110 transition-transform"
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
                            <span className="text-base">{comments.length}</span>
                        </div>

                        {/* 조회수 */}
                        <div className="flex items-center gap-2 text-gray-500 ml-auto">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-7 w-7"
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
                            <span className="text-base">{post.viewCount}</span>
                        </div>
                    </div>

                    {/* 태그 목록 */}
                    <div className="flex flex-wrap gap-3 mt-6">
                        {post.tags && post.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-4 py-2 rounded-full text-[15px] bg-purple-50 text-[#980ffa] hover:bg-purple-100 transition-colors cursor-pointer"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 댓글 섹션 */}
                <div className="bg-white p-8 rounded-[20px] shadow-lg border border-[#F9FAFB] transition-shadow hover:shadow-xl">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">댓글 {comments.length}개</h3>

                    {/* 댓글 입력 영역 */}
                    {isLogin ? (
                        <div className="mb-8">
                            <textarea
                                placeholder="댓글을 입력하세요..."
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-[15px] focus:outline-none focus:ring-2 focus:ring-[#980ffa] focus:border-transparent resize-none transition-all hover:bg-gray-100 min-h-[120px]"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                            />
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={handleCommentSubmit}
                                    className="px-6 py-2.5 bg-[#980ffa] text-white rounded-full hover:bg-[#7d0ccc] transition-colors flex items-center gap-2"
                                >
                                    <span className="material-icons text-xl">send</span>
                                    댓글 작성
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-6 rounded-[15px] text-center mb-8">
                            <p className="text-gray-600 mb-4">댓글을 작성하려면 로그인이 필요합니다.</p>
                            <Link
                                href="/login"
                                className="inline-block px-6 py-2 bg-[#980ffa] text-white rounded-full hover:bg-[#7d0ccc] transition-colors"
                            >
                                로그인하기
                            </Link>
                        </div>
                    )}

                    {/* 댓글 목록 */}
                    <div className="space-y-6">
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                className={`bg-gray-50 rounded-[15px] p-6 transition-all ${lastEditedCommentId === comment.id ? 'ring-2 ring-[#980ffa]' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                            {comment.profileImageUrl ? (
                                                <img
                                                    src={comment.profileImageUrl}
                                                    alt={`${comment.nickname}의 프로필 이미지`}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.onerror = null; // 추가 오류 이벤트 방지
                                                        target.style.display = 'none'; // 이미지 숨기기
                                                        target.parentElement!.innerHTML = `
                                                            <span class="material-icons text-[#980ffa]">account_circle</span>
                                                        `;
                                                    }}

                                                />
                                            ) : (
                                                <span className="material-icons text-[#980ffa]">account_circle</span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">{comment.nickname}</h4>
                                            <span className="text-sm text-gray-500">{formatTime(comment.creationTime)}</span>
                                        </div>
                                    </div>
                                    {/* 댓글 메뉴 버튼 */}
                                    {isLogin && (
                                        <div className="relative" ref={el => {
                                            if (el) {
                                                commentMenuRefs.current[comment.id] = el;
                                            }
                                        }}>
                                            <button
                                                className="p-2 rounded-full hover:bg-gray-200 transition-colors menu-button"
                                                onClick={(e) => toggleCommentMenu(e, comment.id)}
                                            >
                                                <span className="material-icons text-gray-600">more_horiz</span>
                                            </button>

                                            {showCommentMenu === comment.id && (
                                                <div className="absolute right-0 top-full mt-2 bg-white rounded-[15px] shadow-lg z-10 w-[160px] overflow-hidden border border-gray-100">
                                                    {isCurrentUserAdmin ? (
                                                        comment.isOwner ? (
                                                            <>
                                                                <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors text-blue-600 menu-item" onClick={() => startCommentEdit(comment.id, comment.content)}>
                                                                    <span className="material-icons text-blue-600 mr-3">edit</span> 수정하기
                                                                </button>
                                                                <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors text-red-600 menu-item" onClick={() => handleAdminAction(comment.id, 'comment', 'inactive')}>
                                                                    <span className="material-icons text-red-600 mr-3">delete</span> 삭제하기
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors text-orange-600 menu-item" onClick={() => handleAdminAction(comment.id, 'comment', 'inactive')}>
                                                                    <span className="material-icons text-orange-600 mr-3">visibility_off</span> 비활성화
                                                                </button>
                                                                <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors text-purple-600 menu-item" onClick={() => handleAdminAction(comment.id, 'comment', 'pending')}>
                                                                    <span className="material-icons text-purple-600 mr-3">block</span> 정지
                                                                </button>
                                                            </>
                                                        )
                                                    ) : comment.isOwner ? (
                                                        <>
                                                            <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors text-blue-600 menu-item" onClick={() => startCommentEdit(comment.id, comment.content)}>
                                                                <span className="material-icons text-blue-600 mr-3">edit</span> 수정하기
                                                            </button>
                                                            <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors text-red-600 menu-item" onClick={() => handleCommentDelete(comment.id)}>
                                                                <span className="material-icons text-red-600 mr-3">delete</span> 삭제하기
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors menu-item" onClick={() => handleCommentReport(comment.id)} disabled={comment.isReported}>
                                                            <span className={`material-icons mr-3 ${comment.isReported ? 'text-gray-400' : 'text-gray-600'}`}>flag</span>
                                                            <span className={comment.isReported ? 'text-gray-400' : 'text-gray-600'}>{comment.isReported ? '신고 완료' : '신고하기'}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 댓글 내용 */}
                                {editingCommentId === comment.id ? (
                                    <div className="mt-2">
                                        <textarea
                                            ref={editCommentRef}
                                            className="w-full p-4 bg-white border border-gray-200 rounded-[15px] focus:outline-none focus:ring-2 focus:ring-[#980ffa] focus:border-transparent resize-none transition-all min-h-[100px]"
                                            value={editCommentContent}
                                            onChange={(e) => setEditCommentContent(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-2 mt-3">
                                            <button
                                                onClick={cancelCommentEdit}
                                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                취소
                                            </button>
                                            <button
                                                onClick={submitCommentEdit}
                                                className="px-4 py-2 bg-[#980ffa] text-white rounded-full hover:bg-[#7d0ccc] transition-colors"
                                            >
                                                수정 완료
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-gray-800 break-words">{comment.content}</p>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleCommentLike(comment.id)}
                                                disabled={commentLikingId === comment.id}
                                                className={`flex items-center gap-1.5 group transition-all ${comment.isLiked ? 'text-[#9C50D4]' : 'text-gray-500 hover:text-[#9C50D4]'
                                                    }`}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className={`h-5 w-5 group-hover:scale-110 transition-transform ${commentLikingId === comment.id ? 'animate-pulse' : ''
                                                        }`}
                                                    fill={comment.isLiked ? "currentColor" : "none"}
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                    />
                                                </svg>
                                                <span className="text-sm">{comment.likeCount || 0}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* 댓글이 없을 때 */}
                    {comments.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">아직 댓글이 없습니다.</p>
                            <p className="text-gray-500 mt-2">첫 댓글을 작성해보세요!</p>
                        </div>
                    )}
                </div>

                {/* 목록으로 돌아가기 버튼 */}
                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => {
                            if (isNoticePost(post)) {
                                const searchParams = new URLSearchParams(window.location.search);
                                const currentAcademyCode = post.academyCode || academyCode || searchParams.get('academyCode');
                                const noticeUrl = currentAcademyCode
                                    ? `/post/notice?academyCode=${currentAcademyCode}&type=notice`
                                    : '/post/notice?type=notice';
                                router.push(noticeUrl);
                            } else {
                                router.push('/post');
                            }
                        }}
                        className="px-6 py-3 rounded-[15px] text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all flex items-center gap-2"
                    >
                        <span className="material-icons">arrow_back</span>
                        <span>목록으로 돌아가기</span>
                    </button>
                </div>
            </div>

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
    );
}