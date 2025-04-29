package com.golden_dobakhe.HakPle.domain.user.user.entity;

import com.golden_dobakhe.HakPle.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@ToString
public class Academy extends BaseEntity {
    @Column(length = 255, nullable = false)
    private String academyName; // 학원 이름

    @Column(length = 20, nullable = false)
    private String phoneNum;

    @Column(length = 20, nullable = false, unique = true)
    private String academyCode; //ABC1234XYZ ← 전화번호 뒷자리가 1234인 경우
}