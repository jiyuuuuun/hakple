package com.golden_dobakhe.HakPle.domain.post.comment.entity;

import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.user.entity.User;
import com.golden_dobakhe.HakPle.global.entity.BaseEntity;
import com.golden_dobakhe.HakPle.global.entity.Status;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@ToString
public class Comment extends BaseEntity {
    @ManyToOne(optional = false)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private int likeCount; // 댓글 좋아요 수

    @Enumerated(EnumType.STRING)
    private Status status; // ENUM('active', 'inactive', 'pending')
}
