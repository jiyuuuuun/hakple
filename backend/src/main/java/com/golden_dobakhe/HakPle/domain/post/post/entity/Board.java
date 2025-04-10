package com.golden_dobakhe.HakPle.domain.post.post.entity;

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
public class Board extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // 작성자 (User와 연결)

    @Column(length = 255, nullable = false)
    private String title; // 제목

    @Lob // TEXT 타입
    @Column(nullable = false)
    private String content; // 내용 (TEXT 타입)

    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int viewCount; // 조회수 (기본값 0)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status; // ENUM('active', 'inactive', 'pending')
}
