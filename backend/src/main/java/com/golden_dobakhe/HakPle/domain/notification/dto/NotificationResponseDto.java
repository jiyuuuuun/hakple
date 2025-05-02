package com.golden_dobakhe.HakPle.domain.notification.dto;

import com.golden_dobakhe.HakPle.domain.notification.entity.Notification;
import com.golden_dobakhe.HakPle.domain.notification.entity.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NotificationResponseDto {
    private Long id;
    private NotificationType notificationType;
    private String message;
    private String link;
    private Boolean isRead;
    private LocalDateTime creationTime;
    private Long contentId;

    @Builder
    public NotificationResponseDto(Long id, NotificationType notificationType, String message, String link, Boolean isRead, LocalDateTime creationTime, Long contentId) {
        this.id = id;
        this.notificationType = notificationType;
        this.message = message;
        this.link = link;
        this.isRead = isRead;
        this.creationTime = creationTime;
        this.contentId = contentId;
    }

    public static NotificationResponseDto fromEntity(Notification notification) {
        return NotificationResponseDto.builder()
                .id(notification.getId())
                .notificationType(notification.getNotificationType())
                .message(notification.getMessage())
                .link(notification.getLink())
                .isRead(notification.getIsRead())
                .creationTime(notification.getCreationTime())
                .contentId(notification.getContentId())
                .build();
    }
} 