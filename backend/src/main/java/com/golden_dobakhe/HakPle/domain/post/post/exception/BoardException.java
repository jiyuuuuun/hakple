package com.golden_dobakhe.HakPle.domain.post.post.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BoardException extends RuntimeException {
    private final HttpStatus status;
    private final String message;

    public BoardException(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public static BoardException notFound() {
        return new BoardException(HttpStatus.NOT_FOUND, "요청하신 게시글을 찾을 수 없습니다.");
    }
    
    public static BoardException notFound(String message) {
        return new BoardException(HttpStatus.NOT_FOUND, message);
    }

    public static BoardException unauthorized() {
        return new BoardException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다. 로그인 후 다시 시도해주세요.");
    }

    public static BoardException forbidden() {
        return new BoardException(HttpStatus.FORBIDDEN, "접근 권한이 없습니다.");
    }

    public static BoardException invalidRequest() {
        return new BoardException(HttpStatus.BAD_REQUEST, "잘못된 요청입니다. 입력값을 확인해주세요.");
    }
    
    public static BoardException invalidRequest(String message) {
        return new BoardException(HttpStatus.BAD_REQUEST, message);
    }

    public static BoardException duplicateTag() {
        return new BoardException(HttpStatus.CONFLICT, "이미 존재하는 태그입니다.");
    }

    public static BoardException internalServerError() {
        return new BoardException(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
}
