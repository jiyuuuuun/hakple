package com.golden_dobakhe.HakPle.domain.post.post.service;

import com.golden_dobakhe.HakPle.domain.post.post.dto.BoardRequest;
import com.golden_dobakhe.HakPle.domain.post.post.dto.BoardResponse;
import com.golden_dobakhe.HakPle.domain.post.post.dto.TagResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BoardService {
    BoardResponse createBoard(BoardRequest request, Long userId);
    BoardResponse getBoard(Long id,  Boolean postView);

    Page<BoardResponse> getBoardsByUserId(Long userId, String sortType, Pageable pageable);

    Page<BoardResponse> getBoards(String academyCode, String sortType, Pageable pageable);

    Page<BoardResponse> searchBoardsByUserId(Long userId, String keyword, String sortType, Pageable pageable);

    Page<BoardResponse> searchBoards(String academyCode, String keyword, String sortType, Pageable pageable);

    Page<BoardResponse> searchBoardsByType(String academyCode, String searchType, String keyword, String sortType, Pageable pageable);

    Page<BoardResponse> searchBoardsByTypeAndUserId(Long userId, String searchType, String keyword, String sortType, Pageable pageable);

    BoardResponse updateBoard(Long id, BoardRequest request, Long userId);
    void deleteBoard(Long id, Long userId);
    void toggleLike(Long id, Long userId);

    Page<BoardResponse> getBoardsByTagAndUserId(Long userId, String tag, String sortType, Pageable pageable);

    Page<BoardResponse> getBoardsByTag(String academyCode, String tag, String sortType, Pageable pageable);

    void createBoardReport(Long id, Long userId);

    List<TagResponse> getPopularTagsByUserId(Long userId);

    List<TagResponse> getPopularTags(String academyCode);

    String getAcademyCodeByUserId(Long userId);

    void increaseViewCount(Long id);

    boolean isReportedByUser(Long boardId, Long userId);

    boolean isLikedByUser(Long boardId, Long userId);
}