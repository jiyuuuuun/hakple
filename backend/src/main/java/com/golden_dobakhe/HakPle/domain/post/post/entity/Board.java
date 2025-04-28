package com.golden_dobakhe.HakPle.domain.post.post.entity;

import com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.Comment;
import com.golden_dobakhe.HakPle.domain.post.post.exception.BoardException;
import com.golden_dobakhe.HakPle.domain.resource.image.entity.Image;

import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.global.Status;
import com.golden_dobakhe.HakPle.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@ToString(exclude = {"boardLikes", "comments", "tags", "images", "user"})
public class Board extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // 작성자 (User와 연결)

    @Column(length = 255, nullable = false)
    private String title; // 제목

    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content; // 내용 (LONGTEXT 타입으로 변경 - 최대 4GB까지 저장 가능)

    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int viewCount; // 조회수 (기본값 0)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status; // ENUM('active', 'inactive', 'pending')

    @Column(nullable = false)
    private String academyCode; // 학원 코드
    
    @Column(name = "type", length = 20)
    private String type; // 게시글 유형 (notice: 공지사항, free: 자유게시판, popular: 인기게시글)

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<BoardLike> boardLikes = new HashSet<>(); // 좋아요 수

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>(); // 댓글 수

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TagMapping> tags = new ArrayList<>(); // 태그 매핑 리스트

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Image> images = new ArrayList<>();

    public void increaseViewCount() {
        this.viewCount++;
    }

    public void update(String title, String content, String type) {
        if (title != null && !title.isBlank()) {
            this.title = title;
        }
        if (content != null && !content.isBlank()) {
            this.content = content;
        }
        if (type != null && !type.isBlank()) {
            this.type = type;
        }
        this.setModificationTime(LocalDateTime.now());
    }

    public void validateUser(Long userId) {
        if (!this.user.getId().equals(userId)) {
            throw BoardException.unauthorized();
        }
    }

    public void validateStatus() {
        if (this.status != Status.ACTIVE) {
            throw BoardException.notFound();
        }
    }
    
    /**
     * boardType을 호환성을 위해 남겨둔 getter 메서드
     * @deprecated 새 코드에서는 getType()을 사용하세요.
     */
    @Deprecated
    public String getBoardType() {
        return this.type;
    }
    
    /**
     * boardType을 호환성을 위해 남겨둔 setter 메서드
     * @deprecated 새 코드에서는 setType()을 사용하세요.
     */
    @Deprecated
    public void setBoardType(String boardType) {
        this.type = boardType;
    }
    
    /**
     * academyCode를 업데이트하는 메서드
     * @param academyCode 새로운 아카데미 코드
     */
    public void updateAcademyCode(String academyCode) {
        if (academyCode != null && !academyCode.isEmpty()) {
            this.academyCode = academyCode;
        }
    }
}
