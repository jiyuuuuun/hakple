package com.golden_dobakhe.HakPle.domain.post.comment.report.repository;


import com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.Comment;
import com.golden_dobakhe.HakPle.domain.post.comment.report.entity.CommentReport;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;



public interface CommentReportRepository extends JpaRepository<CommentReport, Long> {

    boolean existsByCommentAndReporter(Comment comment, User reporter);

    int countByCommentId(Long commentId);

    @Query("""
    SELECT cr FROM CommentReport cr
    JOIN FETCH cr.comment c
    JOIN FETCH cr.reporter u
    WHERE c.status = 'INACTIVE'
    """)//INACTIVE 조건 추가
    Page<CommentReport> findAllWithUserAndComment(Pageable pageable);

}
