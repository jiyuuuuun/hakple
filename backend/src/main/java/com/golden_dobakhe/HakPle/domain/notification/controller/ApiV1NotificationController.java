package com.golden_dobakhe.HakPle.domain.notification.controller;

import com.golden_dobakhe.HakPle.domain.notification.dto.NotificationResponseDto;
import com.golden_dobakhe.HakPle.domain.notification.service.NotificationService;
import com.golden_dobakhe.HakPle.security.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "알림 관리 API")
public class ApiV1NotificationController {

    private final NotificationService notificationService;

    private Long getCurrentUserId() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            throw new AccessDeniedException("로그인이 필요합니다");
        }
        return userId;
    }

    @GetMapping("/my")
    @Operation(summary = "내 알림 목록 조회", description = "현재 로그인한 사용자의 알림 목록을 페이징하여 조회합니다.")
    public ResponseEntity<Page<NotificationResponseDto>> getMyNotifications(
            Pageable pageable
    ) {
        Long userId = getCurrentUserId();
        Page<NotificationResponseDto> notifications = notificationService.getMyNotifications(userId, pageable);
        return ResponseEntity.ok(notifications);
    }

    @PatchMapping("/my/{id}/read")
    @Operation(summary = "알림 읽음 처리", description = "특정 알림을 읽음 상태로 변경합니다.")
    public ResponseEntity<Void> markNotificationAsRead(@PathVariable(name = "id") Long id) {
        Long userId = getCurrentUserId();
        notificationService.markNotificationAsRead(id, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my/unread-count")
    @Operation(summary = "읽지 않은 알림 개수 조회", description = "현재 로그인한 사용자의 읽지 않은 알림 개수를 조회합니다.")
    public ResponseEntity<Map<String, Long>> getUnreadNotificationCount() {
        Long userId = getCurrentUserId();
        long count = notificationService.getUnreadNotificationCount(userId);
        Map<String, Long> response = Map.of("unreadCount", count);
        return ResponseEntity.ok(response);
    }
}
