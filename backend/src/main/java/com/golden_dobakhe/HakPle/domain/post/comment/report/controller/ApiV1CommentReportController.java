package com.golden_dobakhe.HakPle.domain.post.comment.report.controller;

import com.golden_dobakhe.HakPle.domain.post.comment.report.service.CommentReportService;

import com.golden_dobakhe.HakPle.security.CustomUserDetails;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/comments/reports")
@Tag(name = "CommentReport Controller", description = "댓글 신고를 처리하는 컨트롤러")
@RequiredArgsConstructor
public class ApiV1CommentReportController {
    public final CommentReportService commentReportService;


    @PostMapping("/{commentId}")
    public ResponseEntity<?> reportComment(
            @PathVariable(name = "commentId") Long commentId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        commentReportService.reportComment(commentId, principal.getUser().getId());
        return ResponseEntity.ok("댓글이 신고되었습니다.");
    }
    
    // 댓글 신고 상태 확인 API 추가
    @GetMapping("/{commentId}/status")
    public ResponseEntity<Map<String, Boolean>> checkCommentReportStatus(
            @PathVariable(name = "commentId") Long commentId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        boolean isReported = commentReportService.isReportedByUser(commentId, principal.getUser().getId());
        Map<String, Boolean> response = new HashMap<>();
        response.put("isReported", isReported);
        return ResponseEntity.ok(response);
    }
    
    // 댓글 작성자 확인 API 추가
    @GetMapping("/{commentId}/is-owner")
    public ResponseEntity<Map<String, Boolean>> checkCommentOwner(
            @PathVariable(name = "commentId") Long commentId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        boolean isOwner = commentReportService.isCommentOwner(commentId, principal.getUser().getId());
        Map<String, Boolean> response = new HashMap<>();
        response.put("isOwner", isOwner);
        return ResponseEntity.ok(response);
    }
}
