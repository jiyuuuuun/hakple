package com.golden_dobakhe.HakPle.domain.user.user.repository;

import com.golden_dobakhe.HakPle.domain.user.user.entity.Academy;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AcademyRepository extends JpaRepository<Academy, Long> {
    boolean existsByAcademyCode(String academyCode);
    Optional<Academy> findByAcademyCode(String academyCode);
}
