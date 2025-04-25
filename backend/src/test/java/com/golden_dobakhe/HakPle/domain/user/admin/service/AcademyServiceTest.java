package com.golden_dobakhe.HakPle.domain.user.admin.service;


import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.golden_dobakhe.HakPle.domain.user.admin.dto.AcademyRequestDto;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Academy;
import com.golden_dobakhe.HakPle.domain.user.user.repository.AcademyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

public class AcademyServiceTest {

    @InjectMocks
    private AdminService adminService;

    @Mock
    private AcademyRepository academyRepository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createAcademy_shouldReturnGeneratedCode() {
        // given
        AcademyRequestDto requestDto = new AcademyRequestDto();
        requestDto.setName("한빛학원");
        requestDto.setPhone("010-1234-5678");

        // when - academyCode 중복 없음 가정
        when(academyRepository.existsByAcademyCode(anyString())).thenReturn(false);
        when(academyRepository.save(any(Academy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // then
        String code = adminService.createAcademy(requestDto);
        assertThat(code).matches("^[A-Z]{3}\\d{4}[A-Z]{3}$"); // 형식 확인
        verify(academyRepository).save(any(Academy.class));
    }
}