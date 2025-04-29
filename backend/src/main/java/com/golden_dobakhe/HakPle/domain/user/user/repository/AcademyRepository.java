package com.golden_dobakhe.HakPle.domain.user.user.repository;

import com.golden_dobakhe.HakPle.domain.user.admin.dto.AcademyWithUserCountDto;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Academy;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AcademyRepository extends JpaRepository<Academy, Long> {
    boolean existsByAcademyCode(String academyCode);

    Optional<Academy> findByAcademyCode(String academyCode);

    @Query("SELECT new com.golden_dobakhe.HakPle.domain.user.admin.dto.AcademyWithUserCountDto(a.academyCode, a.academyName, a.phoneNum, COUNT(u),a.creationTime) "
            +
            "FROM Academy a LEFT JOIN User u ON u.academyId = a.academyCode " +
            "GROUP BY a.academyCode, a.academyName, a.phoneNum")
    Page<AcademyWithUserCountDto> findAllAcademiesWithUserCount(Pageable pageable);
}
