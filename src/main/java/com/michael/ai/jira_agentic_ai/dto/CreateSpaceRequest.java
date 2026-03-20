package com.michael.ai.jira_agentic_ai.dto;

import lombok.Data;

@Data
public class CreateSpaceRequest {
    private String name;
    private String key;
    private String color;
}
