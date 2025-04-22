package com.golden_dobakhe.HakPle;

import com.golden_dobakhe.HakPle.domain.schedule.entity.Schedule;
import com.golden_dobakhe.HakPle.domain.schedule.repository.ScheduleRepository;
import com.golden_dobakhe.HakPle.domain.user.user.entity.Role;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.domain.user.user.repository.UserRepository;
import com.golden_dobakhe.HakPle.global.Status;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        // 테스트 유저 생성 or 조회
        String testPhone = "01010101010";

        User user = userRepository.findByPhoneNum(testPhone)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setUserName("testUser");
                    newUser.setPassword("1234"); // 실제 사용 시 인코딩된 비밀번호
                    newUser.setNickName("테스트유저");
                    newUser.setPhoneNum(testPhone);
                    newUser.setStatus(Status.ACTIVE);
                    newUser.setRoles(Set.of(Role.USER)); // Role enum 값 사용
                    newUser.setReportedCount(0);
                    newUser.setAcademyId("NLQ1234WHZ");
                    return userRepository.save(newUser);
                });

        // 일정 데이터가 없으면 샘플 일정 2개 삽입
        if (scheduleRepository.count() == 0) {
            scheduleRepository.saveAll(List.of(
                    createSchedule("수학 시험", 1, user),
                    createSchedule("학부모 상담", 3, user)
            ));
        }
    }

    private Schedule createSchedule(String title, int daysFromNow, User user) {
        Schedule schedule = new Schedule();
        schedule.setTitle(title);
        schedule.setStartDate(LocalDateTime.now().plusDays(daysFromNow).withHour(10));
        schedule.setEndDate(LocalDateTime.now().plusDays(daysFromNow).withHour(11));
        schedule.setDescription(title + " 관련 일정입니다.");
        schedule.setUser(user);
        return schedule;
    }
}
