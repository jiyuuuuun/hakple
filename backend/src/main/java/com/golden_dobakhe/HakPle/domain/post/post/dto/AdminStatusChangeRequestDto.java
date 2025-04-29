package com.golden_dobakhe.HakPle.domain.post.post.dto;

import com.golden_dobakhe.HakPle.global.Status;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminStatusChangeRequestDto {
    @Schema(description = "변경할 게시글 상태", example = "ACTIVE")
    private Status status; 
} 