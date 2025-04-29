package com.golden_dobakhe.HakPle.domain.post.post.dto;

import com.golden_dobakhe.HakPle.global.Status;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminStatusChangeRequestDto {
    private Status status; // 상태
} 