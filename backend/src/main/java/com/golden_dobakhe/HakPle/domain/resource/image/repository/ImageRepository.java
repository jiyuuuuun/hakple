package com.golden_dobakhe.HakPle.domain.resource.image.repository;

import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.resource.image.entity.Image;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ImageRepository extends JpaRepository<Image, Long> {
    Image findByUser(User user);
    
    // 게시글에 연결된 이미지 목록 찾기
    List<Image> findByBoard(Board board);
    
    // 게시글에 연결된 이미지 목록 찾기 (ID로)
    List<Image> findByBoardId(Long boardId);
    
    // 게시글에 연결된 이미지 존재 여부 확인 (최적화된 쿼리)
    @Query(value = "SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END FROM Image i WHERE i.board.id = :boardId")
    boolean existsByBoardId(@Param("boardId") Long boardId);
    
    // 게시글에 연결된 이미지 개수 조회
    Long countByBoardId(Long boardId);
    
    // 임시 식별자로 이미지 찾기
    Optional<Image> findByTempId(String tempId);
    
    // 여러 임시 식별자로 이미지 찾기
    List<Image> findByTempIdIn(List<String> tempIds);
    
    // 게시글에 연결되지 않은 임시 이미지 조회
    List<Image> findByBoardIsNull();
    
    // 특정 게시글 ID와 임시 식별자로 이미지 업데이트
    @Modifying
    @Query("UPDATE Image i SET i.board.id = :boardId WHERE i.tempId IN :tempIds")
    int updateBoardIdByTempIds(@Param("boardId") Long boardId, @Param("tempIds") List<String> tempIds);

    List<Image> findByIsTemporaryTrueAndExpiresAtBefore(LocalDateTime dateTime);
}