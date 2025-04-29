package com.golden_dobakhe.HakPle.domain.user.admin.dto;

import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.global.Status;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "유저 리스트 응답 Dto")
public class UserListDto {

    @Schema(description = "ID")
    private Long id;

    @Schema(description = "유저 아이디")
    private String userName;

    @Schema(description = "유저 닉네임")
    private String nickName;

    @Schema(description = "소셜 로그인 정보")
    private String socialProvider;

    @Schema(description = "유저 휴대폰 번호")
    private String phoneNum;

    @Schema(description = "유저 학원 코드")
    private String academyId;

    @Schema(description = "유저 학원 이름")
    private String academyName;

    @Schema(description = "유저 상태")
    private Status status;

    @Schema(description = "유저 신고 횟수")
    private int reportedCount;

    @Schema(description = "가입일")
    private LocalDateTime creationTime; // 생성 시간

    public UserListDto(User user,String academyName) {
        this.id=user.getId();
        this.userName = user.getUserName();
        this.nickName=user.getNickName();
        this.socialProvider = user.getSocialProvider();
        this.phoneNum = user.getPhoneNum();
        this.academyId = user.getAcademyId();
        this.academyName=academyName;
        this.status = user.getStatus();
        this.reportedCount = user.getReportedCount();
        this.creationTime = user.getCreationTime();
    }
}
