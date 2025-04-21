package com.golden_dobakhe.HakPle.domain.user.user.validator;


import com.golden_dobakhe.HakPle.domain.user.user.exception.RegisterErrorCode;
import com.golden_dobakhe.HakPle.domain.user.user.exception.RegisterException;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;


public class NickNameValidator {
    private static final String NICKNAME_REGEX = "^[a-zA-Z가-힣0-9_.-]{2,20}$";

    public static void validateNickName(String nickName, UserRepository userRepository) {
        if (nickName == null || nickName.isBlank()) {
            throw new RegisterException(RegisterErrorCode.REQUIRED);
        }

        if (!nickName.matches(NICKNAME_REGEX)) {
            throw new RegisterException(RegisterErrorCode.NICKNAME_INVALID);
        }

        if (userRepository.existsByNickName(nickName)) {
            throw new RegisterException(RegisterErrorCode.NICKNAME_DUPLICATE);
        }
    }
}
