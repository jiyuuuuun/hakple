package com.golden_dobakhe.HakPle.domain.post.comment.comment.controller;

import com.golden_dobakhe.HakPle.domain.post.comment.CommentResult;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.dto.CommentRequestDto;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.dto.CommentResponseDto;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.Comment;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.service.CommentService;
import com.golden_dobakhe.HakPle.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import com.golden_dobakhe.HakPle.domain.post.dto.AdminStatusChangeRequestDto;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/comments")
@Tag(name = "Comment Controller", description = "댓글 CRUD를 처리하는 컨트롤러")
public class ApiV1CommentController {

    private final CommentService commentService;

    @Operation(summary = "게시글별 댓글 목록 조회", description = "특정 게시글의 댓글 목록을 조회합니다. 로그인한 경우 좋아요 상태도 포함됩니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "댓글 목록 조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "404", description = "게시글을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @GetMapping("/by-post/{boardId}")
    public ResponseEntity<List<CommentResponseDto>> getCommentsByBoardId(
            @PathVariable(name = "boardId") Long boardId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        // 로그인한 사용자인 경우 좋아요 상태를 포함하여 조회
        if (principal != null) {
            Long userId = principal.getUser().getId();
            List<CommentResponseDto> comments = commentService.getCommentsByBoardId(boardId, userId);
            return ResponseEntity.ok(comments);
        } else {
            // 로그인하지 않은 경우 기본 조회
            List<CommentResponseDto> comments = commentService.getCommentsByBoardId(boardId);
            return ResponseEntity.ok(comments);
        }
    }

    @Operation(summary = "댓글 작성", description = "새로운 댓글을 작성합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "댓글 저장 완료"),
            @ApiResponse(responseCode = "400", description = "유저/게시글 없음 또는 댓글 내용 비어 있음"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @PostMapping
    public ResponseEntity<?> postComment(@RequestBody CommentRequestDto commentRequestDto,
                                         @AuthenticationPrincipal CustomUserDetails principal) {
        Comment comment = commentService.commentSave(commentRequestDto,principal.getUser().getId());

        if (comment != null) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body( "댓글 저장 완료");
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("댓글 저장 실패");
    }

    @Operation(summary = "댓글 수정", description = "기존 댓글을 수정합니다. boardId 요청 필요X")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "댓글 수정 완료"),
            @ApiResponse(responseCode = "400", description = "유저 없음, 댓글 없음, 내용 비어 있음"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @PostMapping("/update")
    public ResponseEntity<String> updateComment(@RequestBody CommentRequestDto commentRequestDto,
                                                @AuthenticationPrincipal CustomUserDetails principal) {
        CommentResult result = commentService.commentUpdate(commentRequestDto,principal.getUser().getId());

        switch (result) {
            case USER_NOT_FOUND:
                return ResponseEntity.badRequest().body("댓글 수정 실패 : 사용자를 찾을 수 없습니다");
            case COMMENT_NOT_FOUND:
                return ResponseEntity.badRequest().body("댓글 수정 실패 : 없는 댓글 입니다");
            case EMPTY:
                return ResponseEntity.badRequest().body("댓글 수정 실패 : Comment Empty 입니다");
            case UNAUTHORIZED:
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("댓글 수정 실패 : 권한이 없습니다");
            case SUCCESS:
                return ResponseEntity.ok("댓글 수정 완료");
            default:
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("댓글 수정 실패 : 서버 오류");
        }
    }

    @Operation(summary = "댓글 삭제 (사용자)", description = "자신이 작성한 댓글을 삭제 상태(INACTIVE)로 변경합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "댓글 삭제 완료"),
            @ApiResponse(responseCode = "400", description = "유저 또는 댓글 없음"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @DeleteMapping("/{commentId}")
    public ResponseEntity<String> deleteComment(@PathVariable(name = "commentId") Long commentId,
                                                @AuthenticationPrincipal CustomUserDetails principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        CommentResult result = commentService.commentDelete(commentId, principal.getUser().getId());

        switch (result) {
            case USER_NOT_FOUND:
                return ResponseEntity.badRequest().body("댓글 삭제 실패 : 사용자를 찾을 수 없습니다");
            case COMMENT_NOT_FOUND:
                return ResponseEntity.badRequest().body("댓글 삭제 실패 : 없는 댓글 입니다");
            case UNAUTHORIZED:
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("댓글 삭제 실패 : 권한이 없습니다");
            case SUCCESS:
                return ResponseEntity.ok("댓글 삭제 완료");
            default:
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("댓글 삭제 실패 : 서버 오류");
        }
    }

    @Operation(summary = "댓글 상태 변경 (관리자)", description = "관리자가 특정 댓글의 상태를 변경합니다.")
    @PostMapping("/{commentId}/admin-status-change")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> adminChangeCommentStatus(
            @PathVariable("commentId") Long commentId,
            @RequestBody AdminStatusChangeRequestDto requestDto
    ) {
        if (requestDto == null || requestDto.getStatus() == null) {
            return ResponseEntity.badRequest().build();
        }
        commentService.adminChangeCommentStatus(commentId, requestDto.getStatus());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my")
    @Operation(summary = "내 댓글 목록 조회")
    public ResponseEntity<Page<CommentResponseDto>> getMyComments(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PageableDefault(size = 10, sort = "creationTime", direction = Sort.Direction.DESC) Pageable pageable) {
        String userName = principal.getUser().getUserName();
        Page<CommentResponseDto> comments = commentService.findMyComments(userName, pageable);

        if (comments.isEmpty()) {
            return ResponseEntity.ok(Page.empty()); 
        }
        return ResponseEntity.ok(comments);
    }
}

