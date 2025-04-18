package com.golden_dobakhe.HakPle.domain.user.myInfo.service;

import com.golden_dobakhe.HakPle.domain.user.exception.UserErrorCode;
import com.golden_dobakhe.HakPle.domain.user.exception.UserException;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Academy;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.AcademyRepository;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

public class AcademyServiceTest {

    @InjectMocks
    private AcademyService academyService;

    @Mock
    private AcademyRepository academyRepository;

    @Mock
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void registerAcademy_successfullyRegistersUserToAcademy() {
        // given
        String userName = "john123";
        String academyCode = "ABC1234XYZ";

        User user = new User();
        user.setUserName(userName);

        Academy academy = new Academy();
        academy.setAcademyCode(academyCode);
        academy.setAcademyName("한빛학원");

        // when
        when(academyRepository.findByAcademyCode(academyCode)).thenReturn(Optional.of(academy));
        when(userRepository.findByUserName(userName)).thenReturn(Optional.of(user));

        // then
        String result = academyService.registerAcademy(userName, academyCode);

        assertThat(result).isEqualTo("한빛학원");
        assertThat(user.getAcademyId()).isEqualTo(academyCode);

        verify(academyRepository).findByAcademyCode(academyCode);
        verify(userRepository).findByUserName(userName);
    }

    @Test
    void registerAcademy_throwsExceptionWhenAcademyNotFound() {
        String userName = "kim";
        String academyCode = "ABC1234XYZ"; // ✅ 형식 유효해야 함

        when(academyRepository.findByAcademyCode(academyCode)).thenReturn(Optional.empty());

        Throwable thrown = catchThrowable(() -> academyService.registerAcademy(userName, academyCode));

        assertThat(thrown)
                .isInstanceOf(UserException.class)
                .extracting("errorCode")
                .isEqualTo(UserErrorCode.ACADEMY_ID_NOT_FOUND);
    }

    @Test
    void registerAcademy_throwsExceptionWhenUserNotFound() {
        // given
        String userName = "nonexistentUser";
        String academyCode = "ABC1234XYZ"; // ✅ 유효한 포맷

        Academy academy = new Academy();
        academy.setAcademyCode(academyCode);
        academy.setAcademyName("한빛학원");

        when(academyRepository.findByAcademyCode(academyCode)).thenReturn(Optional.of(academy));
        when(userRepository.findByUserName(userName)).thenReturn(Optional.empty());

        // when
        Throwable thrown = catchThrowable(() -> academyService.registerAcademy(userName, academyCode));

        // then
        assertThat(thrown)
                .isInstanceOf(UserException.class)
                .extracting("errorCode")
                .isEqualTo(UserErrorCode.USER_NOT_FOUND);
    }
}