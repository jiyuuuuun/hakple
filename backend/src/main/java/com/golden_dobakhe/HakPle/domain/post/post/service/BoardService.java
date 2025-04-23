package com.golden_dobakhe.HakPle.domain.post.post.service;

import com.golden_dobakhe.HakPle.domain.post.post.dto.BoardRequest;
import com.golden_dobakhe.HakPle.domain.post.post.dto.BoardResponse;
import com.golden_dobakhe.HakPle.domain.post.post.dto.TagResponse;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BoardService {
    BoardResponse createBoard(BoardRequest request, Long userId);

    BoardResponse createBoard(BoardRequest request, Long userId, String academyCode);

    /**
     * 게시물 ID로 조회
     */
    BoardResponse getBoard(Long id, Boolean postView);

    BoardResponse getBoard(Long id, Boolean postView, String academyCode);

    Page<BoardResponse> getBoardsByUserId(Long userId, String sortType, Integer minLikes, String type, Pageable pageable);

    @Deprecated
    Page<BoardResponse> getBoards(String academyCode, String sortType, Pageable pageable);

    /**
     * 아카데미 코드로 공지사항 조회
     */
    Page<BoardResponse> getNoticeBoards(String academyCode, Pageable pageable);

    Page<BoardResponse> searchBoardsByUserId(Long userId, String keyword, String sortType, Integer minLikes, String type, Pageable pageable);

    @Deprecated
    Page<BoardResponse> searchBoards(String academyCode, String keyword, String sortType, Pageable pageable);

    @Deprecated
    Page<BoardResponse> searchBoardsByType(String academyCode, String searchType, String keyword, String sortType,
                                           Pageable pageable);

    Page<BoardResponse> searchBoardsByTypeAndUserId(Long userId, String searchType, String keyword, String sortType,
                                                    Integer minLikes, String type, Pageable pageable);

    BoardResponse updateBoard(Long id, BoardRequest request, Long userId);

    BoardResponse updateBoard(Long id, BoardRequest request, Long userId, String academyCode);

    void deleteBoard(Long id, Long userId);

    void deleteBoard(Long id, Long userId, String academyCode);

    void toggleLike(Long id, Long userId);

    void toggleLike(Long id, Long userId, String academyCode);

    Page<BoardResponse> getBoardsByTagAndUserId(Long userId, String tag, String sortType, Integer minLikes, String type,
                                                Pageable pageable);

    @Deprecated
    Page<BoardResponse> getBoardsByTag(String academyCode, String tag, String sortType, Pageable pageable);

    void createBoardReport(Long id, Long userId);

    List<TagResponse> getPopularTagsByUserId(Long userId, String type);

    List<TagResponse> getPopularTagsByUserId(Long userId, Integer minLikes, String type);

    @Deprecated
    List<TagResponse> getPopularTags(String academyCode);

    @Deprecated
    List<TagResponse> getPopularTags(String academyCode, Integer minLikes);

    String getAcademyCodeByUserId(Long userId);

    void increaseViewCount(Long id);

    boolean isReportedByUser(Long boardId, Long userId);

    boolean isLikedByUser(Long boardId, Long userId);

    boolean isBoardOwner(Long boardId, Long userId);

    Page<BoardResponse> getMyBoards(Long userId, Pageable pageable);

    Page<BoardResponse> getLikedBoards(Long userId, Pageable pageable);

    /**
     * 공지사항 검색 조회
     */
    Page<BoardResponse> searchNoticeBoards(String academyCode, String keyword, Pageable pageable);

    /**
     * 공지사항 검색 조회 (type 파라미터 포함)
     */
    Page<BoardResponse> searchNoticeBoards(String academyCode, String keyword, String type, Pageable pageable);
}