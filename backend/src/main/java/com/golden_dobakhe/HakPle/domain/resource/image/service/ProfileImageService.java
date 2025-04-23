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

    // 파일명을 난수화하기 위해 UUID 를 활용하여 난수를 돌린다.
    public String createFileName(String fileName) {
        return UUID.randomUUID().toString().concat(getFileExtension(fileName));
    }

    //  "."의 존재 유무만 판단
    private String getFileExtension(String fileName) {
        try {
            //파일 형식 구하기
            String ext = fileName.split("\\.")[1];
//        String ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();

            String contentType = "";
            //content type을 지정해서 올려주지 않으면 자동으로 "application/octet-stream"으로 고정이 되서 링크 클릭시 웹에서 열리는게 아니라 자동 다운이 시작됨.
            switch (ext) {
                case "jpeg":
                    contentType = "image/jpeg";
                    break;
                case "png":
                    contentType = "image/png";
                    break;
                case "txt":
                    contentType = "text/plain";
                    break;
                case "csv":
                    contentType = "text/csv";
                    break;
            }
            return contentType;
        } catch (StringIndexOutOfBoundsException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "잘못된 형식의 파일" + fileName + ") 입니다.");
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

        String fileName = createFileName(multipartFile.getOriginalFilename());

        try {
            ObjectMetadata objectMetadata = new ObjectMetadata();
            objectMetadata.setContentType(fileName);

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
                .user(user)
                .build();
        imageRepository.save(newImage);
        user.setProfileImage(newImage);
        userRepository.save(user);

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