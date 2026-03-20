package com.michael.ai.jira_agentic_ai.dto;

import com.michael.ai.jira_agentic_ai.entity.User;
import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String username;
    private String name;
    private String email;
    private String avatarColor;

    public static UserDto from(User u) {
        UserDto dto = new UserDto();
        dto.setId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setName(u.getName());
        dto.setEmail(u.getEmail());
        dto.setAvatarColor(u.getAvatarColor());
        return dto;
    }
}
