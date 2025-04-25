package com.golden_dobakhe.HakPle.domain.resource.image.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@RequiredArgsConstructor
public class ImageCleanupScheduler {
    private final FileService fileService;
    private static final Logger log = LoggerFactory.getLogger(ImageCleanupScheduler.class);

    @Scheduled(cron = "0 0 3 * * ?") // 매일 새벽 3시에 실행
    public void cleanupImages() {
        log.info("Executing scheduled task to cleanup expired images.");
        fileService.cleanupExpiredTemporaryImages(); // 메서드 이름 변경
        log.info("Finished scheduled task to cleanup expired images.");
    }
} 