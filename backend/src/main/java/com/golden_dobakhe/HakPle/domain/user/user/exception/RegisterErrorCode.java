package com.golden_dobakhe.HakPle.domain.user.user.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum RegisterErrorCode {

    // 필수 항목
    REQUIRED("필수 입력 항목입니다.", HttpStatus.BAD_REQUEST),

    // 아이디 관련
    USERNAME_DUPLICATE("이미 사용 중인 아이디입니다.", HttpStatus.CONFLICT),
    USERNAME_INVALID("아이디는 영문 또는 숫자로 4자 이상 15자 이하여야 합니다.", HttpStatus.BAD_REQUEST),

    // 닉네임 관련
    NICKNAME_DUPLICATE("이미 사용 중인 닉네임입니다.", HttpStatus.CONFLICT),
    NICKNAME_INVALID("닉네임은 한글/영문/숫자 조합 2~20자이며 특수기호(_, -, .)만 사용할 수 있습니다.", HttpStatus.BAD_REQUEST),

    // 전화번호 관련
    PHONENUM_DUPLICATE("이미 사용 중인 전화번호입니다.", HttpStatus.CONFLICT),
    PHONENUM_INVALID("전화번호는 숫자만 포함하며, 10~11자리여야 합니다.", HttpStatus.BAD_REQUEST);

    private final String message;
    private final HttpStatus status;

    RegisterErrorCode(String message, HttpStatus status) {
        this.message = message;
        this.status = status;
    }
}