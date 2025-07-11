package com.golden_dobakhe.HakPle.domain.post.comment.like.repository;

import com.golden_dobakhe.HakPle.domain.post.comment.like.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<CommentLike,Long> {
    Optional<CommentLike> findByCommentIdAndUserId(Long commentId, Long userId);
    
    // 여러 댓글 ID와 사용자 ID로 좋아요 엔티티 목록 조회
    List<CommentLike> findByCommentIdInAndUserId(List<Long> commentIds, Long userId);

    boolean existsByCommentIdAndUserId(Long commentId, Long id);
}
