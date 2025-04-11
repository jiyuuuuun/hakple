package com.golden_dobakhe.HakPle.domain.post.post.repository;

import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
}
