package com.michael.ai.jira_agentic_ai.dto;

import lombok.Data;

@Data
public class CreateCommentRequest {
    private Long authorId;
    private String content;
}
