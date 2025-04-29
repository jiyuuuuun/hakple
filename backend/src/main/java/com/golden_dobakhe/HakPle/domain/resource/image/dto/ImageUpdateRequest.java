package com.golden_dobakhe.HakPle.domain.resource.image.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 이미지를 게시글에 연결하는 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "이미지를 게시글에 연결하는 요청 DTO")
public class ImageUpdateRequest {
    @Schema(description = "게시글에 연결할 임시 이미지 ID 목록", example = "[\"tempId1\", \"tempId2\"]")
    private List<String> tempIds;
    @Schema(description = "이미지를 연결할 게시글 ID", example = "1")
    private Long boardId;
    @Schema(description = "게시글 내용에서 사용된 이미지 URL 목록", example = "[\"url1\", \"url2\"]")
    private List<String> usedImageUrls;
    @Schema(description = "게시글 내용 (HTML)", example = "<p>내용 <img src='url1'></p>")
    private String content;

    public List<String> getTempIds() {
        return tempIds;
    }

    public void setTempIds(List<String> tempIds) {
        this.tempIds = tempIds;
    }

    public Long getBoardId() {
        return boardId;
    }

    public void setBoardId(Long boardId) {
        this.boardId = boardId;
    }

    public List<String> getUsedImageUrls() {
        return usedImageUrls;
    }

    public void setUsedImageUrls(List<String> usedImageUrls) {
        this.usedImageUrls = usedImageUrls;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
} 