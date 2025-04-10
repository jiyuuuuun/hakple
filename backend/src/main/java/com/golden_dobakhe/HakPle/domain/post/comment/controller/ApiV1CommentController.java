package com.golden_dobakhe.HakPle.domain.post.comment.controller;

import com.golden_dobakhe.HakPle.domain.post.comment.dto.CommentRequestDto;
import com.golden_dobakhe.HakPle.domain.post.comment.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/comments")
public class ApiV1CommentController {
    private final CommentService commentService;

    //댓글 저장
    @PostMapping
    public ResponseEntity<String> postComment(@RequestBody CommentRequestDto commentRequestDto) {
        int result = commentService.commentSave(commentRequestDto);
        if (result==3) {
            return ResponseEntity.ok("댓글 저장 완료");
        } else if (result==2) {
            return ResponseEntity.badRequest().body("댓글 저장 실패 : 사용자를 찾을 수 없습니다");
        } else if (result==1) {
            return ResponseEntity.badRequest().body("댓글 저장 실패 : 게시물을 찾을 수 없습니다");
        } else if (result==4) {
            return ResponseEntity.badRequest().body("댓글 저장 실패 : Comment Empty 입니다");
        }
        return null;
    }
}
