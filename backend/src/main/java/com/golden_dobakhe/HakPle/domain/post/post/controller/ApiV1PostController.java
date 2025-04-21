package com.golden_dobakhe.HakPle.domain.post.post.controller;

import com.golden_dobakhe.HakPle.domain.post.post.dto.BoardRequest;
import com.golden_dobakhe.HakPle.domain.post.post.dto.BoardResponse;
import com.golden_dobakhe.HakPle.domain.post.post.dto.TagResponse;
import com.golden_dobakhe.HakPle.domain.post.post.service.BoardService;
import com.golden_dobakhe.HakPle.security.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/posts")
@Tag(name = "Posts", description = "게시물 관리 API")
public class ApiV1PostController {

    private final BoardService boardService;

    // 현재 인증된 사용자 ID를 반환하는 메서드
    private Long getCurrentUserId() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            throw new AccessDeniedException("로그인이 필요합니다");
        }
        return userId;
    }

    @Operation(summary = "게시물 생성", description = "새로운 게시물을 생성합니다.")
    @PostMapping
    public ResponseEntity<BoardResponse> createBoard(
            @RequestBody BoardRequest request
    ) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(boardService.createBoard(request, userId));
    }

    @Operation(summary = "게시물 ID로 조회", description = "특정 ID의 게시물을 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<BoardResponse> getBoard(
            @PathVariable("id") Long id,
            @RequestParam(required = false, defaultValue = "true") Boolean postView) {
        // 로그인 여부와 관계없이 게시글 조회 가능
        return ResponseEntity.ok(boardService.getBoard(id, postView));
    }

    @Operation(summary = "게시물 목록 조회", description = "게시물 목록을 페이징 처리하여 조회합니다.")
    @GetMapping
    public ResponseEntity<Page<BoardResponse>> getBoards(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortType", defaultValue = "등록일순") String sortType,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "tag", required = false) String tag,
            @RequestParam(name = "searchType", required = false) String searchType,
            @RequestParam(name = "minLikes", required = false) Integer minLikes,
            @PageableDefault(size = 10) Pageable pageable) {

        Long userId = getCurrentUserId();
        
        Pageable adjustedPageable = PageRequest.of(page - 1, size);
        
        // 검색어(keyword)가 제공된 경우:
        // - searchType 파라미터가 제공되면 해당 타입('제목', '작성자', '태그')으로 검색합니다.
        // - searchType 파라미터가 없으면 제목 또는 작성자 이름으로 검색합니다.
        // 태그(tag)가 제공된 경우: 해당 태그로 게시물을 검색합니다.
        // 검색어와 태그가 모두 제공되지 않은 경우: 모든 게시물을 반환합니다.
        if (keyword != null && !keyword.isEmpty()) {
            if (searchType != null && !searchType.isEmpty()) {
                return ResponseEntity.ok(boardService.searchBoardsByTypeAndUserId(userId, searchType, keyword, sortType, minLikes, adjustedPageable));
            } else {
                return ResponseEntity.ok(boardService.searchBoardsByUserId(userId, keyword, sortType, minLikes, adjustedPageable));
            }
        } else if (tag != null && !tag.isEmpty()) {
            return ResponseEntity.ok(boardService.getBoardsByTagAndUserId(userId, tag, sortType, minLikes, adjustedPageable));
        } else {
            return ResponseEntity.ok(boardService.getBoardsByUserId(userId, sortType, minLikes, adjustedPageable));
        }
    }

    @Operation(summary = "게시물 수정", description = "특정 ID의 게시물을 수정합니다.")
    @PutMapping("/{id}")
    public ResponseEntity<BoardResponse> updateBoard(
            @PathVariable("id") Long id,
            @RequestBody BoardRequest request

    ) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(boardService.updateBoard(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(
            @PathVariable("id") Long id

    ) {
        Long userId = getCurrentUserId();
        boardService.deleteBoard(id, userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "게시물 좋아요 토글", description = "게시물을 좋아요합니다.")
    @PostMapping("/{id}/like")
    public ResponseEntity<Void> toggleLike(
            @PathVariable("id") Long id
    ) {
        Long userId = getCurrentUserId();
        boardService.toggleLike(id, userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "게시물 특정 태그로 이동합니다", description = "특정 ID의 게시물 태그로 이동합니다.")
    @GetMapping("/tag/{tag}")
    public ResponseEntity<Page<BoardResponse>> getBoardsByTag(
            @PathVariable String tag,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @PageableDefault(size = 10) Pageable pageable,
            @RequestParam(defaultValue = "등록일순") String sortType,
            @RequestParam(name = "minLikes", required = false) Integer minLikes
    ) {
        Long userId = getCurrentUserId();

        Sort sort = Sort.by(Sort.Direction.DESC, "creationTime");
        Pageable adjustedPageable = PageRequest.of(page - 1, pageable.getPageSize(), sort);

        return ResponseEntity.ok(boardService.getBoardsByTagAndUserId(userId, tag, sortType, minLikes, adjustedPageable));
    }

    @Operation(summary = "게시물 신고", description = "특정 ID의 게시물을 신고합니다.")
    @PostMapping("/{id}/report")
    public ResponseEntity<Void> createBoardReport(
            @PathVariable("id") Long id
    ) {
        Long userId = getCurrentUserId();
        boardService.createBoardReport(id, userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "게시물 신고 상태 확인", description = "현재 사용자가 특정 게시물을 신고했는지 확인합니다.")
    @GetMapping("/{id}/report-status")
    public ResponseEntity<Map<String, Boolean>> checkBoardReportStatus(
            @PathVariable("id") Long id
    ) {
        Long userId = getCurrentUserId();
        
        boolean isReported = boardService.isReportedByUser(id, userId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isReported", isReported);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "게시물 작성자 확인", description = "현재 사용자가 게시물 작성자인지 확인합니다.")
    @GetMapping("/{id}/is-owner")
    public ResponseEntity<Map<String, Boolean>> checkBoardOwner(
            @PathVariable("id") Long id
    ) {
        Long userId = getCurrentUserId();
        
        boolean isOwner = boardService.isBoardOwner(id, userId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isOwner", isOwner);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "게시물 좋아요 상태 확인", description = "현재 사용자가 특정 게시물을 좋아요했는지 확인합니다.")
    @GetMapping("/{id}/like-status")
    public ResponseEntity<Map<String, Boolean>> checkBoardLikeStatus(
            @PathVariable("id") Long id
    ) {
        Long userId = getCurrentUserId();
        
        boolean isLiked = boardService.isLikedByUser(id, userId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isLiked", isLiked);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "게시물 조회수 증가", description = "게시물의 조회수를 1 증가시킵니다.")
    @PostMapping("/{id}/view")
    public ResponseEntity<Void> increaseViewCount(
            @PathVariable("id") Long id
    ) {
        getCurrentUserId(); // 로그인 체크만 수행
        boardService.increaseViewCount(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/tags/popular")
    public ResponseEntity<List<TagResponse>> getPopularTags(
            @RequestParam(name = "minLikes", required = false) Integer minLikes
    ) {
        Long userId = getCurrentUserId();
        if (minLikes != null && minLikes > 0) {
            return ResponseEntity.ok(boardService.getPopularTagsByUserId(userId, minLikes));
        }
        return ResponseEntity.ok(boardService.getPopularTagsByUserId(userId));
    }

    @GetMapping("/tags")
    public ResponseEntity<Page<BoardResponse>> getTaggedBoards(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortType", defaultValue = "등록일순") String sortType,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "tag", required = false) String tag,
            @RequestParam(name = "searchType", required = false) String searchType,
            @RequestParam(name = "minLikes", required = false) Integer minLikes
    ) {
        
        Long userId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        
        // 검색어(keyword)가 제공된 경우:
        // - searchType 파라미터가 제공되면 해당 타입('제목', '작성자', '태그')으로 검색합니다.
        // - searchType 파라미터가 없으면 제목 또는 작성자 이름으로 검색합니다.
        // 태그(tag)가 제공된 경우: 해당 태그로 게시물을 검색합니다.
        // 검색어와 태그가 모두 제공되지 않은 경우: 모든 게시물을 반환합니다.
        if (StringUtils.hasText(tag)) {
            return ResponseEntity.ok(boardService.getBoardsByTagAndUserId(userId, tag, sortType, minLikes, pageable));
        } else if (StringUtils.hasText(keyword)) {
            if (StringUtils.hasText(searchType)) {
                return ResponseEntity.ok(boardService.searchBoardsByTypeAndUserId(userId, searchType, keyword, sortType, minLikes, pageable));
            } else {
                return ResponseEntity.ok(boardService.searchBoardsByUserId(userId, keyword, sortType, minLikes, pageable));
            }
        } else {
            return ResponseEntity.ok(boardService.getBoardsByUserId(userId, sortType, minLikes, pageable));
        }
    }
}