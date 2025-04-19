package com.golden_dobakhe.HakPle.security.jwt;

import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import com.golden_dobakhe.HakPle.global.Status;
import com.golden_dobakhe.HakPle.security.CustomUserDetails;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationProvider {

    private final JwtTokenizer jwtTokenizer;
    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;

    public Authentication getAuthentication(String token) {
        Claims claims;
        try {
            claims = jwtTokenizer.parseAccessToken(token);
        } catch (ExpiredJwtException e) {
            log.warn("🔐 만료된 토큰: {}", e.getMessage());
            throw new RuntimeException("토큰이 만료되었습니다", e);
        } catch (Exception e) {
            log.warn("🔐 토큰 파싱 실패: {}", e.getMessage());
            throw new RuntimeException("유효하지 않은 토큰입니다", e);
        }

        // 🔥 Redis 연결 실패 시 로그 찍힘
        try {
            if (redisTemplate.hasKey(token)) {
                log.warn("🚫 블랙리스트 토큰 사용: {}", token);
                throw new RuntimeException("로그아웃된 토큰입니다");
            }
        } catch (Exception e) {
            log.error("❌ Redis 연결 실패: {}", e.getMessage(), e);
            throw new RuntimeException("내부 서버 오류(Redis 연결 실패)", e);
        }

        Long userId = extractUserId(claims);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다"));

        if (user.getStatus() != Status.ACTIVE) {
            log.warn("🚫 비활성 사용자 접근 시도 (userId: {})", userId);
            throw new RuntimeException("비활성화된 계정입니다");
        }

        List<String> roleNames = (List<String>) claims.get("roles");
        Collection<GrantedAuthority> authorities = roleNames.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toList());

        User userForPrincipal = User.builder()
                .userName(claims.getSubject())
                .nickName(claims.get("nickname", String.class))
                .status(Status.valueOf(claims.get("status", String.class)))
                .password("N/A")
                .id(userId)
                .build();

        log.info("✅ 인증 완료: userId = {}", userId);
        return new JwtAuthenticationToken(authorities, new CustomUserDetails(userForPrincipal), null);
    }

    private Long extractUserId(Claims claims) {
        Object userIdRaw = claims.get("userId");
        if (userIdRaw instanceof Integer) return ((Integer) userIdRaw).longValue();
        if (userIdRaw instanceof Long) return (Long) userIdRaw;
        if (userIdRaw instanceof String) return Long.parseLong((String) userIdRaw);
        throw new IllegalStateException("JWT에 userId 없음");
    }

}
