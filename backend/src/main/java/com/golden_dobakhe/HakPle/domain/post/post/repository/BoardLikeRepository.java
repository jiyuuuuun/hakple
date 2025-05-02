package com.golden_dobakhe.HakPle.domain.post.post.repository;

import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.post.post.entity.BoardLike;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


@Repository
public interface BoardLikeRepository extends JpaRepository<BoardLike, Long> {
    Optional<BoardLike> findByBoardIdAndUserId(Long boardId, Long userId);

    @Query("SELECT b FROM BoardLike bl JOIN bl.board b WHERE bl.user.id = :userId AND b.status = 'ACTIVE'")
    Page<Board> findLikedBoardsByUserId(@Param("userId") Long userId, Pageable pageable);

    Collection<BoardLike> findByUserId(Long userId);
}
