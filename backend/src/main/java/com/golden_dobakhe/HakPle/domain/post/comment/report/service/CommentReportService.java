package com.golden_dobakhe.HakPle.domain.post.comment.report.service;

import com.golden_dobakhe.HakPle.domain.post.comment.CommentResult;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.Comment;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.repository.CommentRepository;
import com.golden_dobakhe.HakPle.domain.post.comment.exception.CommentException;
import com.golden_dobakhe.HakPle.domain.post.comment.report.entity.CommentReport;
import com.golden_dobakhe.HakPle.domain.post.comment.report.repository.CommentReportRepository;
import com.golden_dobakhe.HakPle.domain.user.exception.UserErrorCode;
import com.golden_dobakhe.HakPle.domain.user.exception.UserException;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import com.golden_dobakhe.HakPle.global.Status;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CommentReportService {
    private final CommentReportRepository reportRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    //댓글 신고
    public void reportComment(Long commentId,Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentException(CommentResult.COMMENT_NOT_FOUND));

        User user=userRepository.findById(comment.getUser().getId()).orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        User reporter = userRepository.findById(userId)
                .orElseThrow(() -> new CommentException(CommentResult.USER_NOT_FOUND));
                
        // 자신의 댓글 신고 방지
        if (comment.getUser().getId().equals(userId)) {
            throw new CommentException(CommentResult.CANNOT_REPORT_OWN_COMMENT);
        }

        // 중복 신고 방지
        boolean alreadyReported = reportRepository.existsByCommentAndReporter(comment,reporter);
        if (alreadyReported) {
            throw new CommentException(CommentResult.ALREADY_REPORT);
        }

        CommentReport report = CommentReport.builder()
                .comment(comment)
                .reporter(reporter)
                .build();

        user.setReportedCount(user.getReportedCount() + 1); //신고 횟수 누적
        log.info("UserReportCount : {}", user.getReportedCount());

        reportRepository.save(report);
    }
    
    // 사용자가 댓글을 신고했는지 확인하는 메서드
    @Transactional(readOnly = true)
    public boolean isReportedByUser(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentException(CommentResult.COMMENT_NOT_FOUND));
                
        User reporter = userRepository.findById(userId)
                .orElseThrow(() -> new CommentException(CommentResult.USER_NOT_FOUND));
                
        return reportRepository.existsByCommentAndReporter(comment, reporter);
    }
    
    // 작성자와 로그인 사용자가 같은지 확인하는 메서드
    @Transactional(readOnly = true)
    public boolean isCommentOwner(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentException(CommentResult.COMMENT_NOT_FOUND));
                
        return comment.getUser().getId().equals(userId);
    }
}
