package com.golden_dobakhe.HakPle.domain.resource.image.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.golden_dobakhe.HakPle.domain.resource.image.entity.Image;
import com.golden_dobakhe.HakPle.domain.resource.image.repository.ImageRepository;
import com.golden_dobakhe.HakPle.domain.resource.image.util.FileUtils;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import java.io.IOException;
import java.time.LocalDateTime;
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

        String originalFileName = multipartFile.getOriginalFilename();
        String fileExtension = FileUtils.extractFileExtension(originalFileName);
        String contentType = FileUtils.determineContentType(fileExtension);
        String fileName = FileUtils.createFileName(originalFileName);
        String permanentS3Key = "profile/" + user.getId() + "/" + fileName;

        try {
            ObjectMetadata objectMetadata = new ObjectMetadata();
            objectMetadata.setContentLength(multipartFile.getSize());
            objectMetadata.setContentType(contentType);

            //S3에 파일 업로드
            amazonS3.putObject(
                    new PutObjectRequest(bucket, permanentS3Key, multipartFile.getInputStream(), objectMetadata)
                            .withCannedAcl(CannedAccessControlList.PublicRead));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다.");
        }

        //db에 새 이미지 저장
        String profileImageUrl = amazonS3.getUrl(bucket, permanentS3Key).toString();
        Image newImage = Image.builder()
                .filePath(profileImageUrl)
                .isTemp(false) // 임시 파일 플래그
                .path(permanentS3Key)
                .originalName(originalFileName)
                .storedName(permanentS3Key)
                .contentType(contentType)
                .size(multipartFile.getSize())
                .isDeleted(false)
                .isTemp(true) // 임시 파일 플래그
                .user(user)
                .modificationTime(LocalDateTime.now())
                .build();

        imageRepository.save(newImage);
        user.setProfileImage(newImage);
//        userRepository.save(user);

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
            user.setModificationTime(LocalDateTime.now());
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