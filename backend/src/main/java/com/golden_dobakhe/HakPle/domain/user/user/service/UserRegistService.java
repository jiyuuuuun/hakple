package com.golden_dobakhe.HakPle.domain.user.user.service;


import com.golden_dobakhe.HakPle.domain.user.exception.UserErrorCode;
import com.golden_dobakhe.HakPle.domain.user.exception.UserException;
import com.golden_dobakhe.HakPle.domain.user.user.WithdrawResult;
import com.golden_dobakhe.HakPle.domain.user.user.dto.UserRegistRequestDTO;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Role;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import com.golden_dobakhe.HakPle.domain.user.user.validator.NickNameValidator;
import com.golden_dobakhe.HakPle.domain.user.user.validator.PhoneNumValidator;
import com.golden_dobakhe.HakPle.domain.user.user.validator.UserNameValidator;
import com.golden_dobakhe.HakPle.global.Status;
import com.golden_dobakhe.HakPle.security.jwt.JwtTokenizer;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class UserRegistService {

    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final JwtTokenizer jwtTokenizer;
    private final PasswordEncoder passwordEncoder;

    // 회원가입 로직 (중복 확인 포함)
    public void register(UserRegistRequestDTO userRegistRequestDTO) {
        // 아이디, 닉네임, 전화번호 각각 밸리데이터 분리
        UserNameValidator.validateUserName(userRegistRequestDTO.getUserName(), userRepository);
        NickNameValidator.validateNickName(userRegistRequestDTO.getNickName(), userRepository);
        PhoneNumValidator.validatePhoneNum(userRegistRequestDTO.getPhoneNum(), userRepository);

        // User 엔티티로 변환 및 저장
        User user = User.builder()
                .userName(userRegistRequestDTO.getUserName())
                .password(passwordEncoder.encode(userRegistRequestDTO.getPassword())) // 비밀번호 암호화
                .nickName(userRegistRequestDTO.getNickName())
                .phoneNum(userRegistRequestDTO.getPhoneNum())
                .status(Status.ACTIVE) // 기본 상태 설정
                .roles(new HashSet<>(Set.of(Role.USER)))
                .build();

        userRepository.save(user);
    }


    //회원 탈퇴
    public WithdrawResult withdraw(Long userId, String rawPassword) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return WithdrawResult.USER_NOT_FOUND;
        }

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            return WithdrawResult.WRONG_PASSWORD;
        }

        user.setStatus(Status.INACTIVE);
        userRepository.save(user);
        return WithdrawResult.SUCCESS;
    }

    //로그아웃
    public void logout(String accessToken, Long userId) {
        // ✅ Access Token → 블랙리스트 등록
        try {
            long remainingTime = jwtTokenizer.getRemainingTime(accessToken);
            redisTemplate.opsForValue().set(accessToken, "logout", remainingTime, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            throw new UserException(UserErrorCode.ACCESS_TOKEN_BLACKLIST_FAIL);
        }

        // ✅ Refresh Token 삭제
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        try {
            user.setRefreshToken(null);
            userRepository.save(user);
        } catch (Exception e) {
            throw new UserException(UserErrorCode.REFRESH_TOKEN_DELETE_FAIL);
        }
    }

    // 사용자 이름 중복 확인
    public boolean isUserNameDuplicate(String userName) {
        return userRepository.existsByUserName(userName);
    }

    // 닉네임 중복 확인
    public boolean isNickNameDuplicate(String nickName) {
        return userRepository.existsByNickName(nickName);
    }

}