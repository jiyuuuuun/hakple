package com.golden_dobakhe.HakPle.global.scheduler;

import com.golden_dobakhe.HakPle.domain.post.comment.comment.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class LikeSyncScheduler {

    private final RedisTemplate<String, Integer> redisTemplate;
    private final CommentRepository commentRepository;

    @Scheduled(fixedRate = 300_000) // 5분
    public void syncLikeCounts() {
        Set<String> keys = redisTemplate.keys("comment:like:count:*");

        for (String key : keys) {
            Long commentId = Long.valueOf(key.replace("comment:like:count:", ""));
            Integer count = redisTemplate.opsForValue().get(key);

            commentRepository.findById(commentId).ifPresent(comment -> {
                comment.setLikeCount(count);
                commentRepository.save(comment);
            });
        }
    }
}