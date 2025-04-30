package com.golden_dobakhe.HakPle.domain.user.myInfo.service;

import com.golden_dobakhe.HakPle.domain.user.exception.UserErrorCode;
import com.golden_dobakhe.HakPle.domain.user.exception.UserException;
import com.golden_dobakhe.HakPle.domain.user.myInfo.validator.AcademyCodeValidator;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Academy;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.AcademyRepository;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AcademyService {
    private final UserRepository userRepository;
    private final AcademyRepository academyRepository;

    @Transactional
    public String registerAcademy(String userName, String academyCode) {
        // 유효성 검사
        AcademyCodeValidator.validateAcademyId(academyCode);

        // 학원 찾기 (코드로 직접 조회) , 전화번호 뒷자리로 조회하면 중복 가능성 있으므로
        Academy academy = academyRepository.findByAcademyCode(academyCode)
                .orElseThrow(() -> new UserException(UserErrorCode.ACADEMY_ID_NOT_FOUND));

        // 사용자 찾기
        User user = userRepository.findByUserName(userName)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        // 학원코드 저장
        user.setAcademyId(academyCode);
        user.setModificationTime(LocalDateTime.now());

        return academy.getAcademyName();
    }
}