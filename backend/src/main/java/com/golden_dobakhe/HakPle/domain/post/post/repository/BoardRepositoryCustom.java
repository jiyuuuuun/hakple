package com.golden_dobakhe.HakPle.domain.post.post.repository;

import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BoardRepositoryCustom {
    
    Page<Board> searchBoardsDynamic(
        String academyCode,
        String searchType, 
        String searchKeyword,
        String type,
        Pageable pageable
    );
} 