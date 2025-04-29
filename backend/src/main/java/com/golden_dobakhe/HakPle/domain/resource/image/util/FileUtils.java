package com.golden_dobakhe.HakPle.domain.resource.image.util;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class FileUtils {

    // 파일명을 난수화
    public static String createFileName(String originalFileName) {
        String extension = extractFileExtension(originalFileName);
        return UUID.randomUUID().toString().concat(extension);
    }

    // 파일 확장자 추출 (e.g., ".png")
    public static String extractFileExtension(String fileName) {
        try {
            int lastDotIndex = fileName.lastIndexOf(".");
            if (lastDotIndex < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 확장자가 없는 파일입니다: " + fileName);
            }
            return fileName.substring(lastDotIndex); // "." 포함하여 반환
        } catch (StringIndexOutOfBoundsException e) {
            // 이 예외는 lastIndexOf 로직상 거의 발생하지 않지만, 혹시 모를 경우를 대비
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 이름 분석 중 오류 발생: " + fileName);
        }
    }

    // 확장자를 기반으로 Content-Type 결정
    public static String determineContentType(String extension) {
        String ext = extension.startsWith(".") ? extension.substring(1).toLowerCase() : extension.toLowerCase();
        switch (ext) {
            case "jpeg":
            case "jpg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "gif":
                return "image/gif";
            case "bmp":
                return "image/bmp";
            case "txt":
                return "text/plain";
            case "csv":
                return "text/csv";
            // 필요한 다른 타입 추가 가능
            default:
                // 기본값 또는 알 수 없는 타입 처리
                return "application/octet-stream"; // S3 기본값과 동일하게 설정하거나, 예외 발생 가능
        }
    }
}