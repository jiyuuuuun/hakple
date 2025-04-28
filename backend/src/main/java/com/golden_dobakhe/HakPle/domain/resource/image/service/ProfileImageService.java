package com.golden_dobakhe.HakPle.domain.resource.image.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.golden_dobakhe.HakPle.domain.resource.image.entity.Image;
import com.golden_dobakhe.HakPle.domain.resource.image.repository.ImageRepository;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileImageService {

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    private final ImageRepository imageRepository;
    private final UserRepository userRepository;

    private final AmazonS3 amazonS3;

    // 파일명을 난수화
    public String createFileName(String originalFileName) {
        String extension = extractFileExtension(originalFileName);
        return UUID.randomUUID().toString().concat(extension);
    }

    // 파일 확장자 추출 (e.g., ".png")
    private String extractFileExtension(String fileName) {
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
    private String determineContentType(String extension) {
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

    @Transactional
    public String uploadProfileImage(String userName, MultipartFile multipartFile) {
        User user = userRepository.findByUserName(userName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 없음"));

        // 기존 이미지가 있다면 삭제
        Image existingImage = user.getProfileImage();
        if (existingImage != null) {
            deleteS3Image(existingImage.getFilePath());
            imageRepository.delete(existingImage);
            user.setProfileImage(null);
        }

        String originalFilename = multipartFile.getOriginalFilename();
        String fileExtension = extractFileExtension(originalFilename);
        String contentType = determineContentType(fileExtension);
        String fileName = createFileName(originalFilename);

        try {
            ObjectMetadata objectMetadata = new ObjectMetadata();
            objectMetadata.setContentLength(multipartFile.getSize());
            objectMetadata.setContentType(contentType);

            //S3에 파일 업로드
            amazonS3.putObject(new PutObjectRequest(bucket, fileName, multipartFile.getInputStream(), objectMetadata)
                    .withCannedAcl(CannedAccessControlList.PublicRead));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다.");
        }

        //db에 새 이미지 저장
        String profileImageUrl = amazonS3.getUrl(bucket, fileName).toString();
        Image newImage = Image.builder()
                .filePath(profileImageUrl)
                .path(fileName)
                .originalName(originalFilename)
                .storedName(fileName)
                .contentType(contentType)
                .size(multipartFile.getSize())
                .isDeleted(false)
                .isTemp(true) // 임시 파일 플래그
                .user(user)
                .build();

        imageRepository.save(newImage);
        user.setProfileImage(newImage);

        return profileImageUrl;
    }

    // 프로필 사진 삭제
    @Transactional
    public void deleteProfileImage(String userName) {
        User user = userRepository.findByUserName(userName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 없음"));

        Image existingImage = user.getProfileImage();
        if (existingImage != null) {
            deleteS3Image(existingImage.getFilePath());

            imageRepository.delete(existingImage);
            user.setProfileImage(null);
            userRepository.save(user);
        }
    }

    private void deleteS3Image(String fileName) {
        try {
            String key = fileName.contains(".com/") ? fileName.split(".com/")[1] : fileName;
            amazonS3.deleteObject(bucket, key);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "S3 이미지 삭제 실패");
        }
    }
}

