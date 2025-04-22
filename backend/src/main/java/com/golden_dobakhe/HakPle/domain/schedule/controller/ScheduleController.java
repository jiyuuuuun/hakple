package com.golden_dobakhe.HakPle.domain.schedule.controller;

import com.golden_dobakhe.HakPle.domain.schedule.dto.ScheduleRequestDto;
import com.golden_dobakhe.HakPle.domain.schedule.dto.ScheduleResponseDto;
import com.golden_dobakhe.HakPle.domain.schedule.service.ScheduleService;
import com.golden_dobakhe.HakPle.domain.user.user.entity.User;
import com.golden_dobakhe.HakPle.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ScheduleController.java
@Slf4j
@RestController
@RequestMapping("/api/v1/schedules")
@RequiredArgsConstructor
@Validated
public class ScheduleController {

    private final ScheduleService scheduleService;

    @Operation(summary = "일정 등록")
    @PostMapping
    public ResponseEntity<ScheduleResponseDto> create(@Valid @RequestBody ScheduleRequestDto dto,
                                           @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(scheduleService.create(dto, principal.getUser()));
    }

    @Operation(summary = "내 일정 전체 조회")
    @GetMapping
    public ResponseEntity<List<ScheduleResponseDto>> getAll(@AuthenticationPrincipal CustomUserDetails principal) {
        List<ScheduleResponseDto> result = scheduleService.findDtosByUser(principal.getUser());
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "일정 상세 조회")
    @GetMapping("/{id}")
    public ResponseEntity<ScheduleResponseDto> getById(@PathVariable(name = "id") Long id,
                                            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(scheduleService.findDtoById(id, principal.getUser()));
    }

    @Operation(summary = "일정 수정")
    @PutMapping("/{id}")
    public ResponseEntity<ScheduleResponseDto > update(@PathVariable(name = "id") Long id,
                                           @Valid @RequestBody ScheduleRequestDto dto,
                                           @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(scheduleService.update(id, dto, principal.getUser()));
    }

    @Operation(summary = "일정 삭제")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable(name = "id") Long id,
                                       @AuthenticationPrincipal CustomUserDetails principal) {
        scheduleService.delete(id, principal.getUser());
        return ResponseEntity.noContent().build();
    }



}
