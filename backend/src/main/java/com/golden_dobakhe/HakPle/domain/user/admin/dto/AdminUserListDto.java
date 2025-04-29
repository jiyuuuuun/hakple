package com.golden_dobakhe.HakPle.domain.user.admin.dto;

import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "관리자용 사용자 리스트 응답 DTO")
public class AdminUserListDto {

    @Schema(description = "사용자 ID", example = "1001")
    private Long id;

    @Schema(description = "사용자 이름(닉네임)", example = "user_abc")
    private String userName;

    @Schema(description = "사용자 전화번호", example = "010-1234-5678")
    private String phoneNum;

    @Schema(description = "계정 생성일", example = "2024-04-28T15:30:00")
    private LocalDateTime creationTime;
    public AdminUserListDto(User user) {
        this.id = user.getId();
        this.userName = user.getUserName();
        this.phoneNum = user.getPhoneNum();
        this.creationTime = user.getCreationTime();
    }
}
