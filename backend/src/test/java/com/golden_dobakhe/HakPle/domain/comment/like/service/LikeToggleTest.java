package com.golden_dobakhe.HakPle.domain.comment.like.service;

import com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.Comment;
import com.golden_dobakhe.HakPle.domain.post.comment.comment.repository.CommentRepository;
import com.golden_dobakhe.HakPle.domain.post.comment.like.repository.LikeRepository;
import com.golden_dobakhe.HakPle.domain.post.comment.like.service.LikeService;
import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.post.post.repository.BoardRepository;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Role;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import com.golden_dobakhe.HakPle.global.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.TestPropertySource;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@SpringBootTest
@TestPropertySource("classpath:application-test.yml")
public class LikeToggleTest {

    @Autowired
    private LikeService likeService;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private BoardRepository boardRepository;

    @Autowired
    private RedisTemplate<String, Integer> redisTemplate;

    private User testUser;
    private Comment testComment;
    private Board testBoard;
    private String redisKey;

    @BeforeEach
    void cleanRedis() {
        redisTemplate.getConnectionFactory().getConnection().flushAll();
    }


    @BeforeEach
    void setup() {
        testUser = userRepository.save(User.builder()
                .userName("tester_" + UUID.randomUUID())
                .password("1234")
                .nickName("nick")
                .phoneNum("010" + UUID.randomUUID().toString().substring(0, 8))
                .status(Status.ACTIVE)
                .roles(Set.of(Role.USER))
                .build());

        testBoard = boardRepository.save(Board.builder()
                .user(testUser)
                .title("테스트 게시글 제목")
                .content("본문")
                .contentText("본문 텍스트")
                .academyCode("ABC123")
                .status(Status.ACTIVE)
                .build());

        testComment = commentRepository.save(Comment.builder()
                .board(testBoard)
                .user(testUser)
                .content("테스트 댓글")
                .status(Status.ACTIVE)
                .build());

        redisKey = "comment:like:count:" + testComment.getId();
    }


    @Test
    void 좋아요_토글_정상동작() {
        // 1회차: 좋아요 누름
        likeService.toggleCommentLike(testComment.getId(), testUser);

        // Redis 값 확인
        assertThat(redisTemplate.opsForValue().get(redisKey)).isEqualTo(1);

        // DB에도 존재해야 함
        assertThat(likeRepository.findByCommentIdAndUserId(testComment.getId(), testUser.getId())).isPresent();

        // 2회차: 좋아요 취소
        likeService.toggleCommentLike(testComment.getId(), testUser);

        assertThat(redisTemplate.opsForValue().get(redisKey)).isEqualTo(0);
        assertThat(likeRepository.findByCommentIdAndUserId(testComment.getId(), testUser.getId())).isNotPresent();

        // 3회차: 다시 누르면 1
        likeService.toggleCommentLike(testComment.getId(), testUser);

        assertThat(redisTemplate.opsForValue().get(redisKey)).isEqualTo(1);
        assertThat(likeRepository.findByCommentIdAndUserId(testComment.getId(), testUser.getId())).isPresent();
    }
}

