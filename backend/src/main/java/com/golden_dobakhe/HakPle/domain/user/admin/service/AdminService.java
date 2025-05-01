package com.golden_dobakhe.HakPle.domain.user.admin.service;

import com.golden_dobakhe.HakPle.domain.post.comment.CommentResult;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.Comment;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.repository.CommentRepository;
import com.golden_dobakhe.HakPle.domain.post.comment.exception.CommentException;
import com.golden_dobakhe.HakPle.domain.post.post.dto.TotalBoardResponse;
import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.post.post.exception.BoardException;
import com.golden_dobakhe.HakPle.domain.post.post.repository.BoardRepository;
import com.golden_dobakhe.HakPle.domain.user.admin.dto.AcademyRequestDto;
import com.golden_dobakhe.HakPle.domain.user.admin.dto.AcademyWithUserCountDto;
import com.golden_dobakhe.HakPle.domain.user.admin.dto.AdminLoginDto;
import com.golden_dobakhe.HakPle.domain.user.admin.dto.AdminRegisterDto;
import com.golden_dobakhe.HakPle.domain.user.admin.dto.AdminUserListDto;
import com.golden_dobakhe.HakPle.domain.user.admin.dto.UserListDto;
import com.golden_dobakhe.HakPle.domain.user.exception.UserErrorCode;
import com.golden_dobakhe.HakPle.domain.user.exception.UserException;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Academy;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Role;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.AcademyRepository;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import com.golden_dobakhe.HakPle.global.Status;
import com.golden_dobakhe.HakPle.security.jwt.JwtTokenizer;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenizer jwtTokenizer;
    private final AcademyRepository academyRepository;
    private final BoardRepository boardRepository;
    private final CommentRepository commentRepository;

    @Transactional
    public String registerAdmin(AdminRegisterDto dto) {
        if (userRepository.existsByUserName(dto.getUserName())) {
            throw new UserException(UserErrorCode.USERNAME_DUPLICATE);
        }
        // 전화번호 중복 확인
        if (userRepository.existsByPhoneNum(dto.getPhoneNumber())) {
            throw new UserException(UserErrorCode.PHONENUM_DUPLICATE);
        }

        User admin = User.builder()
                .userName(dto.getUserName())
                .password(passwordEncoder.encode(dto.getPassword()))
                .nickName("관리자")
                .phoneNum(dto.getPhoneNumber())
                .roles(new HashSet<>(Set.of(Role.ADMIN)))
                .status(Status.ACTIVE)
                .academyId("ADMIN") //관리자 학원코드 임의로 넣기 게시물 보려면 학원 코드 있어야함  , null 만 아니면 되므로
                .build();

        userRepository.save(admin);
        return "관리자 등록 완료";
    }

    @Transactional
    public Map<String, String> loginAdmin(AdminLoginDto dto) {
        User admin = userRepository.findByUserName(dto.getUserName())
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(dto.getPassword(), admin.getPassword())) {
            throw new UserException(UserErrorCode.WRONG_CURRENT_PASSWORD);
        }

        if (!admin.getRoles().contains(Role.ADMIN)) {
            throw new UserException(UserErrorCode.FORBIDDEN);
        }

        String accessToken = jwtTokenizer.createAccessToken(
                admin.getId(),
                admin.getUserName(),
                admin.getNickName(),
                admin.getPhoneNum(),
                admin.getStatus(),
                admin.getRoles(),
                admin.getAcademyId()
        );

        String refreshToken = jwtTokenizer.createRefreshToken(
                admin.getId(),
                admin.getUserName(),
                admin.getNickName(),
                admin.getPhoneNum(),
                admin.getStatus(),
                admin.getRoles(),
                admin.getAcademyId()
        );

        // RefreshToken 저장
        admin.setRefreshToken(refreshToken);
        userRepository.save(admin);

        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken
        );
    }

    private String generateAcademyCode(String phoneNum) {
        // 전화번호 뒷자리 4자리 추출
        String phoneSuffix = phoneNum.replaceAll("\\D", ""); // 숫자만 남기기
        if (phoneSuffix.length() < 4) {
            throw new IllegalArgumentException("전화번호가 너무 짧습니다.");
        }
        phoneSuffix = phoneSuffix.substring(phoneSuffix.length() - 4); // 마지막 4자리

        String prefix = getRandomLetters(3);
        String suffix = getRandomLetters(3);

        return prefix + phoneSuffix + suffix;
    }

    private String getRandomLetters(int length) {
        return new Random().ints('A', 'Z' + 1)
                .limit(length)
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString();
    }

    //학원 생성
    @Transactional
    public String createAcademy(AcademyRequestDto requestDto) {
        String code = generateAcademyCode(requestDto.getPhone());

        // 중복 방지 로직
        while (academyRepository.existsByAcademyCode(code)) {
            code = generateAcademyCode(requestDto.getPhone());
        }

        Academy academy = Academy.builder()
                .academyName(requestDto.getName())
                .phoneNum(requestDto.getPhone())
                .academyCode(code)
                .build();

        academyRepository.save(academy);
        return code;
    }

    //게시물 삭제 처리
    @Transactional
    public void setBoardPending(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> BoardException.notFound("해당 게시물이 존재하지 않습니다"));
        board.setStatus(Status.PENDING);
        board.setModificationTime(LocalDateTime.now());
    }

    //댓글 삭제 처리
    @Transactional
    public void setCommentPending(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentException(CommentResult.COMMENT_NOT_FOUND));
        comment.setStatus(Status.PENDING);
        comment.setModificationTime(LocalDateTime.now());
    }

    //관리자 목록 조회
    public Page<AdminUserListDto> getAdminUsers(Pageable pageable) {
        return userRepository.findAllByRoles(Role.ADMIN, pageable)
                .map(AdminUserListDto::new);
    }

    //등록되어 있는 학원 조회, 학원 별 사용 자 수
    public Page<AcademyWithUserCountDto> getAcademyListWithUserCounts(Pageable pageable) {
        return academyRepository.findAllAcademiesWithUserCount(pageable);
    }

    public Page<TotalBoardResponse> getBoardsByFilterNullable(Status status, String academyCode, Pageable pageable) {
        Page<Board> boards;

        if (status != null && academyCode != null) {
            boards = boardRepository.findByStatusAndAcademyCode(status, academyCode, pageable);
        } else if (status != null) {
            boards = boardRepository.findByStatus(status, pageable);
        } else if (academyCode != null) {
            boards = boardRepository.findByAcademyCode(academyCode, pageable);
        } else {
            boards = boardRepository.findAll(pageable); // 전체 조회
        }

        return boards.map(TotalBoardResponse::from);
    }


    /**
     * 학원 코드로 학원 정보 조회
     *
     * @param academyCode 학원 코드
     * @return 학원 정보
     */
    public Academy getAcademyByCode(String academyCode) {
        return academyRepository.findByAcademyCode(academyCode)
                .orElseThrow(() -> new UserException(UserErrorCode.ACADEMY_ID_NOT_FOUND));
    }

    //회원 목록 조회
    public Page<UserListDto> getUser(Pageable pageable) {
        Page<User> userList = userRepository.findAllUserByRoles(Role.USER, pageable);

        if (userList.isEmpty()) {
            throw new UserException(UserErrorCode.USER_NOT_FOUND);
        }

        return userList.map(user -> {
            String academyName;
            if (user.getAcademyId() != null) {
                Academy academy = academyRepository.findByAcademyCode(user.getAcademyId())
                        .orElse(null);
                academyName = (academy != null) ? academy.getAcademyName() : "학원 정보 없음";
            } else {
                academyName = "학원 정보 없음";
            }
            return new UserListDto(user, academyName);
        });
    }


    //회원 상태 바꾸기
    @Transactional
    public void changeUserStatus(Long userId, Status status) {
        User user = userRepository.findById(userId).orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
        user.setStatus(status);
        user.setModificationTime(LocalDateTime.now());
    }

}
