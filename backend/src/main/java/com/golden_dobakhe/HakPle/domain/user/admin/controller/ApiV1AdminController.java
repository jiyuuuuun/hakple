package com.golden_dobakhe.HakPle.domain.user.admin.controller;


import com.golden_dobakhe.HakPle.domain.post.post.dto.TotalBoardResponse;
import com.golden_dobakhe.HakPle.domain.user.admin.dto.AcademyRequestDto;
import com.golden_dobakhe.HakPle.domain.user.admin.dto.AcademyWithUserCountDto;
import com.golden_dobakhe.HakPle.domain.user.admin.dto.AdminLoginDto;
import com.golden_dobakhe.HakPle.domain.user.admin.dto.AdminRegisterDto;
import com.golden_dobakhe.HakPle.domain.user.admin.service.AdminService;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Role;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.global.Status;
import com.golden_dobakhe.HakPle.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin API", description = "관리자 관련 API")
public class ApiV1AdminController {

    private final AdminService adminService;

    @Operation(summary = "관리자 회원가입", description = "관리자 계정을 등록합니다.")
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody AdminRegisterDto dto) {
        String result = adminService.registerAdmin(dto);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "관리자 로그인", description = "관리자 로그인 후 JWT 토큰을 발급받습니다.")
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody AdminLoginDto dto) {
        Map<String, String> tokens = adminService.loginAdmin(dto);
        return ResponseEntity.ok(tokens);
    }

    @Operation(summary = "관리자 전용 대시보드", description = "ADMIN 권한이 있어야 접근 가능합니다.")
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> dashboard() {
        return ResponseEntity.ok("관리자만 접근 가능한 대시보드입니다.");
    }

    @PostMapping("/academies/register")
    @Operation(summary = "학원 등록", description = "새로운 학원을 등록하고 학원 코드를 반환합니다.")
    public ResponseEntity<String> createAcademy(@RequestBody @Valid AcademyRequestDto requestDto) {
        String academyCode = adminService.createAcademy(requestDto);
        return ResponseEntity.ok(academyCode);
    }

    @PostMapping("/boards/{id}/pending")
    @Operation(summary = "게시글 상태를 PENDING으로 변경", description = "신고된 게시글을 PENDING 상태로 변경합니다.")
    public ResponseEntity<Void> setBoardPending(@PathVariable(name = "id") Long id) {
        adminService.setBoardPending(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/comments/{id}/pending")
    @Operation(summary = "댓글 상태를 PENDING으로 변경", description = "신고된 댓글을 PENDING 상태로 변경합니다.")
    public ResponseEntity<Void> setCommentPending(@PathVariable(name = "id")  Long id) {
        adminService.setCommentPending(id);
        return ResponseEntity.ok().build();
    }
    @GetMapping("/check")
    @Operation(summary = "관리자인지 확인",description = "사용자가 관리자 권한을 가지고 있는지 확인합니다")
    public ResponseEntity<?> checkAdmin(@AuthenticationPrincipal CustomUserDetails principal) {

        boolean isAdmin = principal.getUser().getRoles()
                .stream()
                .anyMatch(role -> role.equals(Role.ADMIN));

        log.info(principal.getUser().getRoles().toString());

        return ResponseEntity.ok(isAdmin);
    }

    @Operation(summary = "학원 목록 조회 (유저 수 포함)", description = "모든 학원의 기본 정보와 소속 유저 수를 반환합니다.")
    @ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", schema = @Schema(implementation = AcademyWithUserCountDto.class)))
    @GetMapping("/academies")
    public ResponseEntity<List<AcademyWithUserCountDto>> getAcademiesWithUserCount() {
        List<AcademyWithUserCountDto> result = adminService.getAcademyListWithUserCounts();
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "관리자 권한 유저 목록 조회", description = "권한이 ADMIN인 유저만 조회합니다.")
    @GetMapping("/admins")
    public ResponseEntity<List<User>> getAdminUsers() {
        List<User> adminUsers = adminService.getAdminUsers();
        return ResponseEntity.ok(adminUsers);
    }

    @GetMapping("/boards")
    @Operation(summary = "게시글 전체 조회", description = "상태, 학원코드 없이 전체 게시글 리스트 조회 가능")
    public ResponseEntity<Page<TotalBoardResponse>> getBoards(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name="size",defaultValue = "10") int size,
            @RequestParam(name = "status", required = false) Status status,
            @RequestParam(name = "academyCode", required = false) String academyCode,
            @RequestParam(name = "sortBy" , defaultValue = "creationTime") String sortBy,
            @RequestParam(name = "direction", defaultValue = "desc") String direction) {
        Pageable pageable = PageRequest.of(page - 1, size,
                direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending());

        Page<TotalBoardResponse> result = adminService.getBoardsByFilterNullable(status, academyCode, pageable);
        return ResponseEntity.ok(result);
    }




}


