package com.golden_dobakhe.HakPle.domain.resource.image.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ImageUploadResponse {
    private String tempId;
    private String tempUrl;
} 