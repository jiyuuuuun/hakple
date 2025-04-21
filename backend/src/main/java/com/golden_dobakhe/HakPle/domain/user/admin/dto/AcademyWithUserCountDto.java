package com.golden_dobakhe.HakPle.domain.user.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "학원 정보 + 유저 수 DTO")
public class AcademyWithUserCountDto {
    @Schema(description = "학원 코드", example = "ABC1234XYZ")
    private String academyCode;

    @Schema(description = "학원 이름", example = "해피코딩학원")
    private String academyName;

    @Schema(description = "학원 전화번호", example = "010-1234-5678")
    private String phoneNum;

    @Schema(description = "소속 유저 수", example = "12")
    private Long userCount;

    @Schema(description = "생성 시간 ")
    private LocalDateTime creationTime;

    public AcademyWithUserCountDto(String academyCode, String academyName, String phoneNum, Long userCount, LocalDateTime creationTime) {
        this.academyCode = academyCode;
        this.academyName = academyName;
        this.phoneNum = phoneNum;
        this.userCount = userCount;
        this.creationTime = creationTime;
    }

    // getters, setters
}
