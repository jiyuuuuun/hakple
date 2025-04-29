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
    private String boardType; 
    private List<String> tempIdList;
    private List<String> usedImageUrls;
    

    @Builder
    public BoardRequest(String title, String content, List<String> tags, String boardType, String academyCode, 
                        List<String> tempIdList, List<String> usedImageUrls) {
        this.title = title;
        this.content = content;
        this.tags = (tags != null) ? tags : new ArrayList<>();
        this.boardType = boardType; 
        this.academyCode = academyCode;
        this.tempIdList = tempIdList; 
        this.usedImageUrls = usedImageUrls; 
    }

}
