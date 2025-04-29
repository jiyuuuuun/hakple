package com.golden_dobakhe.HakPle.domain.post.post.entity;

import com.golden_dobakhe.HakPle.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@ToString
public class TagMapping extends BaseEntity { 
    @ManyToOne(optional = false)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board; 

    @ManyToOne(optional = false)
    @JoinColumn(name = "hashtag_id", nullable = false)
    private Hashtag hashtag; 
}

