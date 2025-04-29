package com.golden_dobakhe.HakPle.domain.post.post.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor
public class BoardRequest {
    @Schema(description = "게시글 제목", example = "새로운 게시글 제목입니다.")
    private String title;

    @Schema(description = "게시글 내용", example = "이것은 게시글의 내용입니다.")
    private String content;

    @Schema(description = "게시글 태그 목록", example = "[\"Java\", \"Spring\"]")
    private List<String> tags;

    @Schema(description = "학원 코드", example = "ACADEMY001")
    private String academyCode;

    @Schema(description = "게시판 종류", example = "FREE") 
    private String boardType;

    @Schema(description = "임시 저장된 이미지 ID 목록", example = "[\"temp_img_id_1\", \"temp_img_id_2\"]")
    private List<String> tempIdList;

    @Schema(description = "본문에 사용된 이미지 URL 목록", example = "[\"url1\", \"url2\"]")
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
