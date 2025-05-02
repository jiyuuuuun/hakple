package com.golden_dobakhe.HakPle.domain.post.comment.comment.service;

import com.golden_dobakhe.HakPle.domain.notification.entity.NotificationType;
import com.golden_dobakhe.HakPle.domain.notification.service.NotificationService;
import com.golden_dobakhe.HakPle.domain.post.comment.CommentResult;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.dto.CommentRequestDto;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.dto.CommentResponseDto;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.Comment;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.repository.CommentRepository;
import com.golden_dobakhe.HakPle.domain.post.comment.exception.CommentException;
import com.golden_dobakhe.HakPle.domain.post.comment.like.entity.CommentLike;
import com.golden_dobakhe.HakPle.domain.post.comment.like.repository.LikeRepository;
import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.post.post.repository.BoardRepository;
import com.golden_dobakhe.HakPle.domain.user.exception.UserErrorCode;
import com.golden_dobakhe.HakPle.domain.user.exception.UserException;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Role;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import com.golden_dobakhe.HakPle.global.Status;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private static final int MAX_COMMENT_BYTE_LENGTH = 10000;

    public final CommentRepository commentRepository;
    public final BoardRepository boardRepository;
    public final UserRepository userRepository;
    public final LikeRepository likeRepository;
    public final NotificationService notificationService;


    public List<CommentResponseDto> getCommentsByBoardId(Long boardId) {

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글이 존재하지 않습니다."));

        List<Comment> comments = board.getComments();

        return comments.stream()
                .filter(comment -> comment.getStatus() == Status.ACTIVE)
                .map(CommentResponseDto::fromEntity)
                .collect(Collectors.toList());
    }


    public List<CommentResponseDto> getCommentsByBoardId(Long boardId, Long userId) {

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글이 존재하지 않습니다."));

        List<Comment> comments = board.getComments().stream()
                .filter(comment -> comment.getStatus() == Status.ACTIVE)
                .collect(Collectors.toList());

        if (comments.isEmpty()) {
            return List.of();
        }

        List<Long> commentIds = comments.stream()
                .map(Comment::getId)
                .collect(Collectors.toList());

        List<CommentLike> likes = likeRepository.findByCommentIdInAndUserId(commentIds, userId);

        Set<Long> likedCommentIds = likes.stream()
                .map(like -> like.getComment().getId())
                .collect(Collectors.toSet());

        List<CommentResponseDto> result = comments.stream()
                .map(comment -> {
                    boolean isLiked = likedCommentIds.contains(comment.getId());

                    CommentResponseDto dto = CommentResponseDto.fromEntity(comment, isLiked);
                    return dto;
                })
                .collect(Collectors.toList());

        return result;
    }

    //댓글 저장
    @Transactional
    public Comment commentSave(CommentRequestDto commentRequestDto, Long userId) {
        Board board = boardRepository.findById(commentRequestDto.getBoardId())
                .orElseThrow(() -> new CommentException(CommentResult.BOARD_NOT_FOUND));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CommentException(CommentResult.USER_NOT_FOUND));

        String content = commentRequestDto.getContent();

        if (!StringUtils.hasText(content)) {
            throw CommentException.invalidRequest("댓글 내용은 비어 있을 수 없습니다.");
        }

        int byteLength = content.getBytes(StandardCharsets.UTF_8).length;

        if (byteLength > MAX_COMMENT_BYTE_LENGTH) {
            throw CommentException.invalidRequest(
                    "댓글은 최대 " + MAX_COMMENT_BYTE_LENGTH + "바이트까지만 입력 가능합니다. 현재: " + byteLength + "바이트");
        }

        Comment comment = Comment.builder()
                .board(board)
                .content(content)
                .user(user)
                .status(Status.ACTIVE)
                .build();

        commentRepository.save(comment);

        if (!board.getUser().getId().equals(userId)) {
            String message = String.format("회원님이 작성한 글 '%s'에 댓글이 달렸습니다.", board.getTitle());
            String link = "/post/" + board.getId();
            notificationService.createNotification(
                    board.getUser(),
                    NotificationType.POST_COMMENT,
                    message,
                    link,
                    board.getId()
            );
        }

        return comment;
    }


    //댓글 수정
    @Transactional
    public CommentResult commentUpdate(CommentRequestDto commentRequestDto, Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return CommentResult.USER_NOT_FOUND;
        }

        if (commentRequestDto.getContent() == null || commentRequestDto.getContent().trim().isEmpty()) {

            return CommentResult.EMPTY;
        }

        Comment comment = commentRepository.findById(commentRequestDto.getCommenterId()).orElse(null);
        if (comment == null) {
            return CommentResult.COMMENT_NOT_FOUND;
        }

        // 관리자 수정 권한 복원
        boolean isAdmin = user.getRoles().contains(Role.ADMIN);

        if (comment.getUser().getId() == userId || isAdmin) {
            comment.setContent(commentRequestDto.getContent());
            comment.setModificationTime(LocalDateTime.now());
            return CommentResult.SUCCESS;
        } else {
            return CommentResult.UNAUTHORIZED;
        }
    }

    //댓글 삭제
    @Transactional
    public CommentResult commentDelete(Long commentId, Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return CommentResult.USER_NOT_FOUND;
        }

        Comment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null) {
            return CommentResult.COMMENT_NOT_FOUND;
        }

        // 관리자 삭제 권한 복원
        boolean isAdmin = user.getRoles().contains(Role.ADMIN);

        if (comment.getUser().getId() == userId || isAdmin) {
            comment.setStatus(Status.INACTIVE);
            comment.setModificationTime(LocalDateTime.now());
            return CommentResult.SUCCESS;
        } else {
            return CommentResult.UNAUTHORIZED;
        }
    }


    @Transactional
    public void adminChangeCommentStatus(Long commentId, Status status) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentException(CommentResult.COMMENT_NOT_FOUND));

        if (status != Status.ACTIVE && status != Status.PENDING && status != Status.INACTIVE) {
            throw CommentException.invalidRequest("허용되지 않는 상태 값입니다: " + status);
        }

        comment.setStatus(status);
        comment.setModificationTime(LocalDateTime.now());
        commentRepository.save(comment);
    }

    public Page<CommentResponseDto> findMyComments(String userName, Pageable pageable) {
        User user = userRepository.findByUserName(userName)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        return commentRepository.findAllByUserAndStatus(user, Status.ACTIVE, pageable)
                .map(CommentResponseDto::fromEntity);
    }


}

