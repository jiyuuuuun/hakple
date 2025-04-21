package com.golden_dobakhe.HakPle.domain.user.user.exception;

public class RegisterException extends RuntimeException {
    private final RegisterErrorCode errorCode;

    public RegisterException(RegisterErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public RegisterErrorCode getErrorCode() {
        return errorCode;
    }
}