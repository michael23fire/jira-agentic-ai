package com.michael.ai.jira_agentic_ai.dto;

import lombok.Data;

@Data
public class AddMemberRequest {
    private Long userId;
    private String role;
}
