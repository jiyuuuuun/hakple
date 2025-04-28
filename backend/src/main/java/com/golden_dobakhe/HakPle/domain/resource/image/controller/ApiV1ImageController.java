package com.golden_dobakhe.HakPle.domain.resource.image.controller;

import com.golden_dobakhe.HakPle.domain.resource.image.dto.ImageUpdateRequest;
import com.golden_dobakhe.HakPle.domain.resource.image.dto.ImageUploadResponse;
import com.golden_dobakhe.HakPle.domain.resource.image.service.FileService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/images")
@Tag(name = "Images", description = "이미지 관리 API")
public class ApiV1ImageController {
    private final FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "boardId", required = false) Long boardId
    ) {
        // 파일 유효성 검사
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }

        // 파일 크기 제한 (5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("파일 크기는 5MB를 초과할 수 없습니다.");
        }

        // 임시 ID 생성
        String tempId = UUID.randomUUID().toString();

        // 파일 저장 및 응답
        Map<String, Object> result = fileService.saveFileWithTempId(file, true, boardId, tempId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/upload_local")
    public ResponseEntity<?> uploadLocal(
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
            
            // 로컬에 파일 저장
            Map<String, Object> result = fileService.saveFileWithTempId(file, saveEntity, boardId, tempId);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "파일 업로드 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // 임시 이미지를 게시글에 연결하는 API
    @PutMapping("/link-to-board")
    public ResponseEntity<?> linkImagesToBoard(@RequestBody ImageUpdateRequest request) {
        try {
            // 임시 이미지 중, content에 없는 이미지 삭제
            fileService.cleanTempImagesNotIn(request.getTempIds(), request.getContent());

            // temp 이미지 링크 처리 (isTemp=false, board 연결)
            int updatedCount = fileService.linkImagesToBoard(request.getTempIds(), request.getBoardId());
            
            // 수정 시: 기존 이미지 중 사용하지 않는 것 정리
            if (request.getUsedImageUrls() != null && !request.getUsedImageUrls().isEmpty()) {
                fileService.cleanUpUnused(request.getBoardId(), request.getUsedImageUrls());
            }
            
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

    @DeleteMapping("/remove-temp")
    public ResponseEntity<?> removeTemp(@RequestBody List<String> tempIds) {
        fileService.deleteTempImages(tempIds);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/health")
    public ResponseEntity<Void> checkHealth() {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload_temp")
    public ResponseEntity<ImageUploadResponse> uploadTemp(
            @RequestParam("file") MultipartFile file,
            @RequestParam("tempId") String tempId) throws IOException {
        // saveFileWithTempId 호출 (saveEntity=true, boardId=null)
        Map<String, Object> result = fileService.saveFileWithTempId(file, true, null, tempId);
        // 반환값 Map에서 필요한 정보를 추출하여 ImageUploadResponse 생성
        ImageUploadResponse response = new ImageUploadResponse(tempId, (String) result.get("url"));
        return ResponseEntity.ok(response);
    }

    // 삭제 시작
    /*
    @PostMapping("/move_to_permanent")
    public ResponseEntity<Void> moveToPermanent(@RequestParam("tempId") String tempId) {
        fileService.moveToPermanent(tempId);
        return ResponseEntity.ok().build();
    }
    */
    // 삭제 끝
}
