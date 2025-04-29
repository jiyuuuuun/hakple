package com.golden_dobakhe.HakPle.domain.schedule.service;

import com.golden_dobakhe.HakPle.domain.schedule.dto.ScheduleRequestDto;
import com.golden_dobakhe.HakPle.domain.schedule.dto.ScheduleResponseDto;
import com.golden_dobakhe.HakPle.domain.schedule.entity.Schedule;
import com.golden_dobakhe.HakPle.domain.schedule.repository.ScheduleRepository;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// ScheduleService.java
@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;

    @Transactional
    public ScheduleResponseDto create(ScheduleRequestDto dto, User user) {
        Schedule s = new Schedule();
        s.setTitle(dto.getTitle());
        s.setStartDate(dto.getStartDate());
        s.setEndDate(dto.getEndDate());
        s.setDescription(dto.getDescription());
        s.setUser(user);
        s.setColor(dto.getColor());
        Schedule saved = scheduleRepository.save(s);
        return toDto(saved);
    }

    public List<ScheduleResponseDto> findDtosByUser(User user) {
        return scheduleRepository.findAllByUser(user).stream()
                .map(this::toDto)
                .toList();
    }

    public Schedule findById(Long id, User user) {
        Schedule s = scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("해당 일정이 없습니다."));
        if (!s.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("접근 권한이 없습니다.");
        }
        return s;
    }

    @Transactional
    public ScheduleResponseDto update(Long id, ScheduleRequestDto dto, User user) {
        Schedule s = findById(id, user);
        s.setTitle(dto.getTitle());
        s.setStartDate(dto.getStartDate());
        s.setEndDate(dto.getEndDate());
        s.setDescription(dto.getDescription());
        s.setColor(dto.getColor());
        Schedule updated = scheduleRepository.save(s);
        return toDto(updated);
    }

    @Transactional
    public void delete(Long id, User user) {
        Schedule s = findById(id, user);
        scheduleRepository.delete(s);
    }

    // 내부 변환 메서드
    private ScheduleResponseDto toDto(Schedule s) {
        return new ScheduleResponseDto(
                s.getId(),
                s.getTitle(),
                s.getStartDate(),
                s.getEndDate(),
                s.getDescription(),
                s.getColor()
        );
    }

    public ScheduleResponseDto findDtoById(Long id, User user) {
        return toDto(findById(id, user));
    }
}

