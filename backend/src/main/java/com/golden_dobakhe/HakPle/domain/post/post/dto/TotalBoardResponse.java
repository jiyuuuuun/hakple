package com.golden_dobakhe.HakPle.domain.post.post.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.resource.image.repository.ImageRepository;
import com.golden_dobakhe.HakPle.global.Status;
import lombok.AllArgsConstructor;
import lombok.Getter;


import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class TotalBoardResponse {

    private Long id;
    private String title;
    private String author;
    private int viewCount;
    private Status status;
    private String academyCode;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    private boolean hasImage;


    public static TotalBoardResponse from(Board board) {
        return new TotalBoardResponse(
                board.getId(),
                board.getTitle(),
                board.getUser().getUserName(), // 또는 username
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
                board.getUser().getUserName(), // 또는 username
                board.getViewCount(),
                board.getStatus(),
                board.getAcademyCode(),
                board.getCreationTime(),
                hasImage
        );
    }
}
