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
    private String type; // 게시글 유형 (notice, free, popular)
    
    /**
     * 이전 버전과의 호환성을 위한 메서드
     * @deprecated 새 코드에서는 getType()을 사용하세요.
     */
    @Deprecated
    public String getBoardType() {
        return type;
    }

    @Builder
    public BoardRequest(String title, String content, List<String> tags, String type, String academyCode) {
        this.title = title;
        this.content = content;
        this.tags = (tags != null) ? tags : new ArrayList<>();
        this.type = (type != null) ? type : "free";
        this.academyCode = (academyCode != null) ? academyCode : null;
    }
}
