package com.golden_dobakhe.HakPle.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {
    @Bean
    public RedisTemplate<String, Integer> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Integer> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Key는 String
        template.setKeySerializer(new StringRedisSerializer());
        // Value는 JSON 직렬화 (int도 지원)
        Jackson2JsonRedisSerializer<Integer> serializer = new Jackson2JsonRedisSerializer<>(Integer.class);
        template.setValueSerializer(serializer);
        template.afterPropertiesSet();

        return template;
    }

}