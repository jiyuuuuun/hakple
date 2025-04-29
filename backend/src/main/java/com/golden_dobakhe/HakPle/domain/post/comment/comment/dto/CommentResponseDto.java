package com.golden_dobakhe.HakPle.domain.post.comment.comment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.Comment;
import com.golden_dobakhe.HakPle.global.Status;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "댓글 응답 Dto")
public class CommentResponseDto {

    @Schema(description = "댓글 ID", example = "1")
    private Long id;

    @Schema(description = "게시글 ID", example = "10")
    private Long boardId;

    @Schema(description = "댓글 내용", example = "정말 좋은 글이네요!")
    private String content;

    @Schema(description = "작성자 닉네임", example = "happy_coder")
    private String nickname;

    @Schema(description = "댓글 좋아요 수", example = "5")
    private int likeCount;

    @Schema(description = "작성자 유저 ID", example = "1001")
    private Long userId;

    @Schema(description = "댓글 생성 시간", example = "2024-04-28T14:30:00")
    private LocalDateTime creationTime;

    @Schema(description = "댓글 수정 시간", example = "2024-04-29T10:00:00")
    private LocalDateTime modificationTime;

    @Schema(description = "댓글 상태 (활성/삭제 등)", example = "ACTIVE")
    private Status status;

    @Schema(description = "작성자 프로필 이미지 URL", example = "https://example.com/profile.jpg")
    private String profileImageUrl;

    @JsonProperty("isLiked")
    @Schema(description = "현재 유저가 좋아요를 눌렀는지 여부", example = "true")
    private boolean isLiked;

    public static CommentResponseDto fromEntity(Comment comment) {
        return CommentResponseDto.builder()
                .id(comment.getId())
                .boardId(comment.getBoard().getId())
                .content(comment.getContent())
                .nickname(comment.getUser().getNickName())
                .likeCount(comment.getLikeCount())
                .userId(comment.getUser().getId())
                .creationTime(comment.getCreationTime())
                .modificationTime(comment.getModificationTime())
                .status(comment.getStatus())
                .isLiked(false)
                .profileImageUrl(comment.getUser() != null && comment.getUser().getProfileImage() != null ? comment.getUser().getProfileImage().getFilePath() : null)
                .build();
    }
    
    public static CommentResponseDto fromEntity(Comment comment, boolean isLiked) {
        return CommentResponseDto.builder()
                .id(comment.getId())
                .boardId(comment.getBoard().getId())
                .content(comment.getContent())
                .nickname(comment.getUser().getNickName())
                .likeCount(comment.getLikeCount())
                .userId(comment.getUser().getId())
                .creationTime(comment.getCreationTime())
                .modificationTime(comment.getModificationTime())
                .status(comment.getStatus())
                .profileImageUrl(comment.getUser().getProfileImage() != null ? comment.getUser().getProfileImage().getFilePath() : null )
                .isLiked(isLiked)
                .profileImageUrl(comment.getUser() != null && comment.getUser().getProfileImage() != null ? comment.getUser().getProfileImage().getFilePath() : null)
                .build();
    }
}