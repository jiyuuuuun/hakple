package com.golden_dobakhe.HakPle.domain.post.comment.comment.service;

import com.golden_dobakhe.HakPle.domain.post.comment.CommentResult;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.dto.CommentRequestDto;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.dto.CommentResponseDto;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.Comment;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.repository.CommentRepository;
import com.golden_dobakhe.HakPle.domain.post.comment.exception.CommentException;
import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.post.post.repository.BoardRepository;


import com.golden_dobakhe.HakPle.domain.user.exception.UserErrorCode;
import com.golden_dobakhe.HakPle.domain.user.exception.UserException;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Role;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import com.golden_dobakhe.HakPle.global.Status;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;

import com.golden_dobakhe.HakPle.domain.post.comment.like.repository.LikeRepository;
import com.golden_dobakhe.HakPle.domain.post.comment.like.entity.CommentLike;
import org.springframework.util.StringUtils;

@Service
@Transactional // 모든 public 메서드가 트랜잭션 범위 안에서 실행
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private static final int MAX_COMMENT_BYTE_LENGTH = 10000;

    public final CommentRepository commentRepository;
    public final BoardRepository boardRepository;
    public final UserRepository userRepository;
    public final LikeRepository likeRepository;

    // 게시글 ID로 댓글 목록 조회 (좋아요 상태 포함)
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getCommentsByBoardId(Long boardId) {
        
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글이 존재하지 않습니다."));

        List<Comment> comments = board.getComments();

        return comments.stream()
                .filter(comment -> comment.getStatus() == Status.ACTIVE)
                .map(CommentResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 게시글 ID로 댓글 목록 조회 (로그인 한 사용자의 좋아요 상태 포함)
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getCommentsByBoardId(Long boardId, Long userId) {
        
        // 게시글 존재 여부 확인
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글이 존재하지 않습니다."));

        // 게시글에 연결된 활성 상태인 댓글만 조회
        List<Comment> comments = board.getComments().stream()
                .filter(comment -> comment.getStatus() == Status.ACTIVE)
                .collect(Collectors.toList());
        
        if (comments.isEmpty()) {
            return List.of();
        }
        
        // 효율적인 좋아요 상태 확인을 위해 한 번의 쿼리로 모든 좋아요 정보 조회
        List<Long> commentIds = comments.stream()
                .map(Comment::getId)
                .collect(Collectors.toList());
        
        // 사용자가 좋아요한 댓글 목록을 한 번에 조회
        List<CommentLike> likes = likeRepository.findByCommentIdInAndUserId(commentIds, userId);

        // 좋아요한 댓글 ID 세트 생성 (빠른 조회용)
        Set<Long> likedCommentIds = likes.stream()
                .map(like -> like.getComment().getId())
                .collect(Collectors.toSet());
        
        // 댓글 DTO 변환 시 좋아요 상태 확인
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
    public Comment commentSave(CommentRequestDto commentRequestDto,Long userId) {
       Board board=boardRepository.findById(commentRequestDto.getBoardId()).orElse(null);
       if(board==null){ 
           throw  new CommentException(CommentResult.BOARD_NOT_FOUND);
       }
       User user=userRepository.findById(userId).orElse(null);
       if(user==null){ 
           throw  new CommentException(CommentResult.USER_NOT_FOUND);
       }
        String content = commentRequestDto.getContent();

        if (!StringUtils.hasText(content)) {
            throw CommentException.invalidRequest("댓글 내용은 비어 있을 수 없습니다.");
        }

        int byteLength = content.getBytes(StandardCharsets.UTF_8).length;

        if (byteLength > MAX_COMMENT_BYTE_LENGTH) {
            throw CommentException.invalidRequest("댓글은 최대 " + MAX_COMMENT_BYTE_LENGTH + "바이트까지만 입력 가능합니다. 현재: " + byteLength + "바이트");
        }

        Comment comment= Comment.builder()
               .board(board)
               .content(commentRequestDto.getContent())
               .user(user)
               .status(Status.ACTIVE)
               .build();
       commentRepository.save(comment);
     return comment;
    }


    //댓글 수정
    public CommentResult commentUpdate(CommentRequestDto commentRequestDto, Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if(user == null) { 
            return CommentResult.USER_NOT_FOUND;
        }
        
        if(commentRequestDto.getContent() == null || commentRequestDto.getContent().trim().isEmpty()) {
            
            return CommentResult.EMPTY;
        }
        
        Comment comment = commentRepository.findById(commentRequestDto.getCommenterId()).orElse(null);
        if(comment == null) { 
            return CommentResult.COMMENT_NOT_FOUND;
        }
        
        
        boolean isAdmin = user.getRoles().contains(Role.ADMIN);
        
       
        if(comment.getUser().getId() == userId || isAdmin) {
            comment.setContent(commentRequestDto.getContent());
            return CommentResult.SUCCESS;
        } else{
            return CommentResult.UNAUTHORIZED;
        }
    }

    //댓글 삭제
    public CommentResult commentDelete(Long commentId, Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if(user == null) { 
            return CommentResult.USER_NOT_FOUND;
        }
        
        Comment comment = commentRepository.findById(commentId).orElse(null);
        if(comment == null) { 
            return CommentResult.COMMENT_NOT_FOUND;
        }
        
        boolean isAdmin = user.getRoles().contains(Role.ADMIN);
        
        if(comment.getUser().getId() == userId || isAdmin) {
            comment.setStatus(Status.INACTIVE);
            return CommentResult.SUCCESS;
        } else {
            return CommentResult.UNAUTHORIZED;
        }
    }
    public Page<CommentResponseDto> findMyComments(String userName, Pageable pageable) {
        User user = userRepository.findByUserName(userName)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        return commentRepository.findAllByUserAndStatus(user, Status.ACTIVE, pageable)
                .map(CommentResponseDto::fromEntity);
    }


}

