package com.golden_dobakhe.HakPle.domain.post.post.controller;

import com.golden_dobakhe.HakPle.domain.post.post.dto.BoardRequest;
import com.golden_dobakhe.HakPle.domain.post.post.dto.BoardResponse;
import com.golden_dobakhe.HakPle.domain.post.post.dto.TagResponse;
import com.golden_dobakhe.HakPle.domain.post.post.service.BoardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/posts")
@Tag(name = "Posts", description = "게시물 관리 API")
public class ApiV1PostController {

    private final BoardService boardService;

    @Operation(summary = "게시물 생성", description = "새로운 게시물을 생성합니다.")
    @PostMapping
    public ResponseEntity<BoardResponse> createBoard(
            @RequestBody BoardRequest request
    ) {
        Long userId = 7L;
        return ResponseEntity.ok(boardService.createBoard(request, userId));
    }

    @Operation(summary = "게시물 ID로 조회", description = "특정 ID의 게시물을 조회합니다.")
    @GetMapping("/{id}")
public ResponseEntity<BoardResponse> getBoard(
        @PathVariable Long id,
        @RequestParam(required = false, defaultValue = "true") Boolean postView) {
    return ResponseEntity.ok(boardService.getBoard(id, postView));
}

    @Operation(summary = "게시물 목록 조회", description = "게시물 목록을 페이징 처리하여 조회합니다.")
    @GetMapping
    public ResponseEntity<Page<BoardResponse>> getBoards(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "등록일순") String sortType,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String searchType,
            @PageableDefault(size = 10) Pageable pageable) {

        Long userId = 7L;
        
        Pageable adjustedPageable = PageRequest.of(page - 1, size);
        
        if (keyword != null && !keyword.isEmpty()) {
            if (searchType != null && !searchType.isEmpty()) {
                return ResponseEntity.ok(boardService.searchBoardsByTypeAndUserId(userId, searchType, keyword, sortType, adjustedPageable));
            } else {
                return ResponseEntity.ok(boardService.searchBoardsByUserId(userId, keyword, sortType, adjustedPageable));
            }
        } else if (tag != null && !tag.isEmpty()) {
            return ResponseEntity.ok(boardService.getBoardsByTagAndUserId(userId, tag, sortType, adjustedPageable));
        } else {
            return ResponseEntity.ok(boardService.getBoardsByUserId(userId, sortType, adjustedPageable));
        }
    }

    @Operation(summary = "게시물 수정", description = "특정 ID의 게시물을 수정합니다.")
    @PutMapping("/{id}")
    public ResponseEntity<BoardResponse> updateBoard(
            @PathVariable Long id,
            @RequestBody BoardRequest request

    ) {
        Long userId = 7L;
        return ResponseEntity.ok(boardService.updateBoard(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(
            @PathVariable Long id

    ) {
        Long userId = 7L;
        boardService.deleteBoard(id, userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "게시물 좋아요 토글", description = "게시물을 좋아요합니다.")
    @PostMapping("/{id}/like")
    public ResponseEntity<Void> toggleLike(
            @PathVariable Long id
    ) {
        Long userId = 7L;
        boardService.toggleLike(id, userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "게시물 특적 태그로 이동합니다", description = "특정 ID의 게시물 태그로 이동합니다.")
    @GetMapping("/tag/{tag}")
    public ResponseEntity<Page<BoardResponse>> getBoardsByTag(
            @PathVariable String tag,
            @RequestParam(defaultValue = "1") int page,
            @PageableDefault(size = 10) Pageable pageable,
            @RequestParam(defaultValue = "등록일순") String sortType
    ) {
        Long userId = 7L;

        Sort sort = Sort.by(Sort.Direction.DESC, "creationTime");
        Pageable adjustedPageable = PageRequest.of(page - 1, pageable.getPageSize(), sort);

        return ResponseEntity.ok(boardService.getBoardsByTagAndUserId(userId, tag, sortType, adjustedPageable));
    }

    @Operation(summary = "게시물 신고", description = "특정 ID의 게시물을 신고합니다.")
    @PostMapping("/{id}/report")
    public ResponseEntity<Void> createBoardReport(
            @PathVariable Long id
    ) {
        Long userId = 7L;
        boardService.createBoardReport(id, userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "게시물 신고 상태 확인", description = "현재 사용자가 특정 게시물을 신고했는지 확인합니다.")
    @GetMapping("/{id}/report-status")
    public ResponseEntity<Map<String, Boolean>> checkBoardReportStatus(
            @PathVariable Long id
    ) {
        Long userId = 7L;
        
        boolean isReported = boardService.isReportedByUser(id, userId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isReported", isReported);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "게시물 좋아요 상태 확인", description = "현재 사용자가 특정 게시물을 좋아요했는지 확인합니다.")
    @GetMapping("/{id}/like-status")
    public ResponseEntity<Map<String, Boolean>> checkBoardLikeStatus(
            @PathVariable Long id
    ) {
        Long userId = 7L;
        
        boolean isLiked = boardService.isLikedByUser(id, userId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isLiked", isLiked);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "게시물 조회수 증가", description = "게시물의 조회수를 1 증가시킵니다.")
    @PostMapping("/{id}/view")
    public ResponseEntity<Void> increaseViewCount(@PathVariable Long id) {
        Long userId = 7L;
        boardService.increaseViewCount(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/tags/popular")
    public ResponseEntity<List<TagResponse>> getPopularTags() {
        Long userId = 7L;
        return ResponseEntity.ok(boardService.getPopularTagsByUserId(userId));
    }

    @GetMapping("/tags")
    public ResponseEntity<Page<BoardResponse>> getTaggedBoards(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "등록일순") String sortType,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String searchType) {
        
        Long userId = 7L;
        
        Pageable pageable = PageRequest.of(page, size);
        
        if (StringUtils.hasText(tag)) {
            return ResponseEntity.ok(boardService.getBoardsByTagAndUserId(userId, tag, sortType, pageable));
        } else if (StringUtils.hasText(keyword)) {
            if (StringUtils.hasText(searchType)) {
                return ResponseEntity.ok(boardService.searchBoardsByTypeAndUserId(userId, searchType, keyword, sortType, pageable));
            } else {
                return ResponseEntity.ok(boardService.searchBoardsByUserId(userId, keyword, sortType, pageable));
            }
        } else {
            return ResponseEntity.ok(boardService.getBoardsByUserId(userId, sortType, pageable));
        }
    }
}