package com.golden_dobakhe.HakPle.domain.post.post.dto;
import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.resource.image.repository.ImageRepository;
import com.golden_dobakhe.HakPle.global.Status;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Getter
@Builder
public class BoardResponse {
    private Long id;
    private String title;
    private String content;
    private int viewCount;
    private int likeCount;
    private int commentCount;
    private Status status;
    private String academyCode;
    private String nickname;
    private List<String> tags;
    private LocalDateTime creationTime;
    private LocalDateTime modificationTime;
    private String type;
    private boolean hasImage;
    
    /**
     * 이전 버전과의 호환성을 위한 메서드
     * @deprecated 새 코드에서는 getType()을 사용하세요.
     */
    @Deprecated
    public String getBoardType() {
        return type;
    }

    public static BoardResponse from(Board board, List<String> tags, ImageRepository imageRepository) {
        boolean hasImage = imageRepository.existsByBoardId(board.getId());
        
        return BoardResponse.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .viewCount(board.getViewCount())
                .likeCount(board.getBoardLikes() != null ? board.getBoardLikes().size() : 0)
                .commentCount(0)
                .status(board.getStatus())
                .academyCode(board.getAcademyCode())
                .nickname(board.getUser() != null ? board.getUser().getNickName() : null)
                .tags(tags)
                .creationTime(board.getCreationTime())
                .modificationTime(board.getModificationTime())
                .type(board.getType())
                .hasImage(hasImage)
                .build();
    }

    public static BoardResponse from(Board board, List<String> tags, int commentCount, ImageRepository imageRepository) {
        boolean hasImage = imageRepository.existsByBoardId(board.getId());
        
        return BoardResponse.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .viewCount(board.getViewCount())
                .likeCount(board.getBoardLikes() != null ? board.getBoardLikes().size() : 0)
                .commentCount(commentCount)
                .status(board.getStatus())
                .academyCode(board.getAcademyCode())
                .nickname(board.getUser() != null ? board.getUser().getNickName() : null)
                .tags(tags)
                .creationTime(board.getCreationTime())
                .modificationTime(board.getModificationTime())
                .type(board.getType())
                .hasImage(hasImage)
                .build();
    }
    
    // 기존 메서드도 유지 (하위 호환성을 위해)
    public static BoardResponse from(Board board, List<String> tags) {
        return BoardResponse.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .viewCount(board.getViewCount())
                .likeCount(board.getBoardLikes() != null ? board.getBoardLikes().size() : 0)
                .commentCount(0)
                .status(board.getStatus())
                .academyCode(board.getAcademyCode())
                .nickname(board.getUser() != null ? board.getUser().getNickName() : null)
                .tags(tags)
                .creationTime(board.getCreationTime())
                .modificationTime(board.getModificationTime())
                .type(board.getType())
                .hasImage(board.getImages() != null && !board.getImages().isEmpty())
                .build();
    }

    public static BoardResponse from(Board board, List<String> tags, int commentCount) {
        return BoardResponse.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .viewCount(board.getViewCount())
                .likeCount(board.getBoardLikes() != null ? board.getBoardLikes().size() : 0)
                .commentCount(commentCount)
                .status(board.getStatus())
                .academyCode(board.getAcademyCode())
                .nickname(board.getUser() != null ? board.getUser().getNickName() : null)
                .tags(tags)
                .creationTime(board.getCreationTime())
                .modificationTime(board.getModificationTime())
                .type(board.getType())
                .hasImage(board.getImages() != null && !board.getImages().isEmpty())
                .build();
    }
}
