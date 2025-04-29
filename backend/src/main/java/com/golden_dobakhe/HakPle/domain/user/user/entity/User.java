package com.golden_dobakhe.HakPle.domain.user.user.entity;

import com.golden_dobakhe.HakPle.domain.resource.image.entity.Image;
import com.golden_dobakhe.HakPle.domain.schedule.entity.Schedule;
import com.golden_dobakhe.HakPle.global.Status;
import com.golden_dobakhe.HakPle.global.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@Entity
@Table(name = "user")
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@ToString
public class User extends BaseEntity {
    @Column(length = 100, nullable = false, unique = true)
    private String userName;

    @Column(nullable = false)
    private String password;

    @Column(length = 50)
    private String socialProvider;

    @Column(nullable = false)
    private String nickName;

    @Column(length = 20, nullable = false, unique = true)
    private String phoneNum;

    @Column(length = 100)
    private String academyId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status; // ENUM('active', 'inactive', 'pending')

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Set<Role> roles = new HashSet<>();

    @Column(length = 512)
    private String refreshToken; // JWT 리프레시 토큰

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "profile_image_id", referencedColumnName = "id")
    private Image profileImage; // 프로필 이미지 (Image 엔티티와 연결)

    @Column(name = "reported_count", nullable = false)
    private int reportedCount = 0; // 신고 누적 수

    // (선택) 일정 연관관계
    @OneToMany(mappedBy = "user")
    private List<Schedule> schedules = new ArrayList<>();
}