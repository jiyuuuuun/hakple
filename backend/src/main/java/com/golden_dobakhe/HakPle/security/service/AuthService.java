package com.golden_dobakhe.HakPle.security.service;
//이 부분은 테스트를 위한 것이며 추후 어딘가에 병합이 될 수 있음


import com.golden_dobakhe.HakPle.domain.resource.image.entity.Image;
import com.golden_dobakhe.HakPle.domain.resource.image.exception.ImageErrorCode;
import com.golden_dobakhe.HakPle.domain.resource.image.exception.ProfileImageException;
import com.golden_dobakhe.HakPle.domain.resource.image.repository.ImageRepository;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Role;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import com.golden_dobakhe.HakPle.global.Status;
import com.golden_dobakhe.HakPle.security.dto.LoginDto;
import com.golden_dobakhe.HakPle.security.jwt.JwtTokenizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.net.MalformedURLException;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final ImageRepository imageRepository;
    private final JwtTokenizer jwtTokenizer;
    private static final String UPLOAD_DIR = "uploads/profile/";

    @Transactional(readOnly = true)
    public Optional<User> findByIdWithRoles(Long id) {
        return userRepository.findByIdWithRoles(id);
    }

    //일단 간단하게 있는지 없는지 체크
    @Transactional(readOnly = true)
    public User findByUserName(String userName) {
        return userRepository.findByUserName(userName).get();
    }

    @Transactional(readOnly = true)
    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }

    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
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
        };


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
                .phoneNum("KA" + formattedDateTime + (int)(Math.random() * 1000) + 1)
                .status(Status.ACTIVE)
                .build();

        userRepository.save(user);
        inputSocialProfileImg(user, profileImgUrl);
        return user;
    }

    @Transactional
    public String inputSocialProfileImg(User user, String profileImgUrl) {
        // 1. 저장 경로 설정 (uploadProfileImage에서 쓰는 것과 동일)
        String uploadPath = System.getProperty("user.dir") + File.separator + UPLOAD_DIR;
        System.out.println(" 경로 : " + uploadPath);
        File uploadFolder = new File(uploadPath);
        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }
        //2. 파일명 지정
        //확장자 떼먹기
        String fileExtension = profileImgUrl.substring(profileImgUrl.lastIndexOf("."));
        String filename = UUID.randomUUID() + "_" + user.getUserName() + fileExtension;
        File destinationFile = new File(uploadFolder, filename);

        //3. 이미지 다운로드 및 저장
        try (InputStream in = new URL(profileImgUrl).openStream();
             OutputStream out = new FileOutputStream(destinationFile)) {
            byte[] buffer = new byte[2048];
            int len;
            while ((len = in.read(buffer)) != -1) {
                out.write(buffer, 0, len);
            }
        } catch (IOException e) {
            //return new ProfileImageException(ImageErrorCode.UPLOAD_FAIL);
        }

        //DB에 저장시킬 이미지 설정
        String relativePath = "/" + UPLOAD_DIR + filename;

        Image existingImage = imageRepository.findByUser(user);

        if (existingImage != null) {
            String oldFilePath = System.getProperty("user.dir") + existingImage.getFilePath();
            File oldFile = new File(oldFilePath);
            if (oldFile.exists()) {
                oldFile.delete();
            }
            existingImage.setFilePath(relativePath);
            imageRepository.save(existingImage);
        }
        // 등록
        else {
            Image newImage = Image.builder()
                    .user(user)
                    .filePath(relativePath)
                    .build();
            imageRepository.save(newImage);
            user.setProfileImage(newImage);
            userRepository.save(user);
        }
        return relativePath;
    }

    @Transactional
    public User modifyOrJoin(String username, String nickname, String profileImgUrl){
        User user = userRepository.findByUserName(username).orElse(null);

        //만약에 있다면 수정
        if (user != null) {
            inputSocialProfileImg(user, profileImgUrl);
            user.setNickName(nickname);
            return user;
        }

        //핸드폰 번호는 없다
        //소셜로그인계정으로 로그인시 아이디,비밀번호를 까먹었다면 해당 소셜 서비스에서 바꾸는게 나을듯
        //없으면 참가
        return join(username, "", nickname, profileImgUrl);
    }

}
