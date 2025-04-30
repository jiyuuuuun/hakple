package com.golden_dobakhe.HakPle.security.controller;


import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.security.OAuth.CustomRequest;
// import com.golden_dobakhe.HakPle.security.OAuth.SecurityUser; // SecurityUser는 직접 사용하지 않으므로 주석 처리 또는 삭제 가능
import com.golden_dobakhe.HakPle.security.dto.MeDto;
import com.golden_dobakhe.HakPle.security.service.AuthService;
import com.golden_dobakhe.HakPle.domain.user.user.service.UserRegistService; // UserRegistService import 추가
import com.golden_dobakhe.HakPle.security.dto.LoginDto;
import com.golden_dobakhe.HakPle.security.dto.LoginResponseDto;
import com.golden_dobakhe.HakPle.security.jwt.JwtTokenizer;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.Cookie; // 주석 처리 해제
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession; // HttpSession import 추가
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication; // Authentication import 추가
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseCookie;

// import java.security.Principal; // Principal은 직접 사용하지 않으므로 주석 처리 또는 삭제 가능
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
@Slf4j
public class ApiV1AuthController {
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;
    private final CustomRequest customRequest;
    private final JwtTokenizer jwtTokenizer;
    private final UserRegistService userRegistService; // UserRegistService 주입

    //테스트용이라서 배포 전에 삭제할꺼임
    @GetMapping("/home")
    public ResponseEntity<String> home() {
        return ResponseEntity.ok("여기는 집");
    }

    //me api
    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        String cookie = customRequest.getCookieValue("accessToken");
        Claims claims = jwtTokenizer.parseAccessToken(cookie);
        
        Object userId = claims.get("userId");


        if (userId == null) {
            throw new IllegalStateException("JWT에 userId가 없습니다!");
        }

        User user = authService.findById(((Number) userId).longValue())
            .orElseThrow(() -> {
                return new IllegalStateException("사용자를 찾을 수 없습니다: " + userId);
            });

        // academyId 필드 추가
        MeDto meDto = new MeDto(
            user.getId(), 
            user.getNickName(), 
            user.getCreationTime(), 
            user.getModificationTime(),
            user.getAcademyId()  // academyId 필드 추가
        );
        
        return ResponseEntity.ok(meDto);
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDto req, HttpServletResponse response) {
        User user= authService.findByUserName(req.getUsername());
        //일단은 유저가 있는지 없는지 확인
        //없으면 나가리
        if (user == null)
            return ResponseEntity.status(404).body("님 없음");
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("비밀번호가 틀렸습니다.");
        }
        //있다면? 토큰 만들고
        String accessToken = authService.genAccessToken(user);
        String refreshToken = authService.genRefreshToken(user);

        //토큰을 저장하고
        authService.addRefreshToken(user, refreshToken);

        //만든걸 보내야지
        LoginResponseDto loginResponseDto = new LoginResponseDto(accessToken, refreshToken, user.getId(), user.getUserName());

        //만약 쿠키에도 저장하고 싶다면?
        Cookie accesTokenCookie = new Cookie("accessToken", accessToken);
        accesTokenCookie.setHttpOnly(true); //보안, 자바스크립트로는 안되고 http로만
        accesTokenCookie.setPath("/"); //쿠키 경로 지정, "/"는 모든 경로 "/아무개"는 특정 경로에만 쿠키가 전달된다
        //쿠키의 시간단위는 초단위 ,따라서 ms인 jwt단위에 1000을 나눠야한다
        accesTokenCookie.setMaxAge(Math.toIntExact(JwtTokenizer.ACCESS_TOKEN_EXPIRE_COUNT / 1000));


        //이는 refresh에도 적용시킨다
        Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(Math.toIntExact(JwtTokenizer.REFRESH_TOKEN_EXPIRE_COUNT/1000));


        //그리고 응답객체에 그 쿠키를 넣어준다
        response.addCookie(accesTokenCookie);
        response.addCookie(refreshTokenCookie);


        return ResponseEntity.ok(loginResponseDto);
    }

    //로그아웃 만들어야지
    @DeleteMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) { // HttpServletRequest 추가
        // 1. Access Token 가져오기 (쿠키에서)
        String accessToken = customRequest.getCookieValue("accessToken");

        if (accessToken != null && !accessToken.isEmpty()) {
            try {
                // 2. Access Token에서 사용자 ID 추출
                Claims claims = jwtTokenizer.parseAccessToken(accessToken);
                Long userId = ((Number) claims.get("userId")).longValue();

                // 3. 토큰 무효화 (Redis 블랙리스트 및 DB Refresh Token 삭제)
                userRegistService.logout(accessToken, userId);
                log.info("토큰 무효화 완료 (UserId: {})", userId);

            } catch (Exception e) {
                // 토큰 파싱 실패 또는 사용자 ID 추출 실패 등 예외 처리
                log.error("로그아웃 중 토큰 처리 오류: {}", e.getMessage());
                // 오류가 발생해도 쿠키 삭제 및 세션 무효화는 시도
            }
        } else {
            log.warn("로그아웃 요청 시 Access Token 쿠키 없음");
        }
        
        // 4. HTTP 세션 무효화
        HttpSession session = request.getSession(false); // false: 기존 세션 없으면 새로 만들지 않음
        if (session != null) {
            session.invalidate();
            log.info("HTTP 세션 무효화 완료");
        }

        // 5. 쿠키 삭제 (직접 ResponseCookie 생성 - 혹시 모르니 유지)
        ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", null)
                .path("/")
                .sameSite("Lax")
                .secure(true)
                .httpOnly(true)
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", accessTokenCookie.toString());

        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", null)
                .path("/")
                .sameSite("Lax")
                .secure(true)
                .httpOnly(true)
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", refreshTokenCookie.toString());
        
        log.info("accessToken/refreshToken 쿠키 삭제 헤더 설정 완료");

        return ResponseEntity.ok("로그아웃 완료");
    }

}
