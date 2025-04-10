package com.golden_dobakhe.HakPle.domain.post.comment;

public enum CommentDeleteResult {
    USER_NOT_FOUND, //유저 찾지 못함
    COMMENT_NOT_FOUND, //댓글 찾지 못함
    BOARD_NOT_FOUND, //게시물 찾지 못함
    UNAUTHORIZED, //권한 없음
    EMPTY, //빈 문자열
    SUCCESS //성공
}
