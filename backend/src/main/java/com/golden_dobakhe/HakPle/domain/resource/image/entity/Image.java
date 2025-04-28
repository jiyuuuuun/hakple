package com.golden_dobakhe.HakPle.domain.resource.image.entity;

import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import jakarta.persistence.*;
import lombok.Builder;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@ToString
public class Image extends BaseEntity {
   
    @ManyToOne(optional = true) // 게시글과 연결된 이미지 (nullable 가능)
    @JoinColumn(name = "board_id")
    private Board board;

    @OneToOne(mappedBy = "profileImage")
    private User user; // 유저와 연결된 프로필 이미지 (1:1 관계)

    @Lob // 대용량 데이터를 매핑할 때 사용됩니다. 주로 텍스트나 바이너리 데이터를 저장할 때 사용 , TEXT 타입
    private String filePath; // 이미지 경로 (TEXT 타입)
    
    @Column(name = "temp_id", length = 100)
    private String tempId; // 임시 이미지 식별자

    @Column(nullable = false)
    private Boolean isTemp;    // true면 임시 저장된 이미지

    @Column(nullable = false)
    private Boolean isDeleted; // soft-delete 여부

    @Column(nullable = false)
    private String originalName;

    @Column(nullable = false)
    private String storedName;

    @Column(nullable = false)
    private String path;

    @Column(nullable = false)
    private Long size;

    @Column(nullable = false)
    private String contentType;


    @Column(nullable = false)
    private boolean isTemporary;  

    @Column
    private LocalDateTime expiresAt;  

    @Column
    private String s3Key;

    public Image(String originalName, String storedName, String path, Long size, String contentType, boolean isTemporary, String tempId, String s3Key) {
        this.originalName = originalName;
        this.storedName = storedName;
        this.path = path;
        this.size = size;
        this.contentType = contentType;
        this.isTemporary = isTemporary;
        this.tempId = tempId;
        this.s3Key = s3Key;
        if (isTemporary) {
            this.expiresAt = LocalDateTime.now().plusHours(24); 
        }
    }

    public void markAsPermanent(String newPath) {
        this.isTemporary = false;
        this.path = newPath;
        this.tempId = null;
        this.expiresAt = null;
    }

    public boolean isExpired() {
        return isTemporary && LocalDateTime.now().isAfter(expiresAt);
    }

    public void makePermanent(String permanentS3Key) {
        this.s3Key = permanentS3Key;
        this.isTemp = false;
        this.expiresAt = null;
    }

    public String getS3Key() {
        return this.s3Key;
    }
}