package com.golden_dobakhe.HakPle.domain.post.post.service.impl;


import com.golden_dobakhe.HakPle.domain.post.comment.comment.repository.CommentRepository;
import com.golden_dobakhe.HakPle.domain.post.post.dto.BoardRequest;
import com.golden_dobakhe.HakPle.domain.post.post.dto.BoardResponse;
import com.golden_dobakhe.HakPle.domain.post.post.dto.TagResponse;
import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.post.post.entity.BoardLike;
import com.golden_dobakhe.HakPle.domain.post.post.entity.BoardReport;
import com.golden_dobakhe.HakPle.domain.post.post.entity.Hashtag;
import com.golden_dobakhe.HakPle.domain.post.post.entity.TagMapping;
import com.golden_dobakhe.HakPle.domain.post.post.exception.BoardException;
import com.golden_dobakhe.HakPle.domain.post.post.repository.BoardLikeRepository;
import com.golden_dobakhe.HakPle.domain.post.post.repository.BoardReportRepository;
import com.golden_dobakhe.HakPle.domain.post.post.repository.BoardRepository;
import com.golden_dobakhe.HakPle.domain.post.post.repository.HashtagRepository;
import com.golden_dobakhe.HakPle.domain.post.post.repository.TagMappingRepository;
import com.golden_dobakhe.HakPle.domain.post.post.service.BoardService;
import com.golden_dobakhe.HakPle.domain.resource.image.entity.Image;
import com.golden_dobakhe.HakPle.domain.resource.image.repository.ImageRepository;
import com.golden_dobakhe.HakPle.domain.user.exception.UserErrorCode;
import com.golden_dobakhe.HakPle.domain.user.exception.UserException;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Role;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import com.golden_dobakhe.HakPle.global.Status;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;

@Service
@Transactional
@RequiredArgsConstructor
public class BoardServiceImpl implements BoardService {

    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final HashtagRepository hashtagRepository;
    private final TagMappingRepository tagMappingRepository;
    private final BoardLikeRepository boardLikeRepository;
    private final BoardReportRepository boardReportRepository;
    private final ImageRepository imageRepository;
    private final CommentRepository commentRepository;
    private static final Logger log = LoggerFactory.getLogger(BoardServiceImpl.class);

    @Override
    @Transactional
    public BoardResponse createBoard(BoardRequest request, Long userId, String academyCode) {
        validateBoardRequest(request);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BoardException.notFound());

        // academyCode 처리 로직 수정
        // 1. 요청 객체(request)의 academyCode를 먼저 확인
        // 2. URL 파라미터의 academyCode 확인
        // 3. 없으면 사용자의 academyId 사용
        String resolvedAcademyCode;

        // 요청 객체에 academyCode가 포함되어 있는지 확인
        if (request.getAcademyCode() != null && !request.getAcademyCode().isEmpty()) {
            resolvedAcademyCode = request.getAcademyCode();
            log.info("사용자 요청 academyCode 사용: {}", resolvedAcademyCode);
        }
        // URL 파라미터로 전달된 academyCode 확인
        else if (academyCode != null && !academyCode.isEmpty()) {
            resolvedAcademyCode = academyCode;
            log.info("URL 파라미터 academyCode 사용: {}", resolvedAcademyCode);
        }
        // 사용자의 기본 academyId 사용
        else {
            resolvedAcademyCode = user.getAcademyId();
            log.info("사용자 기본 academyCode 사용: {}", resolvedAcademyCode);
        }

        Board board = Board.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .academyCode(resolvedAcademyCode)
                .user(user)
                .status(Status.ACTIVE)
                .modificationTime(null)
                .type(request.getType())
                .build();

        board = boardRepository.save(board);

        if (request.getTags() != null) {
            for (String tagName : request.getTags()) {
                if (!StringUtils.hasText(tagName)) {
                    continue;
                }

                // 해시태그 처리 로직을 별도의 트랜잭션으로 분리하여 안전하게 처리
                try {
                    Hashtag hashtag = getOrCreateHashtag(tagName, resolvedAcademyCode);

                    // 해시태그가 성공적으로 조회/생성된 경우에만 매핑 생성
                    if (hashtag != null && hashtag.getId() != null) {
                        TagMapping tagMapping = TagMapping.builder()
                                .board(board)
                                .hashtag(hashtag)
                                .build();

                        board.getTags().add(tagMapping);
                        tagMappingRepository.save(tagMapping);
                    }
                } catch (Exception e) {
                    log.error("해시태그 처리 중 예외 발생: {}", e.getMessage(), e);
                    // 한 태그에서 오류가 발생해도 다른 태그는 계속 처리
                }
            }
        }

        List<String> imageUrls = extractImageUrls(request.getContent());
        for (String imageUrl : imageUrls) {
            Image postFile = Image.builder()
                    .board(board)
                    .filePath(imageUrl)
                    .build();
            imageRepository.save(postFile);
        }

        return createBoardResponse(board);
    }

    @Override
    @Transactional
    public BoardResponse createBoard(BoardRequest request, Long userId) {
        return createBoard(request, userId, null);
    }

    @Override
    @Transactional
    public BoardResponse getBoard(Long id, Boolean postView, String academyCode) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> BoardException.notFound());

        // academyCode 유효성 검사 - 제공된 academyCode와 게시글의 academyCode가 일치하는지 확인
        if (academyCode != null && !academyCode.isEmpty() && !academyCode.equals(board.getAcademyCode())) {
            // 로깅 추가
            log.info("제공된 academyCode: {}, 게시글의 academyCode: {}", academyCode, board.getAcademyCode());
        }

        // 사용자 닉네임 초기화 (지연 로딩)
        board.getUser().getNickName();

        // 게시글 좋아요 초기화 (지연 로딩)
        Hibernate.initialize(board.getBoardLikes());

        // 조회수 증가 처리 (요청으로부터 옵션을 받음)
        if (postView == null || postView) {
            board.increaseViewCount();
        }

        // 게시글 상태 검증 (삭제된 게시글인지 확인)
        //board.validateStatus(); 신고된 게시물에서도 불러와야 하므로 비활성화
        //게시물 목록에서 불러올 때 이미 Active인 게시물 만 볼러와지니깐 괜춘..?
        boardRepository.save(board);

        return createBoardResponse(board);
    }

    @Override
    @Transactional
    public BoardResponse getBoard(Long id, Boolean postView) {
        return getBoard(id, postView, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> getBoards(String academyCode, String sortType, Pageable pageable) {
        if (!StringUtils.hasText(academyCode)) {
            throw BoardException.invalidRequest();
        }

        if (!StringUtils.hasText(sortType)) {
            sortType = "등록일순";
        }

        // 자유게시판용 메서드로 변경 - notice 타입이 아닌 게시글만 조회
        return boardRepository.findByAcademyCodeAndStatusExcludeNotice(academyCode, Status.ACTIVE, sortType, null, pageable)
                .map(board -> {
                    Hibernate.initialize(board.getBoardLikes());
                    return createBoardResponse(board);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> searchBoards(String academyCode, String keyword, String sortType, Pageable pageable) {
        if (!StringUtils.hasText(academyCode) || !StringUtils.hasText(keyword)) {
            throw BoardException.invalidRequest();
        }
        // 제목 또는 작성자 이름으로 검색합니다.
        // 내용 검색을 원하면 searchType=제목으로 별도 검색 바람
        return boardRepository.searchBoards(academyCode, keyword, sortType, null, "free", pageable)
                .map(board -> {
                    Hibernate.initialize(board.getBoardLikes());
                    return createBoardResponse(board);
                });
    }

    @Override
    @Transactional
    public BoardResponse updateBoard(Long id, BoardRequest request, Long userId, String academyCode) {
        validateBoardRequest(request);

        Board board = boardRepository.findById(id)
                .orElseThrow(() -> BoardException.notFound());

        board.validateUser(userId);
        board.validateStatus();
        board.update(request.getTitle(), request.getContent(), request.getType());

        board.getTags().clear();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BoardException.notFound());

        // academyCode 처리 로직 수정
        // 1. 요청 객체(request)의 academyCode를 먼저 확인
        // 2. URL 파라미터의 academyCode 확인
        // 3. 없으면 사용자의 academyId 사용
        String resolvedAcademyCode;

        // 요청 객체에 academyCode가 포함되어 있는지 확인
        if (request.getAcademyCode() != null && !request.getAcademyCode().isEmpty()) {
            resolvedAcademyCode = request.getAcademyCode();
            log.info("수정 - 사용자 요청 academyCode 사용: {}", resolvedAcademyCode);
        }
        // URL 파라미터로 전달된 academyCode 확인
        else if (academyCode != null && !academyCode.isEmpty()) {
            resolvedAcademyCode = academyCode;
            log.info("수정 - URL 파라미터 academyCode 사용: {}", resolvedAcademyCode);
        }
        // 사용자의 기본 academyId 사용
        else {
            resolvedAcademyCode = user.getAcademyId();
            log.info("수정 - 사용자 기본 academyCode 사용: {}", resolvedAcademyCode);
        }

        // 게시글의 academyCode도 업데이트 필요한 경우 처리
        if (!board.getAcademyCode().equals(resolvedAcademyCode)) {
            log.info("게시글 academyCode 변경: {} -> {}", board.getAcademyCode(), resolvedAcademyCode);
            board.updateAcademyCode(resolvedAcademyCode);
        }

        if (request.getTags() != null) {
            for (String tagName : request.getTags()) {
                if (!StringUtils.hasText(tagName)) {
                    continue;
                }

                // 해시태그 처리 로직을 별도의 트랜잭션으로 분리하여 안전하게 처리
                try {
                    Hashtag hashtag = getOrCreateHashtag(tagName, resolvedAcademyCode);

                    // 해시태그가 성공적으로 조회/생성된 경우에만 매핑 생성
                    if (hashtag != null && hashtag.getId() != null) {
                        TagMapping tagMapping = TagMapping.builder()
                                .board(board)
                                .hashtag(hashtag)
                                .build();

                        board.getTags().add(tagMapping);
                        tagMappingRepository.save(tagMapping);
                    }
                } catch (Exception e) {
                    log.error("해시태그 처리 중 예외 발생: {}", e.getMessage(), e);
                    // 한 태그에서 오류가 발생해도 다른 태그는 계속 처리
                }
            }
        }

        List<String> imageUrls = extractImageUrls(request.getContent());
        for (String imageUrl : imageUrls) {
            Image postFile = Image.builder()
                    .board(board)
                    .filePath(imageUrl)
                    .build();
            imageRepository.save(postFile);
        }

        return createBoardResponse(board);
    }

    @Override
    @Transactional
    public BoardResponse updateBoard(Long id, BoardRequest request, Long userId) {
        return updateBoard(id, request, userId, null);
    }

    @Override
    @Transactional
    public void deleteBoard(Long id, Long userId, String academyCode) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> BoardException.notFound());

        // 사용자 정보 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BoardException.notFound());

        // academyCode 유효성 검사 - 제공된 academyCode와 게시글의 academyCode가 일치하는지 확인
        if (academyCode != null && !academyCode.isEmpty() && !academyCode.equals(board.getAcademyCode())) {
            // 로깅 추가
            log.info("제공된 academyCode: {}, 게시글의 academyCode: {}", academyCode, board.getAcademyCode());
        }

        // 관리자 권한 확인
        boolean isAdmin = user.getRoles().contains(Role.ADMIN);

        // 관리자이거나 작성자가 본인인 경우 삭제 가능
        if (!isAdmin) {
            board.validateUser(userId);
        }

        board.validateStatus();
        board.setStatus(Status.INACTIVE);
        boardRepository.save(board);
    }

    @Override
    @Transactional
    public void deleteBoard(Long id, Long userId) {
        deleteBoard(id, userId, null);
    }

    @Override
    @Transactional
    public void toggleLike(Long boardId, Long userId, String academyCode) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> BoardException.notFound());

        // academyCode 유효성 검사 - 제공된 academyCode와 게시글의 academyCode가 일치하는지 확인
        if (academyCode != null && !academyCode.isEmpty() && !academyCode.equals(board.getAcademyCode())) {
            // 로깅 추가
            log.info("제공된 academyCode: {}, 게시글의 academyCode: {}", academyCode, board.getAcademyCode());
        }

        board.validateStatus();

        boardLikeRepository.findByBoardIdAndUserId(boardId, userId)
                .ifPresentOrElse(
                        boardLikeRepository::delete,
                        () -> {
                            BoardLike boardLike = BoardLike.builder()
                                    .board(board)
                                    .user(userRepository.findById(userId)
                                            .orElseThrow(() -> BoardException.notFound()))
                                    .build();
                            boardLikeRepository.save(boardLike);
                        }
                );
    }

    @Override
    @Transactional
    public void toggleLike(Long boardId, Long userId) {
        toggleLike(boardId, userId, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> getBoardsByTag(String academyCode, String tag, String sortType, Pageable pageable) {
        if (!StringUtils.hasText(academyCode) || !StringUtils.hasText(tag)) {
            throw BoardException.invalidRequest();
        }
        return boardRepository.findByTagAndAcademyCode(academyCode, tag, sortType, null, "free", pageable)
                .map(board -> {
                    Hibernate.initialize(board.getBoardLikes());
                    return createBoardResponse(board);
                });
    }

    @Override
    @Transactional
    public void createBoardReport(Long boardId, Long userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> BoardException.notFound());

        board.validateStatus();

        User user = userRepository.findById(board.getUser().getId())
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        // 자신의 게시글은 신고할 수 없음
        if (board.getUser().getId().equals(userId)) {
            throw BoardException.cannotReportOwnPost();
        }

        // 이미 신고한 게시글인지 확인
        if (boardReportRepository.findByBoardIdAndUserId(boardId, userId).isPresent()) {
            throw BoardException.alreadyReported();
        }

        BoardReport boardReport = BoardReport.builder()
                .board(board)
                .user(userRepository.findById(userId)
                        .orElseThrow(() -> BoardException.notFound()))
                .build();

        user.setReportedCount(user.getReportedCount() + 1); // 신고 횟수 누적
        // board.setStatus(Status.INACTIVE); // 대기 상태로 변경 코드 제거

        boardReportRepository.save(boardReport);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagResponse> getPopularTags(String academyCode) {
        return tagMappingRepository.findTop5PopularTagsByAcademyCode(academyCode)
                .stream()
                .map(tag -> TagResponse.builder()
                        .name(tag.getHashtagName())
                        .count(tag.getCount())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagResponse> getPopularTags(String academyCode, Integer minLikes) {
        return tagMappingRepository.findTop5PopularTagsByAcademyCode(academyCode, minLikes)
                .stream()
                .map(tag -> TagResponse.builder()
                        .name(tag.getHashtagName())
                        .count(tag.getCount())
                        .build())
                .collect(Collectors.toList());
    }

    private BoardResponse createBoardResponse(Board board) {
        List<String> tagNames = board.getTags().stream()
                .map(tagMapping -> tagMapping.getHashtag().getHashtagName())
                .collect(Collectors.toList());
                
        int commentCount = commentRepository.countByBoardIdAndStatus(board.getId(), Status.ACTIVE);
                
        return BoardResponse.from(board, tagNames, commentCount, imageRepository);
    }

    private void validateBoardRequest(BoardRequest request) {
        if (!StringUtils.hasText(request.getTitle())) {
            throw BoardException.invalidRequest();
        }
        if (!StringUtils.hasText(request.getContent())) {
            throw BoardException.invalidRequest();
        }

    }

    private List<String> extractImageUrls(String content) {
        Pattern pattern = Pattern.compile("!\\[.*?\\]\\((.*?)\\)");
        Matcher matcher = pattern.matcher(content);
        List<String> urls = new ArrayList<>();

        while (matcher.find()) {
            urls.add(matcher.group(1));
        }

        return urls;
    }


    @Override
    public String getAcademyCodeByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BoardException.notFound("사용자를 찾을 수 없습니다."));

        String academyCode = user.getAcademyId();
        if (!StringUtils.hasText(academyCode)) {
            throw BoardException.invalidRequest("아카데미 코드가 등록되지 않았습니다. 먼저 학원을 등록해주세요.");
        }

        return academyCode;
    }


    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> getBoardsByUserId(Long userId, String sortType, Integer minLikes, String type, Pageable pageable) {
        String academyCode = getAcademyCodeByUserId(userId);
        if (academyCode == null) {
            throw BoardException.notFound();
        }

        return boardRepository.findByAcademyCodeAndStatusAndType(
                academyCode, Status.ACTIVE, type, sortType, minLikes, pageable)
                .map(board -> {
                    Hibernate.initialize(board.getBoardLikes());
                    return createBoardResponse(board);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> searchBoardsByUserId(Long userId, String keyword, String sortType, Integer minLikes,
                                                    String type, Pageable pageable) {
        String academyCode = getAcademyCodeByUserId(userId);
        if (academyCode == null) {
            throw BoardException.notFound();
        }

        return boardRepository.searchBoards(academyCode, keyword, sortType, minLikes, type, pageable)
                .map(board -> {
                    Hibernate.initialize(board.getBoardLikes());
                    return createBoardResponse(board);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> getBoardsByTagAndUserId(Long userId, String tag, String sortType, Integer minLikes,
                                                       String type, Pageable pageable) {
        String academyCode = getAcademyCodeByUserId(userId);
        if (academyCode == null) {
            throw BoardException.notFound();
        }

        return boardRepository.findByTagAndAcademyCode(academyCode, tag, sortType, minLikes, type, pageable)
                .map(board -> {
                    Hibernate.initialize(board.getBoardLikes());
                    return createBoardResponse(board);
                });
    }


    @Override
    @Transactional(readOnly = true)
    public List<TagResponse> getPopularTagsByUserId(Long userId, String type) {
        String academyCode = getAcademyCodeByUserId(userId);
        return tagMappingRepository.findTop5PopularTagsByAcademyCodeAndType(academyCode, type)
                .stream()
                .map(tag -> TagResponse.builder()
                        .name(tag.getHashtagName())
                        .count(tag.getCount())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagResponse> getPopularTagsByUserId(Long userId, Integer minLikes, String type) {
        String academyCode = getAcademyCodeByUserId(userId);
        return tagMappingRepository.findTop5PopularTagsByAcademyCodeAndMinLikesAndType(academyCode, minLikes, type)
                .stream()
                .map(tag -> TagResponse.builder()
                        .name(tag.getHashtagName())
                        .count(tag.getCount())
                        .build())
                .collect(Collectors.toList());
    }


    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> searchBoardsByType(String academyCode, String searchType, String keyword,
                                                  String sortType, Pageable pageable) {
        if (!StringUtils.hasText(academyCode) || !StringUtils.hasText(keyword) || !StringUtils.hasText(searchType)) {
            throw BoardException.invalidRequest();
        }

        // 검색 유형이 유효한지 체크
        if (!searchType.equals("태그") && !searchType.equals("작성자") && !searchType.equals("제목")) {
            throw BoardException.invalidRequest();
        }

        return boardRepository.searchBoardsByType(academyCode, searchType, keyword, sortType, null, "free", pageable)
                .map(board -> {
                    Hibernate.initialize(board.getBoardLikes());
                    return createBoardResponse(board);
                });
    }


    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> searchBoardsByTypeAndUserId(Long userId, String searchType, String keyword,
                                                           String sortType, Integer minLikes, String type, Pageable pageable) {
        String academyCode = getAcademyCodeByUserId(userId);
        if (academyCode == null) {
            throw BoardException.notFound();
        }

        return boardRepository.searchBoardsByType(academyCode, searchType, keyword, sortType, minLikes, type, pageable)
                .map(board -> {
                    Hibernate.initialize(board.getBoardLikes());
                    return createBoardResponse(board);
                });
    }

    @Override
    @Transactional
    public void increaseViewCount(Long id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> BoardException.notFound());

        board.increaseViewCount();
        boardRepository.save(board);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isReportedByUser(Long boardId, Long userId) {

        return boardReportRepository.findByBoardIdAndUserId(boardId, userId).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isLikedByUser(Long boardId, Long userId) {
        return boardLikeRepository.findByBoardIdAndUserId(boardId, userId).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isBoardOwner(Long boardId, Long userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> BoardException.notFound());

        return board.getUser().getId().equals(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> getMyBoards(Long userId, Pageable pageable) {
        return boardRepository.findByUserId(userId, pageable)
                .map(board -> {
                    List<String> tagNames = board.getTags().stream()
                            .map(tagMapping -> {
                                return tagMapping.getHashtag().getHashtagName();
                            })
                            .toList();
                    int commentCount = commentRepository.countByBoardIdAndStatus(board.getId(), Status.ACTIVE);
                    return BoardResponse.from(board, tagNames, commentCount, imageRepository);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> getLikedBoards(Long userId, Pageable pageable) {
        return boardLikeRepository.findLikedBoardsByUserId(userId, pageable)
                .map(board -> {
                    List<String> tagNames = board.getTags().stream()
                            .map(tagMapping -> tagMapping.getHashtag().getHashtagName())
                            .toList();
                    int commentCount = commentRepository.countByBoardIdAndStatus(board.getId(), Status.ACTIVE);
                    return BoardResponse.from(board, tagNames, commentCount, imageRepository);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> getNoticeBoards(String academyCode, String sortType, Pageable pageable) {
        log.info("공지사항 조회 - 정렬 방식: {}", sortType);
        
        // 정렬 방식이 없으면 기본값 설정
        if (sortType == null || sortType.isEmpty()) {
            sortType = "등록일순";
        }

        // 더 단순한 방법으로 접근: 정렬 처리를 수동으로 수행
        Page<Board> boards;
        if (sortType.equals("조회순")) {
            // 조회수 정렬은 쿼리에서 처리
            Pageable viewPageable = PageRequest.of(
                pageable.getPageNumber(), 
                pageable.getPageSize(), 
                Sort.by(Sort.Direction.DESC, "viewCount", "creationTime")
            );
            boards = boardRepository.findByAcademyCodeAndStatusAndTypeFlexible(
                academyCode, Status.ACTIVE, "notice", sortType, viewPageable);
        } else {
            // 기본 정렬(등록일순)으로 전체 데이터 가져오기 - 페이징 고려 X
            boards = boardRepository.findByAcademyCodeAndStatusAndTypeFlexible(
                academyCode, Status.ACTIVE, "notice", "등록일순", Pageable.unpaged());
                
            // JPQL에서 처리하기 어려운 댓글 및 좋아요 수 정렬은 Java에서 처리
            List<Board> sortedList = new ArrayList<>(boards.getContent());
            if (sortType.equals("댓글순")) {
                sortedList.sort((b1, b2) -> {
                    int count1 = commentRepository.countByBoardIdAndStatus(b1.getId(), Status.ACTIVE);
                    int count2 = commentRepository.countByBoardIdAndStatus(b2.getId(), Status.ACTIVE);
                    return Integer.compare(count2, count1); // 내림차순
                });
            } else if (sortType.equals("좋아요순")) {
                sortedList.sort((b1, b2) -> {
                    int count1 = b1.getBoardLikes().size();
                    int count2 = b2.getBoardLikes().size();
                    return Integer.compare(count2, count1); // 내림차순
                });
            }
            
            // 정렬된 결과에서 페이징 처리
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), sortedList.size());
            
            if (start > sortedList.size()) {
                start = 0;
                end = 0;
            }
            
            List<Board> pageContent = start < end ? sortedList.subList(start, end) : new ArrayList<>();
            boards = new org.springframework.data.domain.PageImpl<>(
                pageContent, pageable, sortedList.size());
        }

        // 결과를 BoardResponse로 변환
        return boards.map(board -> {
            // 공지사항 태그 리스트
            List<String> tags = board.getTags().stream()
                    .map(tagMapping -> tagMapping.getHashtag().getHashtagName())
                    .collect(Collectors.toList());

            // 댓글 수 조회
            int commentCount = commentRepository.countByBoardIdAndStatus(board.getId(), Status.ACTIVE);
            
            return BoardResponse.from(board, tags, commentCount, imageRepository);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> searchNoticeBoards(String academyCode, String keyword, Pageable pageable) {
        if (!StringUtils.hasText(academyCode) || !StringUtils.hasText(keyword)) {
            throw BoardException.invalidRequest("아카데미 코드 또는 검색어가 유효하지 않습니다.");
        }

        // 정렬 타입 추출 또는 기본값 설정
        String sortType = "등록일순";
        if (pageable.getSort().isSorted()) {
            Sort.Order order = pageable.getSort().iterator().next();
            if (order.getProperty().equals("viewCount")) {
                sortType = "조회순";
            } else if (order.getProperty().contains("comments")) {
                sortType = "댓글순";
            } else if (order.getProperty().contains("boardLikes")) {
                sortType = "좋아요순";
            }
        }

        // 더 단순한 방법으로 접근: 우선 기본 정렬로 검색 데이터 가져오기
        Page<Board> boards;
        
        if (sortType.equals("조회순")) {
            // 조회수 정렬은 쿼리에서 처리
            Pageable viewPageable = PageRequest.of(
                pageable.getPageNumber(), 
                pageable.getPageSize(), 
                Sort.by(Sort.Direction.DESC, "viewCount", "creationTime")
            );
            boards = boardRepository.searchNoticeBoards(
                academyCode, Status.ACTIVE, keyword, sortType, viewPageable);
        } else {
            // 기본 정렬(등록일순)으로 전체 데이터 가져오기 - 페이징 고려 X
            boards = boardRepository.searchNoticeBoards(
                academyCode, Status.ACTIVE, keyword, "등록일순", Pageable.unpaged());
                
            // JPQL에서 처리하기 어려운 댓글 및 좋아요 수 정렬은 Java에서 처리
            List<Board> sortedList = new ArrayList<>(boards.getContent());
            if (sortType.equals("댓글순")) {
                sortedList.sort((b1, b2) -> {
                    int count1 = commentRepository.countByBoardIdAndStatus(b1.getId(), Status.ACTIVE);
                    int count2 = commentRepository.countByBoardIdAndStatus(b2.getId(), Status.ACTIVE);
                    return Integer.compare(count2, count1); // 내림차순
                });
            } else if (sortType.equals("좋아요순")) {
                sortedList.sort((b1, b2) -> {
                    int count1 = b1.getBoardLikes().size();
                    int count2 = b2.getBoardLikes().size();
                    return Integer.compare(count2, count1); // 내림차순
                });
            }
            
            // 정렬된 결과에서 페이징 처리
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), sortedList.size());
            
            if (start > sortedList.size()) {
                start = 0;
                end = 0;
            }
            
            List<Board> pageContent = start < end ? sortedList.subList(start, end) : new ArrayList<>();
            boards = new org.springframework.data.domain.PageImpl<>(
                pageContent, pageable, sortedList.size());
        }

        // 결과를 BoardResponse로 변환
        return boards.map(board -> {
            // 공지사항 태그 리스트 가져오기
            List<String> tags = board.getTags().stream()
                    .map(tagMapping -> tagMapping.getHashtag().getHashtagName())
                    .collect(Collectors.toList());

            // 댓글 수 조회
            int commentCount = commentRepository.countByBoardIdAndStatus(board.getId(), Status.ACTIVE);
            
            return BoardResponse.from(board, tags, commentCount, imageRepository);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> searchNoticeBoards(String academyCode, String keyword, String type, Pageable pageable) {
        if (!StringUtils.hasText(academyCode) || !StringUtils.hasText(keyword)) {
            throw BoardException.invalidRequest("아카데미 코드 또는 검색어가 유효하지 않습니다.");
        }

        // 정렬 타입 추출 또는 기본값 설정
        String sortType = "등록일순";
        if (pageable.getSort().isSorted()) {
            Sort.Order order = pageable.getSort().iterator().next();
            if (order.getProperty().equals("viewCount")) {
                sortType = "조회순";
            } else if (order.getProperty().contains("comments")) {
                sortType = "댓글순";
            } else if (order.getProperty().contains("boardLikes")) {
                sortType = "좋아요순";
            }
        }

        // 더 단순한 방법으로 접근: 우선 기본 정렬로 검색 데이터 가져오기
        Page<Board> boards;
        
        if (sortType.equals("조회순")) {
            // 조회수 정렬은 쿼리에서 처리
            Pageable viewPageable = PageRequest.of(
                pageable.getPageNumber(), 
                pageable.getPageSize(), 
                Sort.by(Sort.Direction.DESC, "viewCount", "creationTime")
            );
            boards = boardRepository.searchNoticeBoardsWithTypeAndCounts(
                academyCode, Status.ACTIVE, keyword, sortType, type, viewPageable);
        } else {
            // 기본 정렬(등록일순)으로 전체 데이터 가져오기 - 페이징 고려 X
            boards = boardRepository.searchNoticeBoardsWithTypeAndCounts(
                academyCode, Status.ACTIVE, keyword, "등록일순", type, Pageable.unpaged());
                
            // JPQL에서 처리하기 어려운 댓글 및 좋아요 수 정렬은 Java에서 처리
            List<Board> sortedList = new ArrayList<>(boards.getContent());
            if (sortType.equals("댓글순")) {
                sortedList.sort((b1, b2) -> {
                    int count1 = commentRepository.countByBoardIdAndStatus(b1.getId(), Status.ACTIVE);
                    int count2 = commentRepository.countByBoardIdAndStatus(b2.getId(), Status.ACTIVE);
                    return Integer.compare(count2, count1); // 내림차순
                });
            } else if (sortType.equals("좋아요순")) {
                sortedList.sort((b1, b2) -> {
                    int count1 = b1.getBoardLikes().size();
                    int count2 = b2.getBoardLikes().size();
                    return Integer.compare(count2, count1); // 내림차순
                });
            }
            
            // 정렬된 결과에서 페이징 처리
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), sortedList.size());
            
            if (start > sortedList.size()) {
                start = 0;
                end = 0;
            }
            
            List<Board> pageContent = start < end ? sortedList.subList(start, end) : new ArrayList<>();
            boards = new org.springframework.data.domain.PageImpl<>(
                pageContent, pageable, sortedList.size());
        }

        // 결과를 BoardResponse로 변환
        return boards.map(board -> {
            // 공지사항 태그 리스트 가져오기
            List<String> tags = board.getTags().stream()
                    .map(tagMapping -> tagMapping.getHashtag().getHashtagName())
                    .collect(Collectors.toList());

            // 댓글 수 조회
            int commentCount = commentRepository.countByBoardIdAndStatus(board.getId(), Status.ACTIVE);
            
            return BoardResponse.from(board, tags, commentCount, imageRepository);
        });
    }

    /**
     * 해시태그를 조회하거나 생성하는 메서드
     * 별도의 트랜잭션으로 분리하여 예외 처리를 더 안전하게 함
     */
   @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Hashtag getOrCreateHashtag(String tagName, String academyCode) {
        // First, try to find existing hashtag
        Hashtag hashtag = hashtagRepository.findByHashtagNameAndAcademyCode(tagName, academyCode)
                .orElse(null);

        if (hashtag != null) {
            log.info("Using existing hashtag: {}, academyCode: {}, id: {}",
                    tagName, academyCode, hashtag.getId());
            return hashtag;
        }

        // If not found, attempt to create a new one
        try {
            Hashtag newHashtag = Hashtag.builder()
                    .hashtagName(tagName)
                    .academyCode(academyCode)
                    .build();
            hashtag = hashtagRepository.save(newHashtag);
            log.info("Created new hashtag: {}, academyCode: {}, id: {}",
                    tagName, academyCode, hashtag.getId());
            return hashtag;
        } catch (DataIntegrityViolationException e) {
            log.warn("Duplicate key error while saving hashtag: {}, retrying lookup", e.getMessage());
            // Retry in a new transaction to ensure clean session
            hashtag = retryGetHashtag(tagName, academyCode);
            if (hashtag != null) {
                log.info("Found existing hashtag after duplicate error: {}, academyCode: {}, id: {}",
                        tagName, academyCode, hashtag.getId());
                return hashtag;
            }
            log.error("Failed to find hashtag after duplicate error: {}, academyCode: {}",
                    tagName, academyCode);
            throw new IllegalStateException("Unable to create or find hashtag: " + tagName, e);
        } catch (Exception e) {
            log.error("Unexpected error while creating hashtag: {}, academyCode: {}",
                    tagName, academyCode, e);
            throw new IllegalStateException("Failed to process hashtag: " + tagName, e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Hashtag retryGetHashtag(String tagName, String academyCode) {
        return hashtagRepository.findByHashtagNameAndAcademyCode(tagName, academyCode)
                .orElse(null);
    }


    @Override
    public List<Long> getLikedBoardIds(Long userId) {
        return boardLikeRepository.findByUserId(userId)
                .stream()
                .map(like -> like.getBoard().getId())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> getNoticeBoards(String academyCode, Pageable pageable) {
        // 정렬 타입 추출 또는 기본값 설정
        String sortType = "등록일순";
        if (pageable.getSort().isSorted()) {
            Sort.Order order = pageable.getSort().iterator().next();
            if (order.getProperty().equals("viewCount")) {
                sortType = "조회순";
            } else if (order.getProperty().contains("comments")) {
                sortType = "댓글순";
            } else if (order.getProperty().contains("boardLikes")) {
                sortType = "좋아요순";
            }
        }
        
        return getNoticeBoards(academyCode, sortType, pageable);
    }

}
