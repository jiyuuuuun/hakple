package com.golden_dobakhe.HakPle.domain.resource.image.controller;

import com.golden_dobakhe.HakPle.domain.resource.image.dto.ImageUpdateRequest;
import com.golden_dobakhe.HakPle.domain.resource.image.dto.ImageUploadResponse;
import com.golden_dobakhe.HakPle.domain.resource.image.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

    @Operation(summary = "이미지 업로드 (S3)", description = "S3에 이미지를 업로드하고 임시 ID와 URL을 반환합니다. 게시글 저장 시 이 임시 ID를 사용합니다.")
    @ApiResponse(responseCode = "200", description = "업로드 성공", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Map.class)))
    @ApiResponse(responseCode = "400", description = "잘못된 요청 (파일 없음, 이미지 아님, 크기 초과)")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadImage(
            @Parameter(description = "업로드할 이미지 파일") @RequestParam("file") MultipartFile file,
            @Parameter(description = "(선택) 연결할 게시글 ID", example = "1") @RequestParam(value = "boardId", required = false) Long boardId
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

    @Operation(summary = "이미지 업로드 (Local)", description = "로컬 서버에 이미지를 업로드합니다. (개발/테스트용)")
    @ApiResponse(responseCode = "200", description = "업로드 성공", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Map.class)))
    @ApiResponse(responseCode = "400", description = "잘못된 요청 (파일 없음, 이미지 아님)")
    @ApiResponse(responseCode = "500", description = "서버 오류")
    @PostMapping(value = "/upload_local", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadLocal(
            @Parameter(description = "업로드할 이미지 파일") @RequestParam("file") MultipartFile file,
            @Parameter(description = "DB에 이미지 정보 저장 여부", example = "false") @RequestParam(value = "saveEntity", defaultValue = "false") boolean saveEntity,
            @Parameter(description = "(선택) 연결할 게시글 ID", example = "1") @RequestParam(value = "boardId", required = false) Long boardId,
            @Parameter(description = "(선택) 사용할 임시 ID", example = "tempId1") @RequestParam(value = "tempId", required = false) String tempId) {
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

    @Operation(summary = "임시 이미지를 게시글에 연결", description = "요청 본문의 tempIds에 해당하는 임시 이미지들을 boardId에 해당하는 게시글에 연결합니다. content와 usedImageUrls를 사용해 사용되지 않는 이미지를 정리합니다.")
    @ApiResponse(responseCode = "200", description = "연결 성공", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Map.class)))
    @ApiResponse(responseCode = "500", description = "서버 오류")
    @PutMapping("/link-to-board")
    public ResponseEntity<?> linkImagesToBoard(@RequestBody(description = "이미지 연결 요청 정보") ImageUpdateRequest request) {
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

    @Operation(summary = "임시 이미지 삭제", description = "지정된 임시 ID 목록에 해당하는 임시 이미지들을 삭제합니다.")
    @ApiResponse(responseCode = "200", description = "삭제 성공")
    @ApiResponse(responseCode = "500", description = "서버 오류")
    @DeleteMapping("/remove-temp")
    public ResponseEntity<?> removeTemp(@RequestBody(description = "삭제할 임시 이미지 ID 목록") List<String> tempIds) {
        fileService.deleteTempImages(tempIds);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "API 상태 확인", description = "API 서버의 상태를 확인합니다.")
    @ApiResponse(responseCode = "200", description = "서버 정상 동작")
    @GetMapping("/health")
    public ResponseEntity<Void> checkHealth() {
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "임시 이미지 업로드 (개별)", description = "개별 임시 이미지를 업로드하고 임시 ID와 URL을 반환합니다. (에디터 등에서 사용)")
    @ApiResponse(responseCode = "200", description = "업로드 성공", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ImageUploadResponse.class)))
    @ApiResponse(responseCode = "400", description = "잘못된 요청 (파일 없음, 이미지 아님)")
    @ApiResponse(responseCode = "500", description = "서버 오류")
    @PostMapping(value = "/upload_temp", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponse> uploadTemp(
            @Parameter(description = "업로드할 이미지 파일") @RequestParam("file") MultipartFile file,
            @Parameter(description = "사용할 임시 ID", example = "tempId1", required = true) @RequestParam("tempId") String tempId) throws IOException {
        Map<String, Object> result = fileService.saveFileWithTempId(file, true, null, tempId);
        ImageUploadResponse response = new ImageUploadResponse(tempId, (String) result.get("url"));
        return ResponseEntity.ok(response);
    }


}
