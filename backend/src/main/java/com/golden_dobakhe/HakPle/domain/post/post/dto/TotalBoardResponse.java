package com.golden_dobakhe.HakPle.domain.post.post.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.resource.image.repository.ImageRepository;
import com.golden_dobakhe.HakPle.global.Status;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;


import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class TotalBoardResponse {

    @Schema(description = "게시글 ID", example = "1")
    private Long id;

    @Schema(description = "게시글 제목", example = "전체 게시글 목록 조회 응답 제목")
    private String title;

    @Schema(description = "작성자 이름", example = "박영희")
    private String author;

    @Schema(description = "조회수", example = "50")
    private int viewCount;

    @Schema(description = "게시글 상태", example = "ACTIVE")
    private Status status;

    @Schema(description = "학원 코드", example = "ACADEMY002")
    private String academyCode;

    @Schema(description = "작성 시간", example = "2023-10-28 09:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @Schema(description = "이미지 포함 여부", example = "false")
    private boolean hasImage;


    public static TotalBoardResponse from(Board board) {
        return new TotalBoardResponse(
                board.getId(),
                board.getTitle(),
                board.getUser().getUserName(), 
                board.getViewCount(),
                board.getStatus(),
                board.getAcademyCode(),
                board.getCreationTime(),
                board.getImages() != null && !board.getImages().isEmpty()
        );
    }
    
    public static TotalBoardResponse from(Board board, ImageRepository imageRepository) {
        boolean hasImage = imageRepository.existsByBoardId(board.getId());
        
        return new TotalBoardResponse(
                board.getId(),
                board.getTitle(),
                board.getUser().getUserName(), 
                board.getViewCount(),
                board.getStatus(),
                board.getAcademyCode(),
                board.getCreationTime(),
                hasImage
        );
    }
}
