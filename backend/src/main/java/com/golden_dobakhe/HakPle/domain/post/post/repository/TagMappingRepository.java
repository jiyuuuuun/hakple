package com.golden_dobakhe.HakPle.domain.post.post.repository;

import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.post.post.entity.TagMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TagMappingRepository extends JpaRepository<TagMapping, Long> {
    void deleteByBoard(Board board);

    @Query("SELECT t.hashtag.hashtagName as hashtagName, COUNT(DISTINCT b.id) as count " +
           "FROM TagMapping t " +
           "JOIN t.board b " +
           "WHERE b.academyCode = :academyCode " +
           "AND b.status = 'ACTIVE' " +
           "GROUP BY t.hashtag.hashtagName " +
           "ORDER BY count DESC")
    List<TagCount> findPopularTagsByAcademyCode(@Param("academyCode") String academyCode);

    @Query(nativeQuery = true, 
           value = "SELECT h.hashtag_name as hashtagName, COUNT(t.id) as count " +
           "FROM tag_mapping t " +
           "JOIN board b ON t.board_id = b.id " +
           "JOIN hashtag h ON t.hashtag_id = h.id " +
           "WHERE b.academy_code = :academyCode " +
           "AND b.status = 'ACTIVE' " +
           "GROUP BY h.hashtag_name " +
           "ORDER BY count DESC " +
           "LIMIT 5")
    List<TagCount> findTop5PopularTagsByAcademyCode(@Param("academyCode") String academyCode);
    
    @Query(nativeQuery = true, 
           value = "SELECT h.hashtag_name as hashtagName, COUNT(t.id) as count " +
           "FROM tag_mapping t " +
           "JOIN board b ON t.board_id = b.id " +
           "JOIN hashtag h ON t.hashtag_id = h.id " +
           "WHERE b.user_id = :userId " +
           "AND b.status = 'ACTIVE' " +
           "GROUP BY h.hashtag_name " +
           "ORDER BY count DESC " +
           "LIMIT 5")
    List<TagCount> findTop5PopularTagsByUserId(@Param("userId") Long userId);

    interface TagCount {
        String getHashtagName();
        Long getCount();
    }
}