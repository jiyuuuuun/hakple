package com.golden_dobakhe.HakPle.security;

import com.golden_dobakhe.HakPle.domain.user.entity.User;
import com.golden_dobakhe.HakPle.global.entity.Status;
import jakarta.servlet.Filter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;



@Configuration
@Slf4j
public class SecurityConfig {

    private final FakeAuthenticationFilter fakeAuthenticationFilter;

    public SecurityConfig(FakeAuthenticationFilter fakeAuthenticationFilter) {
        this.fakeAuthenticationFilter = fakeAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity security) throws Exception {
        //접근 제한
        security
                .csrf(csrf -> csrf.disable())
//                .authorizeHttpRequests(auth -> auth
//                                .requestMatchers(
//                                        "/", "/success", "/failure", // 기존
//                                        "/swagger-ui/",            // Swagger UI
//                                        "/v3/api-docs/",           // OpenAPI JSON
//                                        "/api/v1/posts/",
//                                        "/api/v1/academies",
//                                        "/api/v1/myInfos",
//                                        "/swagger-resources/",     // Swagger 리소스
//                                        "/webjars/*"                // Swagger static
//                                ).permitAll()

                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll()) // 🔓 모두 허용
                .addFilterBefore(fakeAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        /*
        // 로그인
        security
                .formLogin(form -> form
                        .defaultSuccessUrl("/success")
                        .failureUrl("/failure")
                );
         */

        // 로그인 설정 제거 (로그인 창 비활성화)
        security
                .httpBasic(httpBasic -> httpBasic.disable()); // HTTP Basic 인증 비활성화 (선택 사항)

        //로그아웃

        //세션
        return security.build();


    }
}

