package com.golden_dobakhe.HakPle.domain.post.comment.like.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "유저가 좋아요 누름 상태 DTO")
public class LikeStatusResponseDto {
    @Schema(description = "좋아요 누름 상태")
    private boolean isLiked;
} 