package com.golden_dobakhe.HakPle.domain.post.post.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Builder
public class TagResponse {
    @Schema(description = "태그 이름", example = "Java")
    private String name;

    @Schema(description = "태그 사용 횟수", example = "120")
    private long count;
} 