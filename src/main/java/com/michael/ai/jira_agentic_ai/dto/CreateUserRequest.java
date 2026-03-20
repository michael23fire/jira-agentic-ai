package com.michael.ai.jira_agentic_ai.dto;

import lombok.Data;

@Data
public class CreateUserRequest {
    private String username;
    private String name;
    private String email;
    private String avatarColor;
}
