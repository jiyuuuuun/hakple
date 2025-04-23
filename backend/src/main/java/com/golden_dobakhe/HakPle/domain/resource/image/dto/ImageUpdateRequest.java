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
} 