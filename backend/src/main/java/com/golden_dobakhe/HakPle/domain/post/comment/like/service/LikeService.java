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
import java.util.concurrent.TimeUnit;

import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;



import lombok.RequiredArgsConstructor;
import org.redisson.api.RedissonClient;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class LikeService {

    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Integer> redisTemplate;
    private final RedissonClient redissonClient;

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
        String lockKey = "lock:comment:like:" + commentId; // 락 키 설정
        RLock lock = redissonClient.getLock(lockKey); // 락 객체 생성

        try {
            boolean available = lock.tryLock(5, 3, TimeUnit.SECONDS); // 락 시도 (최대 5초 대기, 3초 유지)
            if (!available) {
                throw new IllegalStateException("다른 사용자가 좋아요 처리 중입니다.");
            }

            // ========== 여기가 핵심 작업 ==========
            Comment comment = commentRepository.findById(commentId)
                    .orElseThrow(() -> new CommentException(CommentResult.COMMENT_NOT_FOUND));

            Optional<CommentLike> existingLike = likeRepository.findByCommentIdAndUserId(commentId, user.getId());
            String key = "comment:like:count:" + commentId;

            if (existingLike.isPresent()) {
                // 이미 좋아요 했으면 → 취소
                likeRepository.delete(existingLike.get());
                redisTemplate.opsForValue().decrement(key);
            } else {
                if (!likeRepository.existsByCommentIdAndUserId(commentId, user.getId())) {
                    redisTemplate.opsForValue().increment(key);

                    CommentLike commentLike = CommentLike.builder()
                            .comment(comment)
                            .user(user)
                            .build();
                    likeRepository.save(commentLike);
                } else {
                    log.warn("중복 좋아요 감지됨: commentId={}, userId={}", commentId, user.getId());
                }
            }

            return CommentResult.SUCCESS;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); // 예외 처리
            throw new RuntimeException("락 대기 중 인터럽트 발생", e);
        } finally {
            lock.unlock(); // 락 해제
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
        String key = "comment:like:count:" + commentId;
        Integer count = redisTemplate.opsForValue().get(key);

        if (count != null) return count;

        // fallback: DB에서 읽기
        return commentRepository.findById(commentId)
                .map(Comment::getLikeCount)
                .orElse(0);
    }
}
