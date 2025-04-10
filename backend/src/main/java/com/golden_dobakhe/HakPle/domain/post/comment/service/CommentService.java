package com.golden_dobakhe.HakPle.domain.post.comment.service;

import com.golden_dobakhe.HakPle.domain.post.comment.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional // 모든 public 메서드가 트랜잭션 범위 안에서 실행
@RequiredArgsConstructor
public class CommentService {
    public final CommentRepository commentRepository;

}
