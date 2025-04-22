package com.golden_dobakhe.HakPle.domain.schedule.repository;

import com.golden_dobakhe.HakPle.domain.schedule.entity.Schedule;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findAllByUser(User user);
}