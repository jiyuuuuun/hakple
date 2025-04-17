package com.golden_dobakhe.HakPle.domain.user.user.controller;

import com.golden_dobakhe.HakPle.domain.user.user.dto.ChangePasswordRequest;
import com.golden_dobakhe.HakPle.domain.user.user.dto.ResetPasswordRequest;
import com.golden_dobakhe.HakPle.domain.user.user.service.UserFindService;
import com.golden_dobakhe.HakPle.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/usernames")
@Tag(name = "아이디, 비밀번호 수정 API", description = "아이디 찾기, 비밀번호 찾기(변경, 재설정)")
public class ApiV1UserFindController {
    private final UserFindService userFindService;

    // 아이디 찾기
    @Operation(summary = "아이디 찾기", description = "닉네임, 전화번호로 사용자의 아이디를 찾습니다.")
    @GetMapping("/find-username")
    public ResponseEntity<String> findUserName(
            @RequestParam(name = "nickName") String nickName,
            @RequestParam(name = "phoneNum") String phoneNum) {
        try {
            String userName = userFindService.findUserNameByPhoneNum(nickName, phoneNum);
            return ResponseEntity.ok(userName);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    //비밀번호 변경
    @Operation(summary = "비밀번호 변경", description = "로그인된 사용자가 현재 비밀번호를 확인하고 새 비밀번호로 변경합니다.")
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody @Valid ChangePasswordRequest request
    ) {
        userFindService.changePasswordWithOldPassword(
                principal.getUser().getId(),
                request.getCurrentPassword(),
                request.getNewPassword(),
                request.getNewPasswordConfirm()
        );
        return ResponseEntity.ok("비밀번호가 변경되었습니다.");
    }

    // 비밀번호 재설정
    @Operation(summary = "비밀번호 재설정", description = "비밀번호 찾기 이후 인증 완료된 사용자가 새 비밀번호를 설정합니다.")
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Parameter(description = "사용자 ID", example = "1")
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody @Valid ResetPasswordRequest request
    ) {
        userFindService.resetPassword(
                principal.getUser().getId(),
                request.getNewPassword(),
                request.getNewPasswordConfirm()
        );
        return ResponseEntity.ok("비밀번호가 재설정되었습니다.");
    }
}