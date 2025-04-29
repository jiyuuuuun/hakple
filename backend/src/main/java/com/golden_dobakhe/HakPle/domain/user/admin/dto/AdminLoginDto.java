package com.golden_dobakhe.HakPle.domain.user.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.Getter;

@Data
@Schema(description = "관리자 로그인 요청 DTO")
public class AdminLoginDto {

    @Schema(description = "관리자 아이디 (Username)", example = "admin_user")
    private String userName;

    @Schema(description = "관리자 비밀번호", example = "P@ssw0rd!")
    private String password;
}