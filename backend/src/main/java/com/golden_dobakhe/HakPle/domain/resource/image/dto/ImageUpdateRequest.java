package com.golden_dobakhe.HakPle.domain.resource.image.dto;

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
public class ImageUpdateRequest {
    private List<String> tempIds; // 임시 이미지 식별자 목록
    private Long boardId; // 연결할 게시글 ID
    private List<String> usedImageUrls; // 글 수정 시 기존 이미지 URL 목록
    private String content; // 게시글 HTML 콘텐츠

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