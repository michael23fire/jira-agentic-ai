package com.michael.ai.jira_agentic_ai.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateIssueRequest {
    private String title;
    private String description;
    private String issueType;
    private String status;
    private String priority;
    private Long assigneeId;
    private Long reporterId;
    private Long sprintId;
    private Boolean clearSprint;
    private Long parentId;
    private Integer storyPoints;
    private LocalDate startDate;
    private LocalDate dueDate;
    private Integer issueOrder;
    private List<String> labels;
}
