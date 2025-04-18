package com.golden_dobakhe.HakPle.domain.resource.image.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileService {

    @Value("${file.upload-dir:${user.home}/hakple-uploads}")
    private String uploadDir;

    @Value("${server.port}")
    private String serverPort;

    public String saveFile(MultipartFile file) {
        try {
            // 절대 경로 사용 (사용자 홈 디렉토리 기준)
            String absoluteUploadPath;
            
            // uploadDir이 상대 경로인 경우 절대 경로로 변환
            if (uploadDir.startsWith("./") || uploadDir.startsWith(".\\")) {
                // 사용자 홈 디렉토리 기반으로 변경
                String userHome = System.getProperty("user.home");
                absoluteUploadPath = userHome + "/hakple-uploads";
            } else {
                absoluteUploadPath = uploadDir;
            }
            
            Path directoryPath = Paths.get(absoluteUploadPath);
            
            // 디버깅 정보 출력
            System.out.println("업로드 디렉토리: " + directoryPath.toAbsolutePath());
            
            // 디렉토리 생성 (존재하지 않을 경우)
            Files.createDirectories(directoryPath);
            
            // 파일 이름에 UUID 추가하여 중복 방지
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String fileName = UUID.randomUUID().toString() + extension;
            Path filePath = directoryPath.resolve(fileName);

            // 디버깅 메시지 추가
            System.out.println("파일 저장 경로: " + filePath.toAbsolutePath());
            System.out.println("디렉토리 존재 여부: " + Files.exists(directoryPath));
            System.out.println("디렉토리 쓰기 권한 여부: " + Files.isWritable(directoryPath));
            
            // 파일 저장
            file.transferTo(filePath.toFile());

            // 접근 가능한 URL 형태로 변환
            String fileUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(fileName)
                    .toUriString();
                
            System.out.println("생성된 파일 URL: " + fileUrl);
            
            return fileUrl;
        } catch (IOException e) {
            System.err.println("파일 저장 오류: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("파일 저장 실패: " + e.getMessage(), e);
        }
    }
}
