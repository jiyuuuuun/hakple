package com.golden_dobakhe.HakPle.domain.post.post.repository;

import com.golden_dobakhe.HakPle.domain.post.post.entity.Hashtag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface HashtagRepository extends JpaRepository<Hashtag, Long> {
    Optional<Hashtag> findByHashtagNameAndAcademyCode(String hashtagName, String academyCode);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM Hashtag h WHERE h.hashtagName = :name AND h.academyCode = :code")
    Optional<Hashtag> findByHashtagNameAndAcademyCodeWithLock(
            @Param("name") String hashtagName, 
            @Param("code") String academyCode);
}
