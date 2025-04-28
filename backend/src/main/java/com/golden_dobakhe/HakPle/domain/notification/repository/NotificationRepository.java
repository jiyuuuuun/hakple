package com.golden_dobakhe.HakPle.domain.notification.repository;

import com.golden_dobakhe.HakPle.domain.notification.entity.Notification;
import com.golden_dobakhe.HakPle.domain.notification.entity.NotificationType;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserOrderByCreationTimeDesc(User user, Pageable pageable);

    Optional<Notification> findByUserAndNotificationTypeAndLink(User user, NotificationType notificationType, String link);

    @Query(value = "SELECT COUNT(*) FROM notification WHERE user_id = :userId AND is_read = 0", nativeQuery = true)
    long countUnreadByUserIdNativeUsingZero(@Param("userId") Long userId);

} 