package com.golden_dobakhe.HakPle.domain.user.admin.dto;

import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminUserListDto {
    private Long id;
    private String userName;
    private String phoneNum;
    private LocalDateTime creationTime;

    public AdminUserListDto(User user) {
        this.id = user.getId();
        this.userName = user.getUserName();
        this.phoneNum = user.getPhoneNum();
        this.creationTime = user.getCreationTime();
    }
}
