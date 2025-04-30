package com.golden_dobakhe.HakPle.domain.post.comment.like.service;

import com.golden_dobakhe.HakPle.domain.post.comment.CommentResult;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.Comment;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.repository.CommentRepository;
import com.golden_dobakhe.HakPle.domain.post.comment.exception.CommentException;
import com.golden_dobakhe.HakPle.domain.post.comment.like.dto.LikeStatusResponseDto;
import com.golden_dobakhe.HakPle.domain.post.comment.like.entity.CommentLike;
import com.golden_dobakhe.HakPle.domain.post.comment.like.repository.LikeRepository;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class LikeService {

    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final UserRepository userRepository;

    //좋아요 +
    @Transactional
    public CommentResult likeComment(Long commentId, User user) {

        Comment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null) {
            throw new CommentException(CommentResult.COMMENT_NOT_FOUND);
        }

        Optional<CommentLike> existingLike = likeRepository.findByCommentIdAndUserId(commentId, user.getId());
        if (existingLike.isPresent()) { //이미 같은 댓글에 좋아요를 눌렀으면
            throw new CommentException(CommentResult.ALREADY_LIKED);
        }
        comment.setLikeCount(comment.getLikeCount() + 1);
        CommentLike commentLike = CommentLike.builder()
                .comment(comment)
                .user(user)
                .build();
        likeRepository.save(commentLike);
        return CommentResult.SUCCESS;
    }

    //좋아요 -
    @Transactional
    public CommentResult unlikeComment(Long commentId, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentException(CommentResult.COMMENT_NOT_FOUND));

        // ✅ 이미 좋아요 했는지 체크
        CommentLike like = likeRepository.findByCommentIdAndUserId(commentId, user.getId())
                .orElseThrow(() -> new CommentException(CommentResult.NOT_LIKED_YET));

        // ✅ 좋아요 취소 (delete)
        likeRepository.delete(like);
        comment.setLikeCount(comment.getLikeCount() - 1);
        return CommentResult.SUCCESS;
    }

    //댓글 좋아요 토글 - 이미 좋아요 했으면 취소하고, 안했으면 추가
    @Transactional
    public CommentResult toggleCommentLike(Long commentId, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentException(CommentResult.COMMENT_NOT_FOUND));

        // 이미 좋아요 했는지 확인
        Optional<CommentLike> existingLike = likeRepository.findByCommentIdAndUserId(commentId, user.getId());

        if (existingLike.isPresent()) {
            // 이미 좋아요 한 경우: 좋아요 취소
            likeRepository.delete(existingLike.get());
            comment.setLikeCount(Math.max(0, comment.getLikeCount() - 1)); // 음수 방지
            return CommentResult.SUCCESS;
        } else {
            // 아직 좋아요 안 한 경우: 좋아요 추가
            comment.setLikeCount(comment.getLikeCount() + 1);
            CommentLike commentLike = CommentLike.builder()
                    .comment(comment)
                    .user(user)
                    .build();
            likeRepository.save(commentLike);
            return CommentResult.SUCCESS;
        }
    }

    // 사용자가 댓글에 좋아요 했는지 확인
    public LikeStatusResponseDto isLiked(Long commentId, User user) {
        // 댓글 존재 여부 확인
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentException(CommentResult.COMMENT_NOT_FOUND));

        // 좋아요 상태 확인
        boolean isLiked = likeRepository.findByCommentIdAndUserId(commentId, user.getId()).isPresent();

        return new LikeStatusResponseDto(isLiked);
    }

    //댓글 당 좋아요 수
    public int likeCount(Long commentId) {
        Comment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null) {
            throw new CommentException(CommentResult.COMMENT_NOT_FOUND);
        }
        return comment.getLikeCount();
    }
}
