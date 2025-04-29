package com.golden_dobakhe.HakPle.domain.post.post.repository;

import com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.QComment;
import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.post.post.entity.QBoard;
import com.golden_dobakhe.HakPle.domain.post.post.entity.QHashtag;
import com.golden_dobakhe.HakPle.domain.post.post.entity.QTagMapping;
import com.golden_dobakhe.HakPle.domain.post.post.entity.QBoardLike;
import com.golden_dobakhe.HakPle.domain.user.user.entity.QUser;
import com.golden_dobakhe.HakPle.global.Status;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.NumberTemplate;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.JPQLQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

import static com.golden_dobakhe.HakPle.domain.post.comment.comment.entity.QComment.comment;
import static com.golden_dobakhe.HakPle.domain.post.post.entity.QBoardLike.boardLike;

@RequiredArgsConstructor
@Slf4j
@Repository
public class BoardRepositoryCustomImpl implements BoardRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    public enum SearchType {
        TITLE, CONTENT, NICKNAME, TAG, ALL;

        public static SearchType fromString(String value) {
            if (!StringUtils.hasText(value)) return null;
            try {
                return valueOf(value.toUpperCase());
            } catch (IllegalArgumentException e) {
                switch (value.toLowerCase()) {
                    case "title":
                    case "제목": 
                        return TITLE;
                    case "content":
                    case "내용": 
                        return CONTENT;
                    case "nickname":
                    case "작성자": 
                        return NICKNAME;
                    case "tag":
                    case "태그": 
                        return TAG;
                    case "all":
                        return ALL;
                    default:
                        return null;
                }
            }
        }
    }

    public enum BoardType {
        NOTICE, FREE;

        public static BoardType fromString(String value) {
            if (!StringUtils.hasText(value)) return null;
            try {
                return valueOf(value.toUpperCase());
            } catch (IllegalArgumentException e) {
                if ("free".equalsIgnoreCase(value) || "notice".equalsIgnoreCase(value)) {
                    return valueOf(value.toUpperCase());
                }
                return null;
            }
        }
    }

    public enum SortProperty {
        VIEW_COUNT, COMMENT_COUNT, LIKE_COUNT, CREATION_TIME
    }

    @Override
    public Page<Board> searchBoardsDynamic(
            String academyCode,
            String searchType,
            String searchKeyword,
            String type,
            Pageable pageable
    ) {
        System.out.println("나와라예이 + : " + academyCode + ", : " + searchType + ", : " + searchKeyword + ", : " + type + ", : " + pageable);

        QBoard board = QBoard.board;
        QUser user = QUser.user;
        QTagMapping tagMapping = QTagMapping.tagMapping;
        QHashtag hashtag = QHashtag.hashtag;
        QComment comment = QComment.comment;
        QBoardLike boardLike = QBoardLike.boardLike;
        QBoardLike boardLikeAlias = new QBoardLike("boardLikeAlias"); 

        if (!StringUtils.hasText(academyCode)) {
            throw new IllegalArgumentException("학원 코드는 필수 입력값입니다.");
        }

        boolean isPopular = "popular".equalsIgnoreCase(type);
        
        BoardType boardType = null;
        if (isPopular) {
            boardType = BoardType.FREE; 
        } else if (StringUtils.hasText(type)) {
            boardType = BoardType.fromString(type);
        }

        SearchType searchTypeEnum = SearchType.fromString(searchType);

        BooleanBuilder whereCondition = buildWhereCondition(
                academyCode, boardType, searchTypeEnum, searchKeyword, board, tagMapping, hashtag);

        if (isPopular) {
            whereCondition.and(board.type.eq("free"));
            JPQLQuery<Long> likeSubQuery = JPAExpressions
                    .select(boardLike.board.id)
                    .from(boardLike)
                    .groupBy(boardLike.board.id)
                    .having(boardLike.count().goe(10L));
            whereCondition.and(board.id.in(likeSubQuery));
        }

        List<OrderSpecifier<?>> orderSpecifiers = buildOrderSpecifiers(pageable, board);

        List<Board> content = queryFactory
                .selectFrom(board)
                .leftJoin(board.user, user).fetchJoin()
                .leftJoin(board.tags, tagMapping).fetchJoin()
                .leftJoin(tagMapping.hashtag, hashtag).fetchJoin()
                .where(whereCondition)
                .orderBy(orderSpecifiers.toArray(new OrderSpecifier[0]))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        JPQLQuery<Long> countQuery = queryFactory
                .select(board.count())
                .from(board)
                .where(whereCondition);

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    private List<OrderSpecifier<?>> buildOrderSpecifiers(Pageable pageable, QBoard board) {
        List<OrderSpecifier<?>> orderSpecifiers = new ArrayList<>();
        QComment comment = QComment.comment;
        QBoardLike boardLike = QBoardLike.boardLike;

        if (pageable.getSort().isSorted()) {
            for (Sort.Order sort : pageable.getSort()) {
                String property = sort.getProperty();
                Order direction = sort.isAscending() ? Order.ASC : Order.DESC;
                try {
                    String enumName = property.replaceAll("([a-z])([A-Z])", "$1_$2").toUpperCase();
                    SortProperty sortProperty = SortProperty.valueOf(enumName);
                    switch (sortProperty) {
                        case VIEW_COUNT:
                            orderSpecifiers.add(new OrderSpecifier<>(direction, board.viewCount));
                            break;
                        case COMMENT_COUNT:
                            NumberTemplate<Long> countExpression = Expressions.numberTemplate(Long.class,
                                    "coalesce({0}, 0)",
                                    queryFactory
                                            .select(comment.count())
                                            .from(comment)
                                            .where(comment.board.eq(board).and(comment.status.eq(Status.ACTIVE))));

                            orderSpecifiers.add(new OrderSpecifier<>(direction, countExpression));
                            break;
                        case LIKE_COUNT:
                            orderSpecifiers.add(new OrderSpecifier<>(direction, board.boardLikes.size()));

                            break;
                        case CREATION_TIME:
                            orderSpecifiers.add(new OrderSpecifier<>(direction, board.creationTime));
                            break;
                    }
                } catch (IllegalArgumentException e) {
                    orderSpecifiers.add(new OrderSpecifier<>(Order.DESC, board.creationTime));
                }
            }
        }

        if (orderSpecifiers.isEmpty()) {
            orderSpecifiers.add(new OrderSpecifier<>(Order.DESC, board.creationTime));
        }

        return orderSpecifiers;
    }

    private BooleanBuilder buildWhereCondition(
            String academyCode,
            BoardType boardType,
            SearchType searchType,
            String searchKeyword,
            QBoard board,
            QTagMapping tagMapping,
            QHashtag hashtag
    ) {

        BooleanBuilder whereCondition = new BooleanBuilder();
        whereCondition.and(board.academyCode.eq(academyCode));
        whereCondition.and(board.status.eq(Status.ACTIVE));

        if (boardType != null) {
            whereCondition.and(board.type.eq(boardType.name().toLowerCase()));
        }

        if (StringUtils.hasText(searchKeyword) && searchType != null) {
            switch (searchType) {
                case TITLE:
                    whereCondition.and(board.title.containsIgnoreCase(searchKeyword));
                    break;
                case CONTENT:
                    whereCondition.and(board.contentText.contains(searchKeyword));
                    break;
                case NICKNAME:
                    whereCondition.and(board.user.nickName.containsIgnoreCase(searchKeyword));
                    break;
                case TAG:
                    if (boardType != BoardType.NOTICE) {
                        whereCondition.and(
                                JPAExpressions.selectOne()
                                        .from(tagMapping)
                                        .join(tagMapping.hashtag, hashtag)
                                        .where(
                                                tagMapping.board.eq(board),
                                                hashtag.hashtagName.containsIgnoreCase(searchKeyword)
                                        )
                                        .exists()
                        );
                    }
                    break;
                case ALL:
                    BooleanBuilder allCondition = new BooleanBuilder();
                    allCondition.or(board.title.containsIgnoreCase(searchKeyword));
                    allCondition.or(board.contentText.contains(searchKeyword));
                    allCondition.or(board.user.nickName.containsIgnoreCase(searchKeyword));

                    if (boardType != BoardType.NOTICE) {
                        allCondition.or(
                                JPAExpressions.selectOne()
                                        .from(tagMapping)
                                        .join(tagMapping.hashtag, hashtag)
                                        .where(
                                                tagMapping.board.eq(board),
                                                hashtag.hashtagName.containsIgnoreCase(searchKeyword)
                                        )
                                        .exists()
                        );
                    }
                    whereCondition.and(allCondition);
                    break;
            }
        }

        return whereCondition;
    }
}

