package com.golden_dobakhe.HakPle.domain.resource.image.controller;


import com.golden_dobakhe.HakPle.domain.resource.image.dto.ImageUpdateRequest;
import com.golden_dobakhe.HakPle.domain.resource.image.service.FileService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/images")
@Tag(name = "Images", description = "이미지 관리 API")
public class ApiV1ImageController {

    //private final AmazonS3 amazonS3; // ✅ 필드 추가
    private final FileService fileService;

    @PostMapping("/upload_local")
    public ResponseEntity<?> uploadFile1(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "saveEntity", defaultValue = "false") boolean saveEntity,
            @RequestParam(value = "boardId", required = false) Long boardId,
            @RequestParam(value = "tempId", required = false) String tempId) {
        try {
            // 파일이 비어있는지 확인
            if (file.isEmpty()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("message", "파일이 비어있습니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // 파일 형식 확인 (이미지만 허용)
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("message", "이미지 파일만 업로드 가능합니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // 만약 tempId가 제공되지 않았다면 생성
            if (tempId == null || tempId.isEmpty()) {
                tempId = UUID.randomUUID().toString();
            }
            
            // 로컬에 파일 저장 (saveEntity와 boardId 매개변수 전달)
            Map<String, Object> result = fileService.saveFileWithTempId(file, saveEntity, boardId, tempId);
            
            // 로그 출력
            System.out.println("파일 저장 경로: " + result.get("filePath"));
            System.out.println("이미지 엔티티 저장 여부: " + saveEntity);
            System.out.println("게시글 ID: " + (boardId != null ? boardId : "없음"));
            System.out.println("임시 식별자: " + tempId);
            
            // 성공 응답 반환
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            // 오류 로그 출력
            System.err.println("파일 업로드 오류: " + e.getMessage());
            e.printStackTrace();
            
            // 오류 응답 반환
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "파일 업로드 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // 임시 이미지를 게시글에 연결하는 API
    @PutMapping("/link-to-board")
    public ResponseEntity<?> linkImagesToBoard(@RequestBody ImageUpdateRequest request) {
        try {
            // tempIds와 boardId로 이미지 연결
            int updatedCount = fileService.linkImagesToBoard(request.getTempIds(), request.getBoardId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "이미지가 게시글에 연결되었습니다.");
            response.put("updatedCount", updatedCount);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "이미지 연결 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // 서버 상태 확인용 엔드포인트 추가
    @GetMapping("/health")
    public ResponseEntity<String> checkHealth() {
        return ResponseEntity.ok("OK");
    }

//    @PostMapping("/upload_S3")
//    public String uploadFile2(@RequestParam("file") MultipartFile file) {
//        String bucketName = "your-bucket";
//        String fileName = UUID.randomUUID() + "-" + file.getOriginalFilename();
//
//        ObjectMetadata metadata = new ObjectMetadata();
//        metadata.setContentLength(file.getSize());
//        metadata.setContentType(file.getContentType());
//
//        try (InputStream inputStream = file.getInputStream()) {
//            amazonS3.putObject(
//                    new PutObjectRequest(bucketName, fileName, inputStream, metadata)
//                            .withCannedAcl(CannedAccessControlList.PublicRead)
//            );
//            return amazonS3.getUrl(bucketName, fileName).toString();
//        } catch (IOException e) {
//            throw new RuntimeException("파일 업로드 실패", e);
//        }
//    }
}
