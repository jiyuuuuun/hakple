package com.golden_dobakhe.HakPle.domain.user.user.validator;

import com.golden_dobakhe.HakPle.domain.user.user.exception.RegisterErrorCode;
import com.golden_dobakhe.HakPle.domain.user.user.exception.RegisterException;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;

public class UserNameValidator {
    private static final String USERNAME_REGEX = "^[a-zA-Z0-9]{4,15}$"; // 영문 + 숫자 4~15자

    public static void validateUserName(String userName, UserRepository userRepository) {
        if (userName == null || userName.isBlank()) {
            throw new RegisterException(RegisterErrorCode.REQUIRED);
        }

        if (!userName.matches(USERNAME_REGEX)) {
            throw new RegisterException(RegisterErrorCode.USERNAME_INVALID);
        }

        if (userRepository.existsByUserName(userName)) {
            throw new RegisterException(RegisterErrorCode.USERNAME_DUPLICATE);
        }
    }
}
