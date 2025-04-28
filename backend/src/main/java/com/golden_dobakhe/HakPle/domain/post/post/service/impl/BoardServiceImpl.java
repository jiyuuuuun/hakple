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

import java.nio.charset.StandardCharsets;
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
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import com.golden_dobakhe.HakPle.domain.resource.image.service.FileService;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class BoardServiceImpl implements BoardService {

    private static final int MAX_CONTENT_LENGTH = 10000;

    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final HashtagRepository hashtagRepository;
    private final TagMappingRepository tagMappingRepository;
    private final BoardLikeRepository boardLikeRepository;
    private final BoardReportRepository boardReportRepository;
    private final ImageRepository imageRepository;
    private final CommentRepository commentRepository;
    private final FileService fileService;
    private static final Logger log = LoggerFactory.getLogger(BoardServiceImpl.class);

    @Override
    @Transactional
    public BoardResponse createBoard(BoardRequest request, Long userId, String academyCode) {
        fileService.cleanTempImagesNotIn(request.getTempIdList(), request.getContent());
        validateBoardRequest(request);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BoardException.notFound());

        String resolvedAcademyCode;

        if (request.getAcademyCode() != null && !request.getAcademyCode().isEmpty()) {
            resolvedAcademyCode = request.getAcademyCode();
        }
        else if (academyCode != null && !academyCode.isEmpty()) {
            resolvedAcademyCode = academyCode;
        }
        else {
            resolvedAcademyCode = user.getAcademyId();
        }

        Board board = Board.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .academyCode(resolvedAcademyCode)
                .user(user)
                .status(Status.ACTIVE)
                .modificationTime(null)
                .type(request.getBoardType())
                .build();

        board = boardRepository.save(board);

        if (request.getTags() != null) {
            for (String tagName : request.getTags()) {
                if (!StringUtils.hasText(tagName)) {
                    continue;
                }

                try {
                    Hashtag hashtag = getOrCreateHashtag(tagName, resolvedAcademyCode);

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
                }
            }
        }

        if (request.getTempIdList() != null && !request.getTempIdList().isEmpty()) {
            fileService.linkImagesToBoard(request.getTempIdList(), board.getId());
        }

        board.setModificationTime(null);
        boardRepository.save(board);

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

        if (academyCode != null && !academyCode.isEmpty() && !academyCode.equals(board.getAcademyCode())) {
        }

        board.getUser().getNickName();

        Hibernate.initialize(board.getBoardLikes());

        if (postView == null || postView) {
            board.increaseViewCount();
        }

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

        String translatedSortType = translateSortType(sortType);

        if (!StringUtils.hasText(translatedSortType)) {
            translatedSortType = "등록일순";
        }
        return boardRepository.findByAcademyCodeAndStatusExcludeNotice(academyCode, Status.ACTIVE, translatedSortType, null, pageable)
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
        String translatedSortType = translateSortType(sortType);

        return boardRepository.searchBoards(academyCode, keyword, translatedSortType, null, "free", pageable)
                .map(board -> {
                    Hibernate.initialize(board.getBoardLikes());
                    return createBoardResponse(board);
                });
    }

    @Override
    @Transactional
    public BoardResponse updateBoard(Long id, BoardRequest request, Long userId, String academyCode) {
        fileService.cleanTempImagesNotIn(request.getTempIdList(), request.getContent());
        validateBoardRequest(request);

        Board board = boardRepository.findById(id)
                .orElseThrow(() -> BoardException.notFound());

        board.validateUser(userId);
        board.validateStatus();
        board.update(request.getTitle(), request.getContent(), request.getBoardType());

        board.getTags().clear();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BoardException.notFound());
        String resolvedAcademyCode;

        if (request.getAcademyCode() != null && !request.getAcademyCode().isEmpty()) {
            resolvedAcademyCode = request.getAcademyCode();
        }
        else if (academyCode != null && !academyCode.isEmpty()) {
            resolvedAcademyCode = academyCode;
        }
        else {
            resolvedAcademyCode = user.getAcademyId();
        }


        if (request.getTags() != null) {
            for (String tagName : request.getTags()) {
                if (!StringUtils.hasText(tagName)) {
                    continue;
                }

                try {
                    Hashtag hashtag = getOrCreateHashtag(tagName, resolvedAcademyCode);

                    if (hashtag != null && hashtag.getId() != null) {
                        TagMapping tagMapping = TagMapping.builder()
                                .board(board)
                                .hashtag(hashtag)
                                .build();

                        board.getTags().add(tagMapping);
                        tagMappingRepository.save(tagMapping);
                    }
                } catch (Exception e) {
                    log.error("해시태그 처리 중 예외 발생: {}", e.getMessage(), e); // 원복: log.error 사용
                }
            }
        }

        if (request.getUsedImageUrls() != null) {
            fileService.cleanUpUnused(id, request.getUsedImageUrls());
        }

        if (request.getTempIdList() != null && !request.getTempIdList().isEmpty()) {
            fileService.linkImagesToBoard(request.getTempIdList(), id);
        }

        boardRepository.save(board);

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

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BoardException.notFound());
        if (academyCode != null && !academyCode.isEmpty() && !academyCode.equals(board.getAcademyCode())) {
        }

        boolean isAdmin = user.getRoles().contains(Role.ADMIN);

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

        if (academyCode != null && !academyCode.isEmpty() && !academyCode.equals(board.getAcademyCode())) {
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
        String translatedSortType = translateSortType(sortType);

        return boardRepository.findByTagAndAcademyCode(academyCode, tag, translatedSortType, null, "free", pageable)
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
        if (board.getUser().getId().equals(userId)) {
            throw BoardException.cannotReportOwnPost();
        }

        if (boardReportRepository.findByBoardIdAndUserId(boardId, userId).isPresent()) {
            throw BoardException.alreadyReported();
        }

        BoardReport boardReport = BoardReport.builder()
                .board(board)
                .user(userRepository.findById(userId)
                        .orElseThrow(() -> BoardException.notFound()))
                .build();

        user.setReportedCount(user.getReportedCount() + 1);

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
        if (request.getContent().getBytes(StandardCharsets.UTF_8).length > MAX_CONTENT_LENGTH) {
            throw BoardException.invalidRequest("Content exceeds maximum allowed length of " + MAX_CONTENT_LENGTH + " characters.");
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
        String translatedSortType = translateSortType(sortType);

        return boardRepository.findByAcademyCodeAndStatusAndType(
                academyCode, Status.ACTIVE, type, translatedSortType, minLikes, pageable)
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

        String translatedSortType = translateSortType(sortType);

        return boardRepository.searchBoards(academyCode, keyword, translatedSortType, minLikes, type, pageable)
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

        String translatedSortType = translateSortType(sortType);

        return boardRepository.findByTagAndAcademyCode(academyCode, tag, translatedSortType, minLikes, type, pageable)
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
        if (!searchType.equals("태그") && !searchType.equals("작성자") && !searchType.equals("제목")) {
            throw BoardException.invalidRequest();
        }
        String translatedSortType = translateSortType(sortType);

        return boardRepository.searchBoardsByType(academyCode, searchType, keyword, translatedSortType, null, "free", pageable)
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
        String translatedSortType = translateSortType(sortType);

        return boardRepository.searchBoardsByType(academyCode, searchType, keyword, translatedSortType, minLikes, type, pageable)
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
        String translatedSortType = translateSortType(sortType);
        
        if (translatedSortType == null || translatedSortType.isEmpty()) {
            translatedSortType = "등록일순";
        }

        Page<Board> boards;
        if (translatedSortType.equals("조회순")) {
            Pageable viewPageable = PageRequest.of(
                pageable.getPageNumber(), 
                pageable.getPageSize(), 
                Sort.by(Sort.Direction.DESC, "viewCount", "creationTime")
            );
            boards = boardRepository.findByAcademyCodeAndStatusAndTypeFlexible(
                academyCode, Status.ACTIVE, "notice", translatedSortType, viewPageable);
        } else {
            boards = boardRepository.findByAcademyCodeAndStatusAndTypeFlexible(
                academyCode, Status.ACTIVE, "notice", translatedSortType, Pageable.unpaged());
            
            List<Board> sortedList = new ArrayList<>(boards.getContent());
            if (translatedSortType.equals("댓글순")) {
                sortedList.sort((b1, b2) -> {
                    int count1 = commentRepository.countByBoardIdAndStatus(b1.getId(), Status.ACTIVE);
                    int count2 = commentRepository.countByBoardIdAndStatus(b2.getId(), Status.ACTIVE);
                    return Integer.compare(count2, count1); 
                });
            } else if (translatedSortType.equals("좋아요순")) {
                sortedList.sort((b1, b2) -> {
                    int count1 = b1.getBoardLikes().size();
                    int count2 = b2.getBoardLikes().size();
                    return Integer.compare(count2, count1);
                });
            }
            
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

        return boards.map(board -> {
            List<String> tags = board.getTags().stream()
                    .map(tagMapping -> tagMapping.getHashtag().getHashtagName())
                    .collect(Collectors.toList());

            int commentCount = commentRepository.countByBoardIdAndStatus(board.getId(), Status.ACTIVE);
            
            return BoardResponse.from(board, tags, commentCount, imageRepository);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> searchNoticeBoards(String academyCode, String keyword, Pageable pageable) {
        String translatedSortType = "등록일순";

        return boardRepository.searchNoticeBoards(
                academyCode,
                Status.ACTIVE,
                keyword,
                translatedSortType,
                pageable
        ).map(board -> {
            Hibernate.initialize(board.getBoardLikes());
            return createBoardResponse(board);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> searchNoticeBoards(String academyCode, String keyword, String type, Pageable pageable) {
        String translatedSortType = "등록일순";

        return boardRepository.searchNoticeBoardsWithTypeAndCounts(
                academyCode,
                Status.ACTIVE,
                keyword,
                translatedSortType,
                type,
                pageable
        ).map(board -> {
            Hibernate.initialize(board.getBoardLikes());
            return createBoardResponse(board);
        });
    }

    @Override
    public Page<BoardResponse> searchNoticeBoards(String academyCode, String keyword, String type, String sortType, Pageable pageable) {
        String translatedSortType = translateSortType(sortType);

        return boardRepository.searchNoticeBoardsWithTypeAndCounts(
                academyCode,
                Status.ACTIVE,
                keyword,
                translatedSortType,
                type,
                pageable
        ).map(board -> {
            Hibernate.initialize(board.getBoardLikes());
            return createBoardResponse(board);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Hashtag getOrCreateHashtag(String tagName, String academyCode) {
        Hashtag hashtag = hashtagRepository.findByHashtagNameAndAcademyCode(tagName, academyCode)
                .orElse(null);

        if (hashtag != null) {
            return hashtag;
        }

        try {
            Hashtag newHashtag = Hashtag.builder()
                    .hashtagName(tagName)
                    .academyCode(academyCode)
                    .build();
            hashtag = hashtagRepository.save(newHashtag);
            return hashtag;
        } catch (DataIntegrityViolationException e) {
            hashtag = retryGetHashtag(tagName, academyCode);
            if (hashtag != null) {
                return hashtag;
            }
            throw new IllegalStateException("Unable to create or find hashtag: " + tagName, e);
        } catch (Exception e) {
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
        String sortType = "creationTime";
        if (pageable.getSort().isSorted()) {
            Sort.Order order = pageable.getSort().iterator().next();
            if (order.getProperty().equals("viewCount")) {
                sortType = "viewCount";
            } else if (order.getProperty().contains("comments")) {
                sortType = "commentCount";
            } else if (order.getProperty().contains("boardLikes")) {
                sortType = "likeCount";
            }
        }

        return getNoticeBoards(academyCode, sortType, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> searchBoardsDynamic(String academyCode, String searchType, 
                                                 String searchKeyword, String type, Pageable pageable) {
        Page<Board> boardPage = boardRepository.searchBoardsDynamic(
            academyCode, 
            searchType,
            searchKeyword, 
            type,
            pageable
        );
        
        return boardPage.map(board -> {
            List<String> tagNames = Collections.emptyList();
            
            if (board.getTags() != null && !board.getTags().isEmpty()) {
                tagNames = board.getTags().stream()
                        .map(tag -> tag.getHashtag().getHashtagName())
                        .collect(Collectors.toList());
            }
            
            int commentCount = commentRepository.countByBoardIdAndStatus(board.getId(), Status.ACTIVE);
            
            return BoardResponse.from(board, tagNames, commentCount, imageRepository);
        });
    }

    private String translateSortType(String sortType) {
        if (sortType == null) return "등록일순";
        
        return switch (sortType) {
            case "viewCount" -> "조회순";
            case "commentCount" -> "댓글순";
            case "likeCount" -> "좋아요순";
            case "creationTime" -> "등록일순";
            default -> "등록일순";
        };
    }

}