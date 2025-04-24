package com.golden_dobakhe.HakPle.domain.post.post.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor
public class BoardRequest {
    private String title;
    private String content;
    private List<String> tags;
    private String academyCode;
    private String boardType; // 게시글 유형 (notice, free, popular)
    // 새로 업로드된 임시 이미지 ID 목록
    private List<String> tempIdList;
    // 수정 시 사용 중인 기존 이미지 URL 목록
    private List<String> usedImageUrls;
    
    /**
     * 이전 버전과의 호환성을 위한 메서드
     * @deprecated 새 코드에서는 getType()을 사용하세요.
     */
    // type 필드 관련 내용 완전히 제거

    @Builder
    public BoardRequest(String title, String content, List<String> tags, String boardType, String academyCode, 
                        List<String> tempIdList, List<String> usedImageUrls) {
        this.title = title;
        this.content = content;
        this.tags = (tags != null) ? tags : new ArrayList<>();
        this.boardType = boardType; // null 체크는 서비스 레이어에서 필요 시 수행
        this.academyCode = academyCode;
        this.tempIdList = tempIdList; // null일 수도 있음
        this.usedImageUrls = usedImageUrls; // null일 수도 있음
    }

    // Lombok @Getter가 모든 필드에 대한 getter를 생성합니다.
}
