package com.golden_dobakhe.HakPle.domain.post.post.repository;

import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.global.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {

    @EntityGraph(attributePaths = {"user", "tags", "tags.hashtag"})
    @Query("SELECT b FROM Board b WHERE b.academyCode = :academyCode AND b.status = :status " +
            "AND (:type IS NULL OR :type = '' OR b.type = :type) " +
            "AND ((:minLikes IS NULL) OR (SIZE(b.boardLikes) >= :minLikes)) " +
            "ORDER BY " +
            "CASE WHEN :sortType = '조회순' THEN b.viewCount ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '댓글순' THEN SIZE(b.comments) ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '좋아요순' THEN SIZE(b.boardLikes) ELSE 0 END DESC, " +
            "b.creationTime DESC")
    Page<Board> findByAcademyCodeAndStatusAndType(
            @Param("academyCode") String academyCode,
            @Param("status") Status status,
            @Param("type") String type,
            @Param("sortType") String sortType,
            @Param("minLikes") Integer minLikes,
            Pageable pageable);

    @EntityGraph(attributePaths = {"user", "tags", "tags.hashtag"})
    @Query("SELECT b FROM Board b WHERE b.academyCode = :academyCode AND b.status = 'ACTIVE' " +
            "AND (LOWER(b.title) LIKE CONCAT('%', LOWER(:keyword), '%') OR LOWER(b.user.nickName) LIKE CONCAT('%', LOWER(:keyword), '%')) " +
            "AND (:type IS NULL OR :type = '' OR b.type = :type) " +
            "AND ((:minLikes IS NULL) OR (SIZE(b.boardLikes) >= :minLikes)) " +
            "ORDER BY " +
            "CASE WHEN :sortType = '조회순' THEN b.viewCount ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '댓글순' THEN SIZE(b.comments) ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '좋아요순' THEN SIZE(b.boardLikes) ELSE 0 END DESC, " +
            "b.creationTime DESC")
    Page<Board> searchBoards(@Param("academyCode") String academyCode,
                             @Param("keyword") String keyword,
                             @Param("sortType") String sortType,
                             @Param("minLikes") Integer minLikes,
                             @Param("type") String type,
                             Pageable pageable);

    @EntityGraph(attributePaths = {"user", "tags", "tags.hashtag"})
    @Query("SELECT DISTINCT b FROM Board b " +
            "JOIN b.tags t " +
            "WHERE b.academyCode = :academyCode " +
            "AND b.status = 'ACTIVE' " +
            "AND LOWER(t.hashtag.hashtagName) LIKE CONCAT('%', LOWER(:tag), '%') " +
            "AND (:type IS NULL OR :type = '' OR b.type = :type) " +
            "AND ((:minLikes IS NULL) OR (SIZE(b.boardLikes) >= :minLikes)) " +
            "ORDER BY " +
            "CASE WHEN :sortType = '조회순' THEN b.viewCount ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '댓글순' THEN SIZE(b.comments) ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '좋아요순' THEN SIZE(b.boardLikes) ELSE 0 END DESC, " +
            "b.creationTime DESC")
    Page<Board> findByTagAndAcademyCode(@Param("academyCode") String academyCode,
                                        @Param("tag") String tag,
                                        @Param("sortType") String sortType,
                                        @Param("minLikes") Integer minLikes,
                                        @Param("type") String type,
                                        Pageable pageable);

    @EntityGraph(attributePaths = {"user", "tags", "tags.hashtag"})
    @Query("SELECT DISTINCT b FROM Board b " +
            "LEFT JOIN b.tags t " +
            "WHERE b.academyCode = :academyCode " +
            "AND b.status = 'ACTIVE' " +
            "AND (" +
            "   (:searchType = '태그' AND EXISTS (SELECT 1 FROM b.tags tag WHERE LOWER(tag.hashtag.hashtagName) LIKE CONCAT('%', LOWER(:keyword), '%'))) " +
            "   OR (:searchType = '작성자' AND LOWER(b.user.nickName) LIKE CONCAT('%', LOWER(:keyword), '%')) " +
            "   OR (:searchType = '제목' AND LOWER(b.title) LIKE CONCAT('%', LOWER(:keyword), '%')) " +
            ") " +
            "AND (:type IS NULL OR :type = '' OR b.type = :type) " +
            "AND ((:minLikes IS NULL) OR (SIZE(b.boardLikes) >= :minLikes)) " +
            "ORDER BY " +
            "CASE WHEN :sortType = '조회순' THEN b.viewCount ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '댓글순' THEN SIZE(b.comments) ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '좋아요순' THEN SIZE(b.boardLikes) ELSE 0 END DESC, " +
            "b.creationTime DESC")
    Page<Board> searchBoardsByType(
            @Param("academyCode") String academyCode,
            @Param("searchType") String searchType,
            @Param("keyword") String keyword,
            @Param("sortType") String sortType,
            @Param("minLikes") Integer minLikes,
            @Param("type") String type,
            Pageable pageable);

    @EntityGraph(attributePaths = {"user", "tags", "tags.hashtag"})
    @Query("SELECT b FROM Board b WHERE b.user.id = :userId AND b.status = :status")
    Page<Board> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Status status, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "tags", "tags.hashtag"})
    @Query("SELECT b FROM Board b WHERE b.academyCode = :academyCode AND b.status = :status AND b.type = :type " +
            "ORDER BY " +
            "CASE WHEN :sortType = '조회순' THEN b.viewCount ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '댓글순' THEN SIZE(b.comments) ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '좋아요순' THEN SIZE(b.boardLikes) ELSE 0 END DESC, " +
            "b.creationTime DESC")
    Page<Board> findByAcademyCodeAndStatusAndTypeOnly(
            @Param("academyCode") String academyCode,
            @Param("status") Status status,
            @Param("type") String type,
            @Param("sortType") String sortType,
            Pageable pageable);

    @EntityGraph(attributePaths = {"user", "tags", "tags.hashtag"})
    @Query("SELECT b FROM Board b " +
           "WHERE b.academyCode = :academyCode " +
           "AND b.status = :status " +
           "AND b.type = 'notice' " +
           "AND (LOWER(b.title) LIKE CONCAT('%', LOWER(:keyword), '%') " +
           "     OR LOWER(b.user.nickName) LIKE CONCAT('%', LOWER(:keyword), '%')) " +
           "ORDER BY " +
           "CASE WHEN :sortType = '조회순' THEN b.viewCount ELSE 0 END DESC, " +
           "CASE WHEN :sortType = '댓글순' THEN SIZE(b.comments) ELSE 0 END DESC, " +
           "CASE WHEN :sortType = '좋아요순' THEN SIZE(b.boardLikes) ELSE 0 END DESC, " +
           "b.creationTime DESC")
    Page<Board> searchNoticeBoards(
            @Param("academyCode") String academyCode,
            @Param("status") Status status,
            @Param("keyword") String keyword,
            @Param("sortType") String sortType,
            Pageable pageable);

    @EntityGraph(attributePaths = {"user", "tags", "tags.hashtag"})
    @Query(value = "SELECT DISTINCT b FROM Board b " +
            "LEFT JOIN b.comments c " +
            "LEFT JOIN b.boardLikes bl " +
            "WHERE b.academyCode = :academyCode " +
            "AND b.status = :status " +
            "AND (:type IS NULL OR :type = '' OR b.type = :type) " +
            "AND (LOWER(b.title) LIKE CONCAT('%', LOWER(:keyword), '%') " +
            "     OR LOWER(b.user.nickName) LIKE CONCAT('%', LOWER(:keyword), '%')) " +
            "GROUP BY b " +
            "ORDER BY " +
            "CASE WHEN :sortType = '조회순' THEN b.viewCount ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '댓글순' THEN COUNT(CASE WHEN c.status = 'ACTIVE' THEN 1 ELSE NULL END) ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '좋아요순' THEN COUNT(bl) ELSE 0 END DESC, " +
            "b.creationTime DESC")
    Page<Board> searchNoticeBoardsWithTypeAndCounts(
            @Param("academyCode") String academyCode,
            @Param("status") Status status,
            @Param("keyword") String keyword,
            @Param("sortType") String sortType,
            @Param("type") String type,
            Pageable pageable);

    @EntityGraph(attributePaths = {"user", "tags", "tags.hashtag"})
    @Query(value = "SELECT DISTINCT b FROM Board b " +
            "LEFT JOIN b.comments c " +
            "LEFT JOIN b.boardLikes bl " +
            "WHERE b.academyCode = :academyCode AND b.status = :status " +
            "AND (:type IS NULL OR :type = '' OR b.type = :type) " +
            "GROUP BY b " +
            "ORDER BY " +
            "CASE WHEN :sortType = '조회순' THEN b.viewCount ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '댓글순' THEN COUNT(CASE WHEN c.status = 'ACTIVE' THEN 1 ELSE NULL END) ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '좋아요순' THEN COUNT(bl) ELSE 0 END DESC, " +
            "b.creationTime DESC")
    Page<Board> findByAcademyCodeAndStatusAndTypeWithCounts(
            @Param("academyCode") String academyCode,
            @Param("status") Status status,
            @Param("type") String type,
            @Param("sortType") String sortType,
            Pageable pageable);

    @EntityGraph(attributePaths = {"user", "tags", "tags.hashtag"})
    @Query("SELECT b FROM Board b WHERE b.academyCode = :academyCode AND b.status = :status " +
            "AND (b.type IS NULL OR b.type = 'free') " +
            "AND ((:minLikes IS NULL) OR (SIZE(b.boardLikes) >= :minLikes)) " +
            "ORDER BY " +
            "CASE WHEN :sortType = '조회순' THEN b.viewCount ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '댓글순' THEN SIZE(b.comments) ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '좋아요순' THEN SIZE(b.boardLikes) ELSE 0 END DESC, " +
            "b.creationTime DESC")
    Page<Board> findByAcademyCodeAndStatusExcludeNotice(
            @Param("academyCode") String academyCode,
            @Param("status") Status status,
            @Param("sortType") String sortType,
            @Param("minLikes") Integer minLikes,
            Pageable pageable);

    @EntityGraph(attributePaths = {"user", "tags", "tags.hashtag"})
    @Query("SELECT b FROM Board b WHERE b.user.id = :userId")
    Page<Board> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Modifying
    @Query("DELETE FROM Image i WHERE i.board.id = :boardId")
    void deleteImagesByBoardId(@Param("boardId") Long boardId);

    @Modifying
    @Query("DELETE FROM TagMapping tm WHERE tm.board.id = :boardId")
    void deleteTagMappingsByBoardId(@Param("boardId") Long boardId);

    Page<Board> findByStatus(Status status, Pageable pageable);
    
    Page<Board> findByAcademyCode(String academyCode, Pageable pageable);
    
    @Query("SELECT b FROM Board b WHERE b.status = :status AND b.academyCode = :academyCode")
    Page<Board> findByStatusAndAcademyCode(@Param("status") Status status, @Param("academyCode") String academyCode, Pageable pageable);
    
    @Query("SELECT b FROM Board b WHERE b.academyCode = :academyCode AND b.status = :status AND (b.type IS NULL OR b.type = 'free')")
    Page<Board> findByAcademyCodeAndTypeNullOrFree(@Param("academyCode") String academyCode, @Param("status") Status status, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "tags", "tags.hashtag"})
    @Query("SELECT b FROM Board b WHERE b.academyCode = :academyCode AND b.status = :status " +
            "AND (:type IS NULL OR :type = '' OR b.type = :type) " +
            "ORDER BY " +
            "CASE WHEN :sortType = '조회순' THEN b.viewCount ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '댓글순' THEN SIZE(b.comments) ELSE 0 END DESC, " +
            "CASE WHEN :sortType = '좋아요순' THEN SIZE(b.boardLikes) ELSE 0 END DESC, " +
            "b.creationTime DESC")
    Page<Board> findByAcademyCodeAndStatusAndTypeFlexible(
            @Param("academyCode") String academyCode,
            @Param("status") Status status,
            @Param("type") String type,
            @Param("sortType") String sortType,
            Pageable pageable);
}
