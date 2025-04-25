package com.golden_dobakhe.HakPle.domain.user.user.repository;

import com.golden_dobakhe.HakPle.domain.user.user.entity.Role;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


public interface UserRepository extends JpaRepository<User, Long> {
    @EntityGraph(attributePaths = "roles")
    Optional<User> findByUserName(String userName);

    boolean existsByUserName(String userName); //아이디 중복확인

    boolean existsByNickName(String nickName); //닉네임 중복확인

    boolean existsByPhoneNum(String phoneNum);

    Optional<User> findByNickNameAndPhoneNum(String nickName, String phoneNum);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.userName = :username")
    Optional<User> findByUserNameWithRoles(@Param("username") String username);

    @EntityGraph(attributePaths = "roles") // 🎯 roles 컬렉션을 함께 로딩
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdWithRoles(@Param("id") Long id);

    Optional<User> findByPhoneNum(String testPhone);

    Page<User> findAllByRoles(Role role, Pageable pageable);

    Page<User> findAllUserByRoles(Role role,Pageable pageable);
}
