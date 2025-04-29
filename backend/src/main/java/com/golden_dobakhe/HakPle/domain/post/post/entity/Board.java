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
    private User user; 

    @Column(length = 255, nullable = false)
    private String title;

    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content; 

    @Lob 
    @Column(name = "content_text", columnDefinition = "LONGTEXT") 
    private String contentText; 

    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int viewCount; 

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status; 

    @Column(nullable = false)
    private String academyCode; 
    
    @Column(name = "type", length = 20)
    private String type; 

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<BoardLike> boardLikes = new HashSet<>(); 

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>(); 

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TagMapping> tags = new ArrayList<>(); 

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Image> images = new ArrayList<>();

    public int getLikeCount() {
        return this.boardLikes.size();
    }

    public void increaseViewCount() {
        this.viewCount++;
    }

    public void update(String title, String content, String contentText, String type) {
        if (title != null && !title.isBlank()) {
            this.title = title;
        }
        if (content != null) {
            this.content = content;
        }
        if (contentText != null) {
            this.contentText = contentText;
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
    
    @Deprecated
    public String getBoardType() {
        return this.type;
    }
    
    @Deprecated
    public void setBoardType(String boardType) {
        this.type = boardType;
    }
    
    

    public void updateAcademyCode(String academyCode) {
        if (academyCode != null && !academyCode.isEmpty()) {
            this.academyCode = academyCode;
        }
    }
}
