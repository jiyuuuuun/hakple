package com.golden_dobakhe.HakPle.domain.user.user.validator;


import com.golden_dobakhe.HakPle.domain.user.user.exception.RegisterErrorCode;
import com.golden_dobakhe.HakPle.domain.user.user.exception.RegisterException;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;

public class PhoneNumValidator {
    private static final String PHONE_REGEX = "^\\d{10,11}$";

    public static void validatePhoneNum(String phoneNum, UserRepository userRepository) {
        if (phoneNum == null || phoneNum.isBlank()) {
            throw new RegisterException(RegisterErrorCode.REQUIRED);
        }

        if (!phoneNum.matches(PHONE_REGEX)) {
            throw new RegisterException(RegisterErrorCode.PHONENUM_INVALID);
        }

        if (userRepository.existsByPhoneNum(phoneNum)) {
            throw new RegisterException(RegisterErrorCode.PHONENUM_DUPLICATE);
        }
    }
}