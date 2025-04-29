package com.golden_dobakhe.HakPle.domain.notification.service;

import com.golden_dobakhe.HakPle.domain.notification.dto.NotificationResponseDto;
import com.golden_dobakhe.HakPle.domain.notification.entity.Notification;
import com.golden_dobakhe.HakPle.domain.notification.entity.NotificationType;
import com.golden_dobakhe.HakPle.domain.notification.repository.NotificationRepository;
import com.golden_dobakhe.HakPle.domain.post.post.entity.Board; // 중복 알림 확인용 (임시)
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) 
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional 
    public Notification createNotification(User recipient, NotificationType type, String message, String link) {
        Notification notification = Notification.builder()
                .user(recipient)
                .notificationType(type)
                .message(message)
                .link(link)
                .isRead(false)
                .build();
        return notificationRepository.save(notification);
    }

    
    public Page<NotificationResponseDto> getMyNotifications(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + userId));
        Page<Notification> notificationPage = notificationRepository.findByUserOrderByCreationTimeDesc(user, pageable);
        return notificationPage.map(NotificationResponseDto::fromEntity);
    }

    public long getUnreadNotificationCount(Long userId) {
        long count = notificationRepository.countUnreadByUserIdNativeUsingZero(userId); 
        return count;
    }

   
    public boolean hasPopularPostNotification(Board board) {
        User user = board.getUser();
        String popularLink = "/post/" + board.getId(); 
        return notificationRepository.findByUserAndNotificationTypeAndLink(
                user, NotificationType.POPULAR_POST, popularLink).isPresent();
    }

    @Transactional 
    public void markNotificationAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("알림을 찾을 수 없습니다: " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("자신의 알림만 읽음 처리할 수 있습니다.");
        }

        if (Boolean.TRUE.equals(notification.getIsRead())) {
            return;
        }

        notification.markAsRead(); 
    }
} 