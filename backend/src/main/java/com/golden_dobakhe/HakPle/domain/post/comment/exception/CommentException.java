package com.golden_dobakhe.HakPle.domain.post.comment.exception;

import com.golden_dobakhe.HakPle.domain.post.comment.CommentResult;
import lombok.Getter;

@Getter
public class CommentException extends RuntimeException {

    private final CommentResult result;
    private final String message;

    public CommentException(CommentResult result) {
        super(result.name()); // 예외 메시지로 enum 이름 사용
        this.result = result;
        this.message = result.getDescription();
    }
    public CommentException(String message) {
        this.message = message;
        this.result = CommentResult.TOO_LONG;
    }

    public static CommentException invalidRequest(String message) {
        return new CommentException("Invalid comment request: " + message);
    }

}