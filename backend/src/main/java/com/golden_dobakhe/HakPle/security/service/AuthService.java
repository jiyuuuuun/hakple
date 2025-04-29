package com.golden_dobakhe.HakPle.security.service;
//이 부분은 테스트를 위한 것이며 추후 어딘가에 병합이 될 수 있음


import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.golden_dobakhe.HakPle.domain.resource.image.entity.Image;
import com.golden_dobakhe.HakPle.domain.resource.image.exception.ImageErrorCode;
import com.golden_dobakhe.HakPle.domain.resource.image.exception.ProfileImageException;
import com.golden_dobakhe.HakPle.domain.resource.image.repository.ImageRepository;
import com.golden_dobakhe.HakPle.domain.resource.image.util.FileUtils;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Role;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import com.golden_dobakhe.HakPle.global.Status;
import com.golden_dobakhe.HakPle.security.dto.LoginDto;
import com.golden_dobakhe.HakPle.security.jwt.JwtTokenizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.*;
import java.net.MalformedURLException;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AuthService {

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    private final UserRepository userRepository;
    private final ImageRepository imageRepository;
    private final JwtTokenizer jwtTokenizer;
    private final AmazonS3 amazonS3;

    public Optional<User> findByIdWithRoles(Long id) {
        return userRepository.findByIdWithRoles(id);
    }

    //일단 간단하게 있는지 없는지 체크
    public User findByUserName(String userName) {
        return userRepository.findByUserName(userName).get();
    }

    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }

    public String genAccessToken(User user) {
        return jwtTokenizer.createAccessToken(
                user.getId(),
                user.getUserName(),
                user.getNickName(),
                user.getPhoneNum(),
                user.getStatus(),
                user.getRoles(),
                user.getAcademyId()
        );
    }

    public String genRefreshToken(User user) {
        return jwtTokenizer.createRefreshToken(
                user.getId(),
                user.getUserName(),
                user.getNickName(),
                user.getPhoneNum(),
                user.getStatus(),
                user.getRoles(),
                user.getAcademyId()
        );
    }

    @Transactional
    public void addRefreshToken(User user, String refreshToken) {
        user.setRefreshToken(refreshToken);
        userRepository.save(user);
    }

    //소셜로그인에 가입한 유저를 새로 만들기
    @Transactional
    public User join(String username, String password, String nickname, String profileImgUrl) {

        if (userRepository.existsByUserName(username)) {
            throw new RuntimeException("해당 username은 이미 사용중입니다.");
        }

        Date currentDate = new Date();
        //전화번호 난수 추가
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyMMddmmss");
        String formattedDateTime = dateFormat.format(currentDate);
        //나중에 프사 추가 하십셔
        User user = User.builder()
                .userName(username)
                .password(password)
                .nickName(nickname)
                .socialProvider("kakao")
                .roles(new HashSet<>(Set.of(Role.USER)))
                .phoneNum("KA" + formattedDateTime + (int) (Math.random() * 1000) + 1)
                .status(Status.ACTIVE)
                .build();

        userRepository.save(user);
        inputSocialProfileImage(user, profileImgUrl);
        return user;
    }

    private File downloadFileFromUrl(String fileUrl) throws IOException {
        File tempFile = File.createTempFile("profile", ".tmp");
        try (InputStream inputStream = new URL(fileUrl).openStream();
             FileOutputStream outputStream = new FileOutputStream(tempFile)) {

            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
            outputStream.flush();
        }
        return tempFile;
    }

    private void uploadFileToS3(File file, String s3Key, String contentType) throws IOException {
        try (InputStream inputStream = new FileInputStream(file)) {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(contentType);
            metadata.setContentLength(file.length());

            amazonS3.putObject(new PutObjectRequest(bucket, s3Key, inputStream, metadata)
                    .withCannedAcl(CannedAccessControlList.PublicRead));
        }
    }

    @Transactional
    public String inputSocialProfileImage(User user, String profileImgUrl) {
        User userProfile = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 없음"));

        // 1. 원본 파일명에서 확장자 추출 (url에서 확장자 뽑기)
        String originalFileName = profileImgUrl.substring(profileImgUrl.lastIndexOf("/") + 1); // 파일명만 추출
        String fileExtension = FileUtils.extractFileExtension(originalFileName);
        String contentType = FileUtils.determineContentType(fileExtension); // Content-Type 얻기
        String fileName = FileUtils.createFileName(originalFileName); // UUID_형식으로 파일명 생성
        String permanentS3Key = "kakoProfile/" + user.getId() + "/" + fileName;

        // 2. 기존 이미지 삭제
        Image existingImage = userProfile.getProfileImage();
        if (existingImage != null) {
            deleteS3Image(existingImage.getFilePath());
            imageRepository.delete(existingImage);
            userProfile.setProfileImage(null);
        }

        // 3. S3 업로드
        Long imageSize;
        File tempfile = null;
        try {
            tempfile = downloadFileFromUrl(profileImgUrl);

            //파일이 없는건 프사가 없는거겠지
            if (tempfile.length() == 0)
                return null;
//            if (tempfile.length() == 0) {
//                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "다운로드한 프로필 이미지가 비어 있습니다.");
//            }
            imageSize = tempfile.length();
            uploadFileToS3(tempfile, permanentS3Key, contentType);

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "임시 파일 생성 실패", e);
        } finally {
            tempfile.delete();
        }


        // 4. S3 저장 URL 얻기
        String kakaoProfileImageUrl = amazonS3.getUrl(bucket, permanentS3Key).toString();

        // 5. DB 저장
        Image newImage = Image.builder()
                .filePath(kakaoProfileImageUrl)
                .isTemp(false) // 임시 파일 플래그
                .path(permanentS3Key)
                .originalName(originalFileName)
                .storedName(permanentS3Key)
                .contentType(contentType)
                .size(imageSize)
                .isDeleted(false)
                .user(userProfile)
                .build();
        imageRepository.save(newImage);
        userProfile.setProfileImage(newImage);
//        userRepository.save(userProfile);

        return kakaoProfileImageUrl;
    }

    private void deleteS3Image(String fileName) {
        try {
            String key = fileName.contains(".com/") ? fileName.split(".com/")[1] : fileName;
            amazonS3.deleteObject(bucket, key);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "S3 이미지 삭제 실패");
        }
    }

    @Transactional
    public User modifyOrJoin(String username, String nickname, String profileImgUrl) {
        User user = userRepository.findByUserName(username).orElse(null);

        //만약에 있다면 수정
        if (user != null) {
            inputSocialProfileImage(user, profileImgUrl);
            user.setNickName(nickname);
            return user;
        }

        //핸드폰 번호는 없다
        //소셜로그인계정으로 로그인시 아이디,비밀번호를 까먹었다면 해당 소셜 서비스에서 바꾸는게 나을듯
        //없으면 참가
        return join(username, "", nickname, profileImgUrl);
    }
}
