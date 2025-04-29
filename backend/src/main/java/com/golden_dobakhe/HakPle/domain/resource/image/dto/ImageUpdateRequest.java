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
    private List<String> tempIds; 
    private Long boardId; 
    private List<String> usedImageUrls; 
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