package com.golden_dobakhe.HakPle.domain.user.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "아이디 찾기 요청 DTO")
public class FindUserNameRequest {
    @NotBlank(message = "회원가입시 등록했던 전화번호를 입력하세요.")
    @Schema(description = "전화번호 입력", example = "010-1234-5678")
    private String phoneNum;
}
