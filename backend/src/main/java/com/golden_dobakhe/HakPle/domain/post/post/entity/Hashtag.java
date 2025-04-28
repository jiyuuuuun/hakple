package com.golden_dobakhe.HakPle.domain.post.post.entity;

import com.golden_dobakhe.HakPle.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@ToString
@Table(uniqueConstraints = {
    @UniqueConstraint(name = "uk_hashtag_name_academy", columnNames = {"hashtagName", "academyCode"})
})
public class Hashtag extends BaseEntity {
    @Column(length=255, nullable=false)
    private String hashtagName; 

    @Column(nullable = false)
    private String academyCode; 

    @OneToMany(mappedBy = "hashtag", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TagMapping> tagMappings = new ArrayList<>();

}
