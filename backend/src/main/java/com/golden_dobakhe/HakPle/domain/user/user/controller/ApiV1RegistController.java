package com.golden_dobakhe.HakPle.domain.user.user.controller;

import com.golden_dobakhe.HakPle.domain.user.user.WithdrawResult;
import com.golden_dobakhe.HakPle.domain.user.user.dto.DeleteUserRequestDto;
import com.golden_dobakhe.HakPle.domain.user.user.dto.UserRegistRequestDTO;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import com.golden_dobakhe.HakPle.domain.user.user.service.UserRegistService;
import com.golden_dobakhe.HakPle.security.CustomUserDetails;
import com.golden_dobakhe.HakPle.security.jwt.JwtTokenizer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
@Tag(name = "회원가입 API", description = "회원가입, 탈퇴, 로그아웃 API")
public class ApiV1RegistController {
    private final UserRegistService userRegistService;
    private final UserRepository userRepository;
    private final JwtTokenizer jwtTokenizer;
    private final RedisTemplate<String, String> redisTemplate;

    // 회원 가입
    @Operation(summary = "회원가입 api", description = "유저 정보를 입력하여 회원가입을 진행합니다.")
    @PostMapping("/userreg")
    public ResponseEntity<?> register(
            @Valid @RequestBody UserRegistRequestDTO userRegistRequestDTO,
            BindingResult bindingResult
    ) {
        // 형식 검사 실패 시
        if (bindingResult.hasErrors()) {
            String errorMessages = bindingResult.getFieldErrors().stream()
                    .map(e -> e.getField() + ": " + e.getDefaultMessage())
                    .collect(Collectors.joining(", "));
            return ResponseEntity.badRequest().body(errorMessages);
        }

        // 회원가입 실행 (중복은 프론트에서 미리 체크했음)
        userRegistService.register(userRegistRequestDTO);
        return ResponseEntity.ok("회원가입이 성공적으로 완료되었습니다.");
    }

    // 중복 확인
    @Operation(summary = "아이디 중복 확인", description = "아이디의 중복 여부를 확인합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "사용 가능"),
            @ApiResponse(responseCode = "409", description = "중복됨")
    })
    @GetMapping("/check-username")
    public ResponseEntity<Boolean> checkUserName(@RequestParam(name = "userName") String userName) {
        return ResponseEntity.ok(!userRepository.existsByUserName(userName));
    }

    // 중복 확인
    @Operation(summary = "휴대폰 번호 중복 확인", description = "휴대폰 번호 중복 여부를 확인합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "사용 가능"),
            @ApiResponse(responseCode = "409", description = "중복됨")
    })
    @GetMapping("/check-phonenum")
    public ResponseEntity<Boolean> checkPhoneNum(@RequestParam(name = "phoneNum") String phoneNum) {
        return ResponseEntity.ok(!userRepository.existsByPhoneNum(phoneNum));
    } //응답 True 전화번호 없음 False 이미 전화번호 있음


    // 탈퇴
    @Operation(summary = "회원 탈퇴", description = "비밀번호 확인 후 회원 비활성화 처리")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "회원 탈퇴 성공"),
            @ApiResponse(responseCode = "401", description = "비밀번호 불일치"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    @DeleteMapping("/withdraw")
    public ResponseEntity<String> withdrawUser(@RequestBody DeleteUserRequestDto dto,
                                               @AuthenticationPrincipal CustomUserDetails principal) {
        Long userId = principal.getUser().getId();
        WithdrawResult result = userRegistService.withdraw(userId, dto.getPassword());

        return switch (result) {
            case SUCCESS -> ResponseEntity.ok("회원 탈퇴 완료");
            case USER_NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("존재하지 않는 사용자입니다");
            case WRONG_PASSWORD -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("비밀번호가 일치하지 않습니다");
        };
    }

    // 로그아웃
    @Operation(summary = "로그아웃", description = "Token 제거합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "로그아웃 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@AuthenticationPrincipal CustomUserDetails principal,
                                         @RequestHeader("Authorization") String bearerToken) {
        String token = bearerToken.replace("Bearer ", "");
        Long userId = principal.getUser().getId();

        userRegistService.logout(token, userId);

        return ResponseEntity.ok("로그아웃 완료");
    }
}
