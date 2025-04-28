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
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("파일 크기는 5MB를 초과할 수 없습니다.");
        }

        String tempId = UUID.randomUUID().toString();

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
            if (file.isEmpty()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("message", "파일이 비어있습니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("message", "이미지 파일만 업로드 가능합니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            if (tempId == null || tempId.isEmpty()) {
                tempId = UUID.randomUUID().toString();
            }
            
            Map<String, Object> result = fileService.saveFileWithTempId(file, saveEntity, boardId, tempId);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "파일 업로드 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/link-to-board")
    public ResponseEntity<?> linkImagesToBoard(@RequestBody ImageUpdateRequest request) {
        try {
            fileService.cleanTempImagesNotIn(request.getTempIds(), request.getContent());

            int updatedCount = fileService.linkImagesToBoard(request.getTempIds(), request.getBoardId());
            
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
        Map<String, Object> result = fileService.saveFileWithTempId(file, true, null, tempId);
        ImageUploadResponse response = new ImageUploadResponse(tempId, (String) result.get("url"));
        return ResponseEntity.ok(response);
    }


}
