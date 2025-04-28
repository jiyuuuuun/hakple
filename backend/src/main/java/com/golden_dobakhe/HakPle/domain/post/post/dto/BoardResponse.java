package com.golden_dobakhe.HakPle.domain.post.post.dto;
import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.resource.image.repository.ImageRepository;
import com.golden_dobakhe.HakPle.global.Status;
import com.golden_dobakhe.HakPle.domain.resource.image.entity.Image;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Getter
@Builder
public class BoardResponse {
    private List<String> imageUrls;
    private Long id;
    private String title;
    private String content;
    private int viewCount;
    private int likeCount;
    private int commentCount;
    private Status status;
    private String academyCode;
    private Long userId;
    private String nickname;
    private String userName;
    private String profileImageUrl;
    private List<String> tags;
    private LocalDateTime creationTime;
    private LocalDateTime modificationTime;
    private String type;
    private boolean hasImage;
    
    @Deprecated
    public String getBoardType() {
        return type;
    }

    public static BoardResponse from(Board board, List<String> tags, ImageRepository imageRepository) {
        List<String> imageUrls = imageRepository.findByBoardId(board.getId())
                                        .stream().map(img -> img.getFilePath()).toList();
        boolean hasImage = !imageUrls.isEmpty();
        
        return BoardResponse.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .viewCount(board.getViewCount())
                .likeCount(board.getBoardLikes() != null ? board.getBoardLikes().size() : 0)
                .commentCount(0)
                .status(board.getStatus())
                .academyCode(board.getAcademyCode())
                .userId(board.getUser() != null ? board.getUser().getId() : null)
                .nickname(board.getUser() != null ? board.getUser().getNickName() : null)
                .userName(board.getUser() != null ? board.getUser().getUserName() : null)
                .profileImageUrl(board.getUser() != null && board.getUser().getProfileImage() != null ? board.getUser().getProfileImage().getFilePath() : null)
                .tags(tags)
                .creationTime(board.getCreationTime())
                .modificationTime(board.getModificationTime())
                .type(board.getType())
                .hasImage(hasImage)
                .imageUrls(imageUrls)
                .build();
    }

    public static BoardResponse from(Board board, List<String> tags, int commentCount, ImageRepository imageRepository) {
        List<String> imageUrls = imageRepository.findByBoardId(board.getId())
                                        .stream().map(img -> img.getFilePath()).toList();
        boolean hasImage = !imageUrls.isEmpty();
        
        return BoardResponse.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .viewCount(board.getViewCount())
                .likeCount(board.getBoardLikes() != null ? board.getBoardLikes().size() : 0)
                .commentCount(commentCount)
                .status(board.getStatus())
                .academyCode(board.getAcademyCode())
                .userId(board.getUser() != null ? board.getUser().getId() : null)
                .nickname(board.getUser() != null ? board.getUser().getNickName() : null)
                .userName(board.getUser() != null ? board.getUser().getUserName() : null)
                .profileImageUrl(board.getUser() != null && board.getUser().getProfileImage() != null ? board.getUser().getProfileImage().getFilePath() : null)
                .tags(tags)
                .creationTime(board.getCreationTime())
                .modificationTime(board.getModificationTime())
                .type(board.getType())
                .hasImage(hasImage)
                .imageUrls(imageUrls)
                .build();
    }
    
    // 기존 메서드도 유지 (하위 호환성을 위해)
    public static BoardResponse from(Board board, List<String> tags) {
        List<String> imageUrls = board.getImages() != null ? board.getImages().stream().map(Image::getFilePath).toList() : List.of();
        boolean hasImage = !imageUrls.isEmpty();
        return BoardResponse.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .viewCount(board.getViewCount())
                .likeCount(board.getBoardLikes() != null ? board.getBoardLikes().size() : 0)
                .commentCount(0)
                .status(board.getStatus())
                .academyCode(board.getAcademyCode())
                .userId(board.getUser() != null ? board.getUser().getId() : null)
                .nickname(board.getUser() != null ? board.getUser().getNickName() : null)
                .userName(board.getUser() != null ? board.getUser().getUserName() : null)
                .profileImageUrl(board.getUser() != null && board.getUser().getProfileImage() != null ? board.getUser().getProfileImage().getFilePath() : null)
                .tags(tags)
                .creationTime(board.getCreationTime())
                .modificationTime(board.getModificationTime())
                .type(board.getType())
                .hasImage(hasImage)
                .imageUrls(imageUrls)
                .build();
    }

    public static BoardResponse from(Board board, List<String> tags, int commentCount) {
        List<String> imageUrls = board.getImages() != null ? board.getImages().stream().map(Image::getFilePath).toList() : List.of();
        boolean hasImage = !imageUrls.isEmpty();
        return BoardResponse.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .viewCount(board.getViewCount())
                .likeCount(board.getBoardLikes() != null ? board.getBoardLikes().size() : 0)
                .commentCount(commentCount)
                .status(board.getStatus())
                .academyCode(board.getAcademyCode())
                .userId(board.getUser() != null ? board.getUser().getId() : null)
                .nickname(board.getUser() != null ? board.getUser().getNickName() : null)
                .userName(board.getUser() != null ? board.getUser().getUserName() : null)
                .profileImageUrl(board.getUser() != null && board.getUser().getProfileImage() != null ? board.getUser().getProfileImage().getFilePath() : null)
                .tags(tags)
                .creationTime(board.getCreationTime())
                .modificationTime(board.getModificationTime())
                .type(board.getType())
                .hasImage(hasImage)
                .imageUrls(imageUrls)
                .build();
    }
}
