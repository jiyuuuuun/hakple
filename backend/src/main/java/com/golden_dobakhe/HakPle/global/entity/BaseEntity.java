package com.golden_dobakhe.HakPle.global.entity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class) // Auditing 활성화
public abstract class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 자동 증가 설정
    private Long id; // 공통 PK

    @CreatedDate // 생성 날짜 자동 관리
    @Column(nullable = false, updatable = false)
    private LocalDateTime creationTime; // 생성 시간

    @LastModifiedDate // 수정 날짜 자동 관리
    private LocalDateTime modificationTime; // 수정 시간
}

