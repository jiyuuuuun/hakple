package com.golden_dobakhe.HakPle.security.jwt;

import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.global.Status;
import com.golden_dobakhe.HakPle.security.CustomUserDetails;
import com.golden_dobakhe.HakPle.security.service.AuthService;
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
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationProvider {

    private final JwtTokenizer jwtTokenizer;
    private final AuthService authService;
    private final RedisTemplate<String, String> redisTemplate;

    public User getUserFromClaims(Claims claims) {
        Long userId = extractUserId(claims);
        User user = authService.findByIdWithRoles(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다"));

        if (user.getStatus() != Status.ACTIVE) {
            throw new RuntimeException("비활성화된 계정입니다");
        }

        return user;
    }

    public String genNewAccessToken(String refreshToken) {
        Claims claims;
        try {
            //여기서 리프래시 토큰을 파싱과 동시에 유효성을 검증한다
            claims = jwtTokenizer.parseRefreshToken(refreshToken);
        } catch (Exception e) {
            throw new RuntimeException("유효하지 않은 토큰입니다", e);
        }

        User user = getUserFromClaims(claims);

        return authService.genAccessToken(user);
    }


    public Authentication getAuthentication(String token) {
        Claims claims;
        try {
            claims = jwtTokenizer.parseAccessToken(token);
        } catch (ExpiredJwtException e) {
            throw new RuntimeException("토큰이 만료되었습니다", e);
        } catch (Exception e) {
            throw new RuntimeException("유효하지 않은 토큰입니다", e);
        }

        try {
            Boolean isBlacklisted = redisTemplate.hasKey(token);
            if (Boolean.TRUE.equals(isBlacklisted)) { // Redis에 토큰 키가 존재하면 블랙리스트된 토큰
                log.warn("🚫 블랙리스트 토큰 사용: {}", token);
                throw new RuntimeException("로그아웃된 토큰입니다");
            }
        } catch (Exception e) {
            // Redis 연결 실패는 심각한 문제일 수 있으므로 로깅하고, 일단 인증은 진행하지 않음 (혹은 정책에 따라 다르게 처리)
            log.error("❌ Redis 연결 실패 또는 확인 중 오류: {}", e.getMessage(), e);
            throw new RuntimeException("인증 서버 오류 (Redis 확인 실패)", e);
        }

//        Long userId = extractUserId(claims);
//        User user = userRepository.findByIdWithRoles(userId)
//                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다"));
//
//        if (user.getStatus() != Status.ACTIVE) {
//            log.warn("🚫 비활성 사용자 접근 시도 (userId: {})", userId);
//            throw new RuntimeException("비활성화된 계정입니다");
//        }
        User user = getUserFromClaims(claims);

        // academyId가 토큰에 있을 경우 사용자 정보에 설정
        String academyId = (String) claims.get("academyId");
        if (academyId != null && !academyId.isEmpty()) {
            user.setAcademyId(academyId);
        }

        // ✅ 여기서 DB에서 불러온 user의 roles 사용
        Collection<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                .collect(Collectors.toList());


        return new JwtAuthenticationToken(authorities, new CustomUserDetails(user), null);
    }

    private Long extractUserId(Claims claims) {
        Object userIdRaw = claims.get("userId");
        if (userIdRaw instanceof Integer) return ((Integer) userIdRaw).longValue();
        if (userIdRaw instanceof Long) return (Long) userIdRaw;
        if (userIdRaw instanceof String) return Long.parseLong((String) userIdRaw);
        throw new IllegalStateException("JWT에 userId 없음");
    }

}
