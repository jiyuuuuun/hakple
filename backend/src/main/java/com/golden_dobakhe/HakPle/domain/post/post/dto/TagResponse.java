package com.golden_dobakhe.HakPle.domain.post.post.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TagResponse {
    private String name;
    private long count;
} 