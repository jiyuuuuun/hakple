package com.golden_dobakhe.HakPle.domain.resource.image.repository;

import com.golden_dobakhe.HakPle.domain.resource.image.entity.Image;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ImageRepository extends JpaRepository<Image, Long> {

    List<Image> findByBoardId(Long boardId);

    @Query(value = "SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END FROM Image i WHERE i.board.id = :boardId")
    boolean existsByBoardId(@Param("boardId") Long boardId);

    List<Image> findByTempIdIn(List<String> tempIds);

    List<Image> findByBoardIsNull();

    @Modifying
    @Query("UPDATE Image i SET i.board.id = :boardId WHERE i.tempId IN :tempIds")
    int updateBoardIdByTempIds(@Param("boardId") Long boardId, @Param("tempIds") List<String> tempIds);

    List<Image> findByIsTemporaryTrueAndExpiresAtBefore(LocalDateTime dateTime);
}