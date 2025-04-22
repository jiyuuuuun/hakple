package com.golden_dobakhe.HakPle.domain.resource.image.controller;

import com.golden_dobakhe.HakPle.domain.resource.image.service.ProfileImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/profile-images")
@Tag(name = "Profile Image Controller", description = "사용자 프로필 이미지 관리 API")
public class ApiV1ProfileImageController {
    private final ProfileImageService profileImageService;

    @Operation(summary = "프로필 이미지 등록/수정", description = "사용자가 자신의 프로필 사진을 업로드합니다.")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadProfileImage(
            @RequestParam("multipartFile") MultipartFile multipartFile) throws IOException {
        return ResponseEntity.ok((profileImageService.uploadProfileImage(multipartFile)));
    }

    @Operation(summary = "프로필 이미지 삭제", description = "사용자의 프로필 이미지를 삭제합니다.")
    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteProfileImage(@RequestParam String fileName) {
        profileImageService.deleteProfileImage(fileName);
        return ResponseEntity.ok(fileName);
    }
}