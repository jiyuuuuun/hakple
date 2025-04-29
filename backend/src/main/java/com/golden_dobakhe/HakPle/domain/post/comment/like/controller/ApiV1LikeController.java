package com.golden_dobakhe.HakPle.domain.post.comment.like.controller;

import com.golden_dobakhe.HakPle.domain.post.comment.CommentResult;
import com.golden_dobakhe.HakPle.domain.post.comment.like.dto.LikeStatusResponseDto;
import com.golden_dobakhe.HakPle.domain.post.comment.like.service.LikeService;


import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.security.CustomUserDetails;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/likes")
@Tag(name = "댓글 좋아요 API", description = "댓글 좋아요 관련 기능 제공")
public class ApiV1LikeController {

    private final LikeService likeService;

    @Operation(summary = "댓글 좋아요 등록", description = "로그인한 사용자가 특정 댓글에 좋아요를 등록합니다.")
    @ApiResponse(responseCode = "201", description = "좋아요 등록 성공")
    @PostMapping("/comments/{commentId}")
    public ResponseEntity<CommentResult> likeComment(
            @Parameter(description = "좋아요를 등록할 댓글 ID", example = "1")
            @PathVariable(name ="commentId") Long commentId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        User user = principal.getUser();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(likeService.likeComment(commentId, user));
    }

    @Operation(summary = "댓글 좋아요 토글", description = "로그인한 사용자가 특정 댓글의 좋아요를 토글합니다. 이미 좋아요를 눌렀으면 취소하고, 아니면 추가합니다.")
    @ApiResponse(responseCode = "200", description = "좋아요 토글 성공")
    @PostMapping("/comments/{commentId}/toggle")
    public ResponseEntity<CommentResult> toggleCommentLike(
            @Parameter(description = "좋아요를 토글할 댓글 ID", example = "1")
            @PathVariable(name ="commentId") Long commentId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        User user = principal.getUser();
        return ResponseEntity.ok(likeService.toggleCommentLike(commentId, user));
    }

    @Operation(summary = "댓글 좋아요 상태 확인", description = "로그인한 사용자가 특정 댓글에 좋아요를 눌렀는지 확인합니다.")
    @ApiResponse(responseCode = "200", description = "좋아요 상태 확인 성공")
    @GetMapping("/comments/{commentId}/status")
    public ResponseEntity<LikeStatusResponseDto> getLikeStatus(
            @Parameter(description = "상태를 확인할 댓글 ID", example = "1")
            @PathVariable(name = "commentId") Long commentId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        User user = principal.getUser();
        return ResponseEntity.ok(likeService.isLiked(commentId, user));
    }

    @Operation(summary = "댓글 좋아요 수 조회", description = "특정 댓글의 좋아요 수를 조회합니다.")
    @ApiResponse(responseCode = "200", description = "좋아요 수 조회 성공")
    @GetMapping("/comments/{commentId}/count")
    public ResponseEntity<Integer> getLikeCount(
            @Parameter(description = "댓글 ID", example = "1")
            @PathVariable(name ="commentId") Long commentId
    ) {
        return ResponseEntity.ok(likeService.likeCount(commentId));
    }


    @DeleteMapping("/comments/{commentId}")
    @Operation(summary = "댓글 좋아요 취소", description = "이미 좋아요 누른 댓글만 취소 가능")
    public ResponseEntity<CommentResult> unlikeComment(
            @PathVariable(name ="commentId") Long commentId,
            @AuthenticationPrincipal CustomUserDetails principal

    ) {
        User user = principal.getUser();
        CommentResult result = likeService.unlikeComment(commentId, user);
        return ResponseEntity.ok(result);
    }

}
