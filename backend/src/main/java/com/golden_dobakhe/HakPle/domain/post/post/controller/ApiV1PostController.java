package com.golden_dobakhe.HakPle.domain.post.post.controller;

import com.golden_dobakhe.HakPle.domain.post.post.dto.BoardRequest;
import com.golden_dobakhe.HakPle.domain.post.post.dto.BoardResponse;
import com.golden_dobakhe.HakPle.domain.post.post.dto.TagResponse;
import com.golden_dobakhe.HakPle.domain.post.post.service.BoardService;
import com.golden_dobakhe.HakPle.security.utils.SecurityUtil;
import com.golden_dobakhe.HakPle.domain.post.post.dto.AdminStatusChangeRequestDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.golden_dobakhe.HakPle.global.Status;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/posts")
@Tag(name = "Posts", description = "게시물 관리 API")
public class ApiV1PostController {

    private final BoardService boardService;

    private Long getCurrentUserId() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            throw new AccessDeniedException("로그인이 필요합니다");
        }
        return userId;
    }

    @Operation(summary = "게시물 생성", description = "새로운 게시물을 생성합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "게시물 생성 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping
    public ResponseEntity<BoardResponse> createBoard(
            @Parameter(description = "게시물 생성 요청 정보") @RequestBody BoardRequest request,
            @Parameter(description = "학원 코드 (선택 사항)") @RequestParam(name = "academyCode", required = false) String academyCode
    ) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(boardService.createBoard(request, userId, academyCode));
    }

    @Operation(summary = "게시물 ID로 조회", description = "특정 ID의 게시물을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "게시물 조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "404", description = "게시물을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/{id}")
    public ResponseEntity<BoardResponse> getBoard(
            @Parameter(description = "조회할 게시물 ID", required = true) @PathVariable(name = "id") Long id,
            @Parameter(description = "조회수 증가 여부 (기본값: true)") @RequestParam(name = "postView", required = false, defaultValue = "true") Boolean postView,
            @Parameter(description = "학원 코드 (선택 사항)") @RequestParam(name = "academyCode", required = false) String academyCode) {
        return ResponseEntity.ok(boardService.getBoard(id, postView, academyCode));
    }

    @Operation(summary = "게시물 상태 조회", description = "특정 ID 게시물의 상태(ACTIVE/INACTIVE 등)를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "게시물 상태 조회 성공, {\"isActive\": boolean} 형식으로 반환"),
            @ApiResponse(responseCode = "404", description = "게시물을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/{id}/status")
    public ResponseEntity<Map<String, Boolean>> getBoardStatus(
            @Parameter(description = "상태를 조회할 게시물 ID", required = true) @PathVariable(name = "id") Long id
    ) {
        Status status = boardService.getBoardStatus(id);
        // Status.ACTIVE 인 경우에만 isActive: true 를 반환
        Map<String, Boolean> response = Map.of("isActive", status == Status.ACTIVE);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "게시물 목록 조회", description = "게시물 목록을 페이징 처리하여 조회합니다. type 파라미터로 'notice', 'free' 등을 지정하여 게시판 종류별 조회가 가능합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "게시물 목록 조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 페이지 또는 정렬 파라미터"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping
    public ResponseEntity<Page<BoardResponse>> getBoards(
            @Parameter(description = "페이지 번호 (1부터 시작, 기본값: 1)") @RequestParam(name = "page", defaultValue = "1") int page,
            @Parameter(description = "페이지 크기 (기본값: 10)") @RequestParam(name = "size", defaultValue = "10") int size,
            @Parameter(description = "정렬 기준 (creationTime, viewCount, commentCount, likeCount, 기본값: creationTime)") @RequestParam(name = "sortType", defaultValue = "creationTime") String sortType,
            @Parameter(description = "검색 키워드 (선택 사항)") @RequestParam(name = "keyword", required = false) String searchKeyword,
            @Parameter(description = "태그 필터링 (선택 사항)") @RequestParam(name = "tag", required = false) String tag,
            @Parameter(description = "검색 유형 (all, title, content, writer, tag, 기본값: all)") @RequestParam(name = "searchType", defaultValue = "all") String searchType,
            @Parameter(description = "게시판 타입 (free, notice 등, 기본값: free)") @RequestParam(name = "type", defaultValue = "free") String type,
            @Parameter(description = "학원 코드 (선택 사항, 미지정 시 사용자 정보 기반)") @RequestParam(name = "academyCode", required = false) String academyCode
    ) {
        Long userId = getCurrentUserId();

        if (academyCode == null || academyCode.isEmpty()) {
            academyCode = boardService.getAcademyCodeByUserId(userId);
        }
        Sort sort;
        switch (sortType) {
            case "viewCount":
                sort = Sort.by(Sort.Direction.DESC, "viewCount");
                break;
            case "commentCount":
                sort = Sort.by(Sort.Direction.DESC, "commentCount");
                break;
            case "likeCount":
                sort = Sort.by(Sort.Direction.DESC, "likeCount");
                break;
            case "creationTime":
                sort = Sort.by(Sort.Direction.DESC, "creationTime");
                break;
            default:
                sort = Sort.by(Sort.Direction.DESC, "creationTime");
                break;
        }

         if(tag != null && !tag.isEmpty()){
            searchType = "tag";
            searchKeyword = tag;
         }

        if (page < 1) {
            page = 1;
        }
        Pageable adjustedPageable = PageRequest.of(page - 1, size, sort);


        return ResponseEntity.ok(
                boardService.searchBoardsDynamic(academyCode, searchType, searchKeyword, type, adjustedPageable)
        );
    }

    @Operation(summary = "게시물 수정", description = "특정 ID의 게시물을 수정합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "게시물 수정 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "403", description = "권한 없음 (작성자 아님)"),
            @ApiResponse(responseCode = "404", description = "게시물을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PutMapping("/{id}")
    public ResponseEntity<BoardResponse> updateBoard(
            @Parameter(description = "수정할 게시물 ID", required = true) @PathVariable("id") Long id,
            @Parameter(description = "게시물 수정 요청 정보") @RequestBody BoardRequest request,
            @Parameter(description = "학원 코드 (선택 사항)") @RequestParam(name = "academyCode", required = false) String academyCode
    ) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(boardService.updateBoard(id, request, userId, academyCode));
    }

    @Operation(summary = "게시물 삭제 (사용자)", description = "자신이 작성한 게시물을 삭제 상태(INACTIVE)로 변경합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "게시물 삭제 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "403", description = "권한 없음 (작성자 아님)"),
            @ApiResponse(responseCode = "404", description = "게시물을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(
            @Parameter(description = "삭제할 게시물 ID", required = true) @PathVariable("id") Long id,
            @Parameter(description = "학원 코드 (선택 사항)") @RequestParam(name = "academyCode", required = false) String academyCode
    ) {
        Long userId = getCurrentUserId();
        boardService.deleteBoard(id, userId, academyCode);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "게시물 좋아요 토글", description = "특정 ID의 게시물에 대한 사용자의 좋아요 상태를 토글합니다. 이미 좋아요 했다면 취소, 아니라면 좋아요 처리합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "좋아요 토글 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "404", description = "게시물을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping("/{id}/likes")
    public ResponseEntity<?> toggleLike(
            @Parameter(description = "좋아요 토글할 게시물 ID", required = true) @PathVariable(name="id") Long id,
            @Parameter(description = "학원 코드 (선택 사항)") @RequestParam(name = "academyCode", required = false) String academyCode
    ) {

        Long userId = getCurrentUserId();

        try{
            boardService.toggleLike(id, userId, academyCode);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "서버 내부 오류", "error", e.getMessage()));
        }

    }

    @Operation(summary = "태그별 게시물 목록 조회", description = "특정 태그가 포함된 게시물 목록을 페이징 처리하여 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "태그별 게시물 목록 조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 페이지 또는 정렬 파라미터"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/tag/{tag}")
    public ResponseEntity<Page<BoardResponse>> getBoardsByTag(
            @Parameter(description = "조회할 태그", required = true) @PathVariable String tag,
            @Parameter(description = "페이지 번호 (1부터 시작, 기본값: 1)") @RequestParam(name = "page", defaultValue = "1") int page,
            @Parameter(hidden = true) @PageableDefault(size = 10) Pageable pageable, 
            @Parameter(description = "정렬 기준 (기본값: 등록일순)") @RequestParam(defaultValue = "등록일순") String sortType,
            @Parameter(description = "최소 좋아요 수 필터링 (선택 사항)") @RequestParam(name = "minLikes", required = false) Integer minLikes,
            @Parameter(description = "게시판 타입 필터링 (선택 사항, 기본값: free)") @RequestParam(name = "type", required = false) String type
    ) {
        Long userId = getCurrentUserId();
        Pageable adjustedPageable = PageRequest.of(page - 1, pageable.getPageSize());

        if (sortType == null || sortType.isEmpty()) {
            sortType = "등록일순";
        }

        if (type == null || type.isEmpty()) {
            type = "free";
        }


        return ResponseEntity.ok(
                boardService.getBoardsByTagAndUserId(userId, tag, sortType, minLikes, type, adjustedPageable));
    }

    @Operation(summary = "게시물 신고", description = "특정 ID의 게시물을 신고합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "게시물 신고 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "404", description = "게시물을 찾을 수 없음"),
            @ApiResponse(responseCode = "409", description = "이미 신고한 게시물"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping("/{id}/report")
    public ResponseEntity<Void> createBoardReport(
            @Parameter(description = "신고할 게시물 ID", required = true) @PathVariable("id") Long id
    ) {
        Long userId = getCurrentUserId();
        boardService.createBoardReport(id, userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "게시물 신고 상태 확인", description = "현재 사용자가 특정 게시물을 신고했는지 확인합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "신고 상태 확인 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "404", description = "게시물을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/{id}/report-status")
    public ResponseEntity<Map<String, Boolean>> checkBoardReportStatus(
            @Parameter(description = "확인할 게시물 ID", required = true) @PathVariable("id") Long id
    ) {
        Long userId = getCurrentUserId();

        boolean isReported = boardService.isReportedByUser(id, userId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isReported", isReported);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "게시물 작성자 확인", description = "현재 사용자가 특정 게시물의 작성자인지 확인합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "작성자 확인 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "404", description = "게시물을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/{id}/is-owner")
    public ResponseEntity<Map<String, Boolean>> checkBoardOwner(
            @Parameter(description = "확인할 게시물 ID", required = true) @PathVariable("id") Long id
    ) {
        Long userId = getCurrentUserId();

        boolean isOwner = boardService.isBoardOwner(id, userId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isOwner", isOwner);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "게시물 좋아요 상태 확인", description = "현재 사용자가 특정 게시물을 좋아요했는지 확인합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "좋아요 상태 확인 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "404", description = "게시물을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/{id}/like-status")
    public ResponseEntity<Map<String, Boolean>> checkBoardLikeStatus(
            @Parameter(description = "확인할 게시물 ID", required = true) @PathVariable("id") Long id
    ) {
        Long userId = getCurrentUserId();

        boolean isLiked = boardService.isLikedByUser(id, userId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isLiked", isLiked);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "게시물 조회수 증가", description = "게시물의 조회수를 1 증가시킵니다. 일반적으로 게시물 상세 조회 시 호출됩니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회수 증가 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"), 
            @ApiResponse(responseCode = "404", description = "게시물을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping("/{id}/view")
    public ResponseEntity<Void> increaseViewCount(
            @Parameter(description = "조회수를 증가시킬 게시물 ID", required = true) @PathVariable("id") Long id
    ) {
        getCurrentUserId(); 
        boardService.increaseViewCount(id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "인기 태그 목록 조회", description = "지정된 조건(최소 좋아요 수, 게시판 타입)에 맞는 인기 태그 목록을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "인기 태그 목록 조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/tags/popular")
    public ResponseEntity<List<TagResponse>> getPopularTags(
            @Parameter(description = "최소 좋아요 수 필터링 (선택 사항). 'popular' 타입 요청 시 기본 10") @RequestParam(name = "minLikes", required = false) Integer minLikesParam,
            @Parameter(description = "게시판 타입 필터링 (free, notice 등). 'popular' 요청 시 무시됨. (선택 사항, 기본값: free)") @RequestParam(name = "type", required = false) String typeParam
    ) {
        Long userId = getCurrentUserId();
        String actualType = "free";
        Integer actualMinLikes = null;

        if ("popular".equalsIgnoreCase(typeParam)) {
            actualMinLikes = 10;
        } else if (typeParam != null && !typeParam.isEmpty()) {
            actualType = typeParam;
            actualMinLikes = minLikesParam;
        } else {
            actualMinLikes = minLikesParam;
        }


        if (actualMinLikes != null) {
            return ResponseEntity.ok(boardService.getPopularTagsByUserId(userId, actualMinLikes, actualType));
        } else {
            return ResponseEntity.ok(boardService.getPopularTagsByUserId(userId, actualType));
        }
    }

    @Operation(summary = "태그/키워드 기반 게시물 검색 (Deprecated)", description = "태그 또는 키워드로 게시물을 검색합니다. '/api/v1/posts' 엔드포인트 사용을 권장합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "게시물 검색 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 검색 파라미터"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/tags")
    @Deprecated
    public ResponseEntity<Page<BoardResponse>> getTaggedBoards(
            @Parameter(description = "페이지 번호 (1부터 시작, 기본값: 1)") @RequestParam(name = "page", defaultValue = "1") int page,
            @Parameter(description = "페이지 크기 (기본값: 10)") @RequestParam(name = "size", defaultValue = "10") int size,
            @Parameter(description = "정렬 기준 (기본값: 등록일순)") @RequestParam(name = "sortType", defaultValue = "등록일순") String sortType,
            @Parameter(description = "검색 키워드 (tag 또는 keyword 중 하나 필요)") @RequestParam(name = "keyword", required = false) String keyword,
            @Parameter(description = "태그 필터링 (tag 또는 keyword 중 하나 필요)") @RequestParam(name = "tag", required = false) String tag,
            @Parameter(description = "검색 유형 (keyword 사용 시 선택 사항)") @RequestParam(name = "searchType", required = false) String searchType,
            @Parameter(description = "최소 좋아요 수 필터링 (선택 사항)") @RequestParam(name = "minLikes", required = false) Integer minLikes,
            @Parameter(description = "게시판 타입 필터링 (선택 사항)") @RequestParam(name = "type", required = false) String type
    ) {

        Long userId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page - 1, size);

        if (StringUtils.hasText(tag)) {
            return ResponseEntity.ok(boardService.getBoardsByTagAndUserId(userId, tag, sortType, minLikes, type, pageable));
        } else if (StringUtils.hasText(keyword)) {
            if (StringUtils.hasText(searchType)) {
                return ResponseEntity.ok(
                        boardService.searchBoardsByTypeAndUserId(userId, searchType, keyword, sortType, minLikes, type, pageable));
            } else {
                return ResponseEntity.ok(
                        boardService.searchBoardsByUserId(userId, keyword, sortType, minLikes, type, pageable));
            }
        } else {
            return ResponseEntity.ok(boardService.getBoardsByUserId(userId, sortType, minLikes, type, pageable));
        }
    }

    @Operation(summary = "내가 작성한 게시글 목록 조회", description = "현재 로그인한 사용자가 작성한 게시글 목록을 페이징 처리하여 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "내가 작성한 게시글 목록 조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/my")
    public ResponseEntity<Page<BoardResponse>> getMyPosts(
            @Parameter(hidden = true) 
            @PageableDefault(size = 10, sort = "creationTime", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userId = getCurrentUserId();
        Page<BoardResponse> posts = boardService.getMyBoards(userId, pageable);
        return ResponseEntity.ok(posts);
    }

    @Operation(summary = "내가 좋아요한 게시글 목록 조회", description = "현재 로그인한 사용자가 좋아요를 누른 게시글 목록을 페이징 처리하여 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "내가 좋아요한 게시글 목록 조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/my/likes")
    public ResponseEntity<Page<BoardResponse>> getLikedPosts(
            @Parameter(hidden = true) 
            @PageableDefault(size = 10, sort = "creationTime", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userId = getCurrentUserId();
        Page<BoardResponse> likedPosts = boardService.getLikedBoards(userId, pageable);
        return ResponseEntity.ok(likedPosts);
    }

    @Operation(summary = "공지사항 목록 조회", description = "공지사항 게시판('notice' 타입)의 게시물 목록을 페이징 처리하여 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "공지사항 목록 조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 페이지 또는 정렬 파라미터"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/notice")
    public ResponseEntity<Page<BoardResponse>> getNoticeBoards(
            @Parameter(description = "페이지 번호 (1부터 시작, 기본값: 1)") @RequestParam(name = "page", defaultValue = "1") int page,
            @Parameter(description = "페이지 크기 (기본값: 10)") @RequestParam(name = "size", defaultValue = "10") int size,
            @Parameter(description = "정렬 기준 (creationTime, viewCount, commentCount, likeCount, 기본값: creationTime)") @RequestParam(name = "sortType", defaultValue = "creationTime") String sortType,
            @Parameter(description = "검색 키워드 (선택 사항)") @RequestParam(name = "keyword", required = false) String searchKeyword,
            @Parameter(description = "검색 유형 (all, title, content, writer, 기본값: all)") @RequestParam(name = "searchType", required = false) String searchType, // 기본값 "all" 추가
            @Parameter(description = "학원 코드 (선택 사항, 미지정 시 사용자 정보 기반)") @RequestParam(name = "academyCode", required = false) String academyCode) {

        Long userId = getCurrentUserId();
        if (academyCode == null || academyCode.isEmpty()) {
            academyCode = boardService.getAcademyCodeByUserId(userId);
        }
        if (searchType == null || searchType.isEmpty()) {
            searchType = "all";
        }

        final String noticeType = "notice";

        Sort sort;
        switch (sortType) {
            case "viewCount":
                sort = Sort.by(Sort.Direction.DESC, "viewCount");
                break;
            case "commentCount":
                sort = Sort.by(Sort.Direction.DESC, "commentCount");
                break;
            case "likeCount":
                sort = Sort.by(Sort.Direction.DESC, "likeCount");
                break;
            case "creationTime":
            default:
                sort = Sort.by(Sort.Direction.DESC, "creationTime");
                break;
        }


        Pageable pageable = PageRequest.of(page - 1, size, sort);

        return ResponseEntity.ok(
                boardService.searchBoardsDynamic(academyCode, searchType, searchKeyword, noticeType, pageable)
        );
    }

    @Operation(summary = "내가 좋아요한 게시글 ID 목록 조회", description = "현재 로그인한 사용자가 좋아요를 누른 모든 게시글의 ID 목록을 반환합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "내가 좋아요한 게시글 ID 목록 조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/my/like-status")
    public ResponseEntity<List<Long>> getLikedPostIds() {
        Long userId = getCurrentUserId();
        List<Long> likedIds = boardService.getLikedBoardIds(userId);
        return ResponseEntity.ok(likedIds);
    }

    @Operation(summary = "게시물 상태 변경 (관리자)", description = "관리자가 특정 게시물의 상태(예: ACTIVE, INACTIVE, DELETED)를 변경합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "게시물 상태 변경 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터 (상태 누락 등)"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "403", description = "권한 없음 (관리자 아님)"),
            @ApiResponse(responseCode = "404", description = "게시물을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping("/{id}/admin-status-change")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> adminChangeBoardStatus(
            @Parameter(description = "상태를 변경할 게시물 ID", required = true) @PathVariable("id") Long id,
            @Parameter(description = "변경할 상태 정보") @RequestBody AdminStatusChangeRequestDto requestDto
    ) {
        if (requestDto == null || requestDto.getStatus() == null) {
            return ResponseEntity.badRequest().build();
        }
        boardService.adminChangeBoardStatus(id, requestDto.getStatus());
        return ResponseEntity.ok().build();
    }

}