package com.golden_dobakhe.HakPle.security;

//userdetails에 대하여 2가지로 나뉘어서 일단 합치가 보단 2개를 병렬 시켜놓고 이따 합쳐보는걸로
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import lombok.Getter;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.stream.Collectors;

@Getter
public class CustomUserDetails implements UserDetails {
    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
        System.out.println("💡 [DEBUG] 유저 생성됨: roles = " + user.getRoles());
    }
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (user.getRoles() == null) {
            return Collections.emptyList(); // 혹은 로그 찍고 예외 던져도 됨
        }

        return user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                .collect(Collectors.toSet());
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getUserName();
    }

    public Long getUserId(){
        return user.getId();
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}
