package com.golden_dobakhe.HakPle.security.jwt;

import com.golden_dobakhe.HakPle.domain.user.user.entity.Role;
import com.golden_dobakhe.HakPle.global.Status;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Set;

@Component
@Slf4j
public class JwtTokenizer {
    private final byte[] accessSecret;
    private final byte[] refreshSecret;

    public static Long ACCESS_TOKEN_EXPIRE_COUNT= 10 * 1000L;//10 * 1000L; 1000 * 60 * 60 * 24L //24시간
    public static Long REFRESH_TOKEN_EXPIRE_COUNT=7*24*60*60*1000L; //이건 일주일

    //@Value로 application.yml에 있는 환경변수값을 불러와서 생성
    //이따가 secret에서 가져오시오
    public JwtTokenizer(@Value("${jwt.secretKey}") String accessSecret, @Value("${jwt.refreshKey}") String refreshSecret) {
        this.accessSecret = accessSecret.getBytes(StandardCharsets.UTF_8);
        this.refreshSecret = refreshSecret.getBytes(StandardCharsets.UTF_8);
    }

    //토큰 만들기
    private String createToken(Long id, String userName, String nickName, String phoneNum, Status status
    , Long expire, byte[] secretKey, Set<Role> roles, String academyId) {

        //토큰에 넣을 요소를 만들기
        Claims claims = Jwts.claims().setSubject(userName);
        claims.put("nickName", nickName);
        claims.put("status", status);
        claims.put("userId",id); //userId 추가
        claims.put("roles",roles);
        claims.put("academyId", academyId); // academyId 추가

        //토큰에 그 요소들을 넣기
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(new Date().getTime()+expire))
                .signWith(getSignKey(secretKey))
                .compact();
    }

    //access, refresh토큰 각각만들기
    public String createAccessToken(Long id, String userName, String nickName, String phoneNum, Status status, Set<Role> roles, String academyId) {
        return createToken(id, userName, nickName, phoneNum, status, ACCESS_TOKEN_EXPIRE_COUNT, accessSecret, roles, academyId);
    }

    public String createRefreshToken(Long id, String userName, String nickName, String phoneNum, Status status, Set<Role> roles, String academyId) {
        return createToken(id, userName, nickName, phoneNum, status, REFRESH_TOKEN_EXPIRE_COUNT, refreshSecret, roles, academyId);
    }

    // 이전 버전 호환성을 위한 메서드
//    public String createAccessToken(Long id, String userName, String nickName, String phoneNum, Status status, Set<Role> roles) {
//        return createToken(id, userName, nickName, phoneNum, status, ACCESS_TOKEN_EXPIRE_COUNT, accessSecret, roles, null);
//    }
//
//    public String createRefreshToken(Long id, String userName, String nickName, String phoneNum, Status status, Set<Role> roles) {
//        return createToken(id, userName, nickName, phoneNum, status, REFRESH_TOKEN_EXPIRE_COUNT, refreshSecret, roles, null);
//    }

    //jwt인증에 필요한 서명만들기
    private static Key getSignKey(byte[] secretKey) {
        return Keys.hmacShaKeyFor(secretKey);
    }

    //여기서 파싱과 검증이 동시에 이루어진다
    public Claims parseAccessToken(String token) {
        return Jwts.parserBuilder()
                .setAllowedClockSkewSeconds(7)
                .setSigningKey(getSignKey(accessSecret))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public Claims parseRefreshToken(String token) {
        return Jwts.parserBuilder()
                .setAllowedClockSkewSeconds(2)
                .setSigningKey(getSignKey(refreshSecret))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

//    //받은 토큰을 파싱
//    public Claims parseToken(String token, byte[] secretKey) {
//        return Jwts.parserBuilder()
//                .setSigningKey(getSignKey(secretKey))
//                .build()
//                .parseClaimsJws(token)
//                .getBody();
//
//    }

    public long getRemainingTime(String token) {
        Claims claims = parseAccessToken(token);
        Date expiration = claims.getExpiration();
        return expiration.getTime() - System.currentTimeMillis();
    }

}
