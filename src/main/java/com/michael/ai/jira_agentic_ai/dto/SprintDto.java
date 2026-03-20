package com.michael.ai.jira_agentic_ai.dto;

import com.michael.ai.jira_agentic_ai.entity.Sprint;
import lombok.Data;
import java.time.LocalDate;

@Data
public class SprintDto {
    private Long id;
    private Long spaceId;
    private String name;
    private String goal;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;

    public static SprintDto from(Sprint s) {
        SprintDto dto = new SprintDto();
        dto.setId(s.getId());
        dto.setSpaceId(s.getSpace().getId());
        dto.setName(s.getName());
        dto.setGoal(s.getGoal());
        dto.setStartDate(s.getStartDate());
        dto.setEndDate(s.getEndDate());
        dto.setStatus(s.getStatus());
        return dto;
    }
}
