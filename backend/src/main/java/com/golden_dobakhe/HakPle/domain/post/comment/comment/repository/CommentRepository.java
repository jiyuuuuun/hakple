package com.golden_dobakhe.HakPle.domain.post.comment.comment.repository;

import com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.Comment;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.global.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment,Long> {

    // 게시글 ID와 상태로 댓글 개수 조회
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.board.id = :boardId AND c.status = :status")
    int countByBoardIdAndStatus(@Param("boardId") Long boardId, @Param("status") Status status);

    @Query("""
    SELECT c FROM Comment c
    JOIN FETCH c.user
    WHERE c.board.id = :boardId AND c.status = :status
    ORDER BY c.creationTime ASC
    """)
    List<Comment> findWithUserByBoardIdAndStatus(
            @Param("boardId") Long boardId,
            @Param("status") Status status
    );



    Page<Comment> findAllByUserAndStatus(User user,Status status,Pageable pageable);

}
