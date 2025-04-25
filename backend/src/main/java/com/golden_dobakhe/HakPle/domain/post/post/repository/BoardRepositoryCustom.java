package com.golden_dobakhe.HakPle.domain.post.post.repository;

import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BoardRepositoryCustom {
    
    /**
     * 게시글 동적 검색을 위한 QueryDSL 메서드
     * @param academyCode 학원 코드 (필수)
     * @param searchType 검색 유형 (title, content, writer, tag, all)
     * @param searchKeyword 검색 키워드
     * @param type 게시글 타입 (notice, free, popular)
     * @param pageable 페이징 정보
     * @return 검색 결과 페이지
     */
    Page<Board> searchBoardsDynamic(
        String academyCode,
        String searchType, 
        String searchKeyword,
        String type,
        Pageable pageable
    );
} 