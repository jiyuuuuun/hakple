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
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import com.golden_dobakhe.HakPle.global.Status;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional // 모든 public 메서드가 트랜잭션 범위 안에서 실행
@RequiredArgsConstructor
@Slf4j
public class CommentService {
    public final CommentRepository commentRepository;
    public final BoardRepository boardRepository;
    public final UserRepository userRepository;

    // 게시글 ID로 댓글 목록 조회
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getCommentsByBoardId(Long boardId) {
        // 게시글 존재 여부 확인
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글이 존재하지 않습니다."));

        // 게시글에 연결된 모든 댓글 조회
        List<Comment> comments = board.getComments();

        // 활성 상태인 댓글만 필터링하고 DTO로 변환
        return comments.stream()
                .filter(comment -> comment.getStatus() == Status.ACTIVE)
                .map(CommentResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    //댓글 저장
    public Comment commentSave(CommentRequestDto commentRequestDto,Long userId) {
       Board board=boardRepository.findById(commentRequestDto.getBoardId()).orElse(null);
       if(board==null){ //게시판이 존재 X
           throw  new CommentException(CommentResult.BOARD_NOT_FOUND);
       }
       User user=userRepository.findById(userId).orElse(null);
       if(user==null){ //유저 존재 X
           throw  new CommentException(CommentResult.USER_NOT_FOUND);
       }
       if(commentRequestDto.getContent() == null || commentRequestDto.getContent().trim().isEmpty()) {
            // 비어 있는 문자열
           throw  new CommentException(CommentResult.EMPTY);
       }

        Comment comment= Comment.builder()
               .board(board)
               .content(commentRequestDto.getContent())
               .user(user)
               .status(Status.ACTIVE)
               .build();
       log.info(comment.toString());
       commentRepository.save(comment);
     return comment;
    }


    //댓글 수정
    public CommentResult commentUpdate(CommentRequestDto commentRequestDto,Long userId) {
        User user=userRepository.findById(userId).orElse(null);
        if(user==null){ //유저 존재 X
            return CommentResult.USER_NOT_FOUND;
        }
        if(commentRequestDto.getContent() == null || commentRequestDto.getContent().trim().isEmpty()) {
            // 비어 있는 문자열
            return CommentResult.EMPTY;
        }
        Comment comment=commentRepository.findById(commentRequestDto.getCommenterId()).orElse(null);
        if(comment==null){ //없는 댓글
            return CommentResult.COMMENT_NOT_FOUND;
        }
        if(comment.getUser().getId()==userId) {
            comment.setContent(commentRequestDto.getContent());
            log.info(comment.toString());
            return CommentResult.SUCCESS;
        }else{
            return CommentResult.UNAUTHORIZED;
        }

    }

    //댓글 삭제
    public CommentResult commentDelete(Long commentId,Long userId) {
        User user=userRepository.findById(userId).orElse(null);
        if(user==null){ //유저 존재 X
            return CommentResult.USER_NOT_FOUND;
        }
        Comment comment=commentRepository.findById(commentId).orElse(null);
        if(comment==null){ //없는 댓글
            return CommentResult.COMMENT_NOT_FOUND;
        }
        if(comment.getUser().getId()==userId) {
            comment.setStatus(Status.INACTIVE);
            log.info(comment.toString());
            return CommentResult.SUCCESS;
        }else{
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
