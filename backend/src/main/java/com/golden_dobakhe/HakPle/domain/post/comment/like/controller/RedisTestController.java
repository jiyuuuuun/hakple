package com.golden_dobakhe.HakPle.domain.post.comment.like.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class RedisTestController {

    @Autowired
    private RedisTemplate<String, Integer> redisTemplate;

    @DeleteMapping("/redis/comments/{commentId}/likes")
    public void deleteLikeCache(@PathVariable Long commentId) {
        String key = "comment:like:count:" + commentId;
        redisTemplate.delete(key);
    }
}

