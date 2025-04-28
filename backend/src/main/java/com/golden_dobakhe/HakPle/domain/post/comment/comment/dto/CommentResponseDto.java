package com.golden_dobakhe.HakPle.domain.post.comment.comment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.Comment;
import com.golden_dobakhe.HakPle.global.Status;
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
public class CommentResponseDto {
    private Long id;
    private Long boardId;
    private String content;
    private String nickname;
    private int likeCount;
    private Long userId;
    private LocalDateTime creationTime;
    private LocalDateTime modificationTime;
    private Status status;
    private String profileImageUrl;
    
    @JsonProperty("isLiked")
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
                .profileImageUrl(comment.getUser().getProfileImage() != null ? comment.getUser().getProfileImage().getFilePath() : null )
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
                .build();
    }
}