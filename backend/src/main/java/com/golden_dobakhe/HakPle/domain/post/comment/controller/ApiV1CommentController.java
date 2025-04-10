package com.golden_dobakhe.HakPle.domain.post.comment.controller;

import com.golden_dobakhe.HakPle.domain.post.comment.CommentDeleteResult;
import com.golden_dobakhe.HakPle.domain.post.comment.dto.CommentRequestDto;
import com.golden_dobakhe.HakPle.domain.post.comment.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/comments")
public class ApiV1CommentController {
    private final CommentService commentService;

    //댓글 저장
    @PostMapping
    public ResponseEntity<String> postComment(@RequestBody CommentRequestDto commentRequestDto) {
        CommentDeleteResult result = commentService.commentSave(commentRequestDto);

        switch (result) {
            case SUCCESS:
                return ResponseEntity.status(HttpStatus.CREATED).body("댓글 저장 완료");
            case USER_NOT_FOUND:
                return ResponseEntity.badRequest().body("댓글 저장 실패 : 사용자를 찾을 수 없습니다");
            case BOARD_NOT_FOUND:
                return ResponseEntity.badRequest().body("댓글 저장 실패 : 게시물을 찾을 수 없습니다");
            case EMPTY:
                return ResponseEntity.badRequest().body("댓글 저장 실패 : Comment Empty 입니다");
            default:
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("댓글 저장 실패 : 서버 오류");
        }
    }

    //댓글 수정
    @PostMapping("/update")
    public ResponseEntity<String> updateComment(@RequestBody CommentRequestDto commentRequestDto) {
        CommentDeleteResult result = commentService.commentUpdate(commentRequestDto);

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
    //댓글 삭제
    @DeleteMapping("/{commenterId}")
    public ResponseEntity<String> deleteComment(@PathVariable(name = "commenterId") Long commenterId) {
        CommentDeleteResult result = commentService.commentDelete(commenterId);

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


}
