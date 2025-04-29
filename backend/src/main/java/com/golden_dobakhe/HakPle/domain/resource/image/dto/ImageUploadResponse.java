package com.golden_dobakhe.HakPle.domain.resource.image.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Schema(description = "임시 이미지 업로드 응답 DTO")
public class ImageUploadResponse {
    @Schema(description = "임시 이미지 ID", example = "tempId1")
    private String tempId;
    @Schema(description = "임시 이미지 URL", example = "/images/temp/tempId1.jpg")
    private String tempUrl;
} 