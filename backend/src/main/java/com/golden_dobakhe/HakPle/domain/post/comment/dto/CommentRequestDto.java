package com.golden_dobakhe.HakPle.domain.post.comment.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CommentRequestDto {
    private Long boardId; //생성
    private String content; //생성
    private Long commenterId; //수정
}
