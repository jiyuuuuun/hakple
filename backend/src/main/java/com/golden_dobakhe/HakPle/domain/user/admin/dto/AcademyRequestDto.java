package com.golden_dobakhe.HakPle.domain.user.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AcademyRequestDto {
    @Schema(description = "학원 이름", example = "한빛학원")
    @NotBlank(message = "학원 이름은 필수입니다.")
    private String name;

    @Schema(description = "학원 주소", example = "서울특별시 강남구 테헤란로 123")
    @NotBlank(message = "학원 주소는 필수입니다.")
    private String address;

    @Schema(description = "학원 전화번호", example = "010-1234-5678")
    @NotBlank(message = "전화번호는 필수입니다.")
    @Pattern(
            regexp = "^01[016789]-?\\d{3,4}-?\\d{4}$",
            message = "전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678"
    )
    private String phone;
}
