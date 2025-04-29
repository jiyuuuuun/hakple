import { fetchApi } from '@/utils/api';
// utils/likeHandler.js

export async function handleLike({
    post,
    isLiked,
    isLogin,
    setIsLiked,
    setPost,
    setIsLiking,
}) {
    if (!post) return;

    if (!isLogin) {
        alert('로그인이 필요한 기능입니다.');
        return;
    }

    setIsLiking(true);
    try {
        const response = await fetchApi(`/api/v1/posts/${post.id}/likes`, {
            method: 'POST',
        });

        if (!response.ok) {
            console.log('좋아요 응답 상태코드:', response.status);

            throw new Error('좋아요 처리 실패');
        }

        // 서버가 빈 응답을 보내는 경우를 처리
        let data;
        try {
            data = await response.json();
        } catch (e) {
            // JSON 파싱 실패시 현재 상태의 반대값 사용
            const newLiked = !isLiked;
            setIsLiked(newLiked);
            setPost(prev => ({
                ...prev,
                isLiked: newLiked,
                likeCount: newLiked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1),
            }));
            return;
        }

        // 서버에서 상태값을 제공하는 경우
        if (data && (data.isLiked !== undefined || data.likeCount !== undefined)) {
            setIsLiked(data.isLiked ?? !isLiked);
            setPost(prev => ({
                ...prev,
                isLiked: data.isLiked ?? !isLiked,
                likeCount: data.likeCount ?? (data.isLiked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1)),
            }));
        } else {
            // 서버 응답에 상태값이 없는 경우 현재 상태의 반대값 사용
            const newLiked = !isLiked;
            setIsLiked(newLiked);
            setPost(prev => ({
                ...prev,
                isLiked: newLiked,
                likeCount: newLiked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1),
            }));
        }
    } catch (e) {
        console.error('좋아요 처리 중 오류:', e);
    } finally {
        setIsLiking(false);
    }
}
