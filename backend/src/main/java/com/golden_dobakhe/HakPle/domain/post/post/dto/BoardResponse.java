package com.golden_dobakhe.HakPle.domain.post.post.dto;
import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.resource.image.repository.ImageRepository;
import com.golden_dobakhe.HakPle.global.Status;
import com.golden_dobakhe.HakPle.domain.resource.image.entity.Image;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;


@Getter
@Builder
public class BoardResponse {
    @Schema(description = "게시글 이미지 URL 목록", example = "[\"http://example.com/image1.jpg\", \"http://example.com/image2.jpg\"]")
    private List<String> imageUrls;

    @Schema(description = "게시글 ID", example = "1")
    private Long id;

    @Schema(description = "게시글 제목", example = "게시글 제목입니다")
    private String title;

    @Schema(description = "게시글 내용", example = "게시글 내용입니다")
    private String content;

    @Schema(description = "조회수", example = "100")
    private int viewCount;

    @Schema(description = "좋아요 수", example = "15")
    private int likeCount;

    @Schema(description = "댓글 수", example = "5")
    private int commentCount;

    @Schema(description = "게시글 상태", example = "ACTIVE")
    private Status status;

    @Schema(description = "학원 코드", example = "ACADEMY001")
    private String academyCode;

    @Schema(description = "작성자 ID", example = "1")
    private Long userId;

    @Schema(description = "작성자 닉네임", example = "골든도박해")
    private String nickname;

    @Schema(description = "작성자 이름", example = "김철수")
    private String userName;

    @Schema(description = "작성자 프로필 이미지 URL", example = "http://example.com/profile.jpg")
    private String profileImageUrl;

    @Schema(description = "게시글 태그 목록", example = "[\"Java\", \"Spring\"]")
    private List<String> tags;

    @Schema(description = "작성 시간", example = "2023-10-27T10:15:30")
    private LocalDateTime creationTime;

    @Schema(description = "수정 시간", example = "2023-10-27T11:30:00")
    private LocalDateTime modificationTime;

    @Schema(description = "게시판 종류", example = "FREE")
    private String type;

    @Schema(description = "이미지 포함 여부", example = "true")
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
                //.profileImageUrl(board.getUser().getProfileImage()!= null ? board.getUser().getProfileImage().getFilePath() : null)
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
                //.profileImageUrl(board.getUser().getProfileImage()!= null ? board.getUser().getProfileImage().getFilePath() : null)
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
                //.profileImageUrl(board.getUser().getProfileImage() != null ? board.getUser().getProfileImage().getFilePath() : null)
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
                //.profileImageUrl(board.getUser().getProfileImage() != null ? board.getUser().getProfileImage().getFilePath() : null)
                .build();
    }
}
