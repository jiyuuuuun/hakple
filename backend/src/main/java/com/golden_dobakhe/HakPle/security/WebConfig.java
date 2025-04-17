package com.golden_dobakhe.HakPle.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:${user.home}/hakple-uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 상대 경로를 절대 경로로 변환
        String absoluteUploadPath;
        if (uploadDir.startsWith("./") || uploadDir.startsWith(".\\")) {
            // 사용자 홈 디렉토리 기반으로 변경
            String userHome = System.getProperty("user.home");
            absoluteUploadPath = userHome + "/hakple-uploads";
        } else {
            absoluteUploadPath = uploadDir;
        }
        
        // file: 프로토콜로 시작하는지 확인!
        String location = absoluteUploadPath.startsWith("file:") ? 
            absoluteUploadPath : "file:" + absoluteUploadPath + "/";
            
        // 디버깅 정보 출력
        System.out.println("정적 리소스 매핑: /uploads/** -> " + location);
            
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location)
                .setCachePeriod(3600); // 캐싱 기간 설정 (초 단위)
    }
}

