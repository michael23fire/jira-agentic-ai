package com.michael.ai.jira_agentic_ai.exception;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(Long id) {
        super("User not found: " + id);
    }
}
