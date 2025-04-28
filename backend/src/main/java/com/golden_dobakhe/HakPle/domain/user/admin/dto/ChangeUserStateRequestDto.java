package com.golden_dobakhe.HakPle.domain.user.admin.dto;

import com.golden_dobakhe.HakPle.global.Status;
import lombok.Getter;

@Getter
public class ChangeUserStateRequestDto {
    private Long id;
    private Status state;
}
