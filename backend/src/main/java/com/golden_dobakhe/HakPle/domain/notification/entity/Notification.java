package com.golden_dobakhe.HakPle.domain.notification.entity;

import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
// import com.golden_dobakhe.HakPle.global.BaseTimeEntity; // 기존 import 주석 처리 또는 삭제
import com.golden_dobakhe.HakPle.global.entity.BaseEntity; // 올바른 경로로 수정
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseEntity { 

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; 

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType notificationType; 

    @Column(nullable = false, length = 500) 
    private String message; 

    @Column(length = 2048) 
    private String link; 

    @Column(nullable = false)
    private Boolean isRead = false; 

    private Long contentId; // 게시글 ID 등 관련 컨텐츠 ID 저장

    @Builder
    public Notification(User user, NotificationType notificationType, String message, String link, Boolean isRead, Long contentId) {
        this.user = user;
        this.notificationType = notificationType;
        this.message = message;
        this.link = link;
        this.isRead = (isRead != null) ? isRead : false;
        this.contentId = contentId; // contentId 초기화
    }

    public void markAsRead() {
        this.isRead = true;
    }
} 