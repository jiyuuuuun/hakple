package com.golden_dobakhe.HakPle.domain.schedule.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ScheduleResponseDto {
    private Long id;
    private String title;
    private String startDate;
    private String endDate;
    private String description;
    private String color;

}
