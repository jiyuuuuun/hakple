package com.golden_dobakhe.HakPle.domain.user.admin.dto;

import com.golden_dobakhe.HakPle.global.Status;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

@Getter
@Schema(description = "사용자 상태 변경 요청 DTO")
public class ChangeUserStateRequestDto {

    @Schema(description = "사용자 ID", example = "1001")
    private Long id;

    @Schema(description = "변경할 상태 (예: ACTIVE, INACTIVE, BANNED 등)", example = "INACTIVE")
    private Status state;


}


