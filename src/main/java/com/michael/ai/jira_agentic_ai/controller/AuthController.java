package com.michael.ai.jira_agentic_ai.controller;

import com.michael.ai.jira_agentic_ai.dto.AuthTokenResponse;
import com.michael.ai.jira_agentic_ai.dto.UserDto;
import com.michael.ai.jira_agentic_ai.entity.User;
import com.michael.ai.jira_agentic_ai.service.JwtTokenService;
import com.michael.ai.jira_agentic_ai.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtTokenService jwtTokenService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required"));
        }
        try {
            User user = userService.authenticate(username, password);
            return ResponseEntity.ok(UserDto.from(user));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/oauth2/status")
    public Map<String, Object> oauth2Status(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return Map.of("authenticated", false);
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof OAuth2User oauth2User) {
            return Map.of(
                    "authenticated", true,
                    "name", oauth2User.getAttribute("name"),
                    "email", oauth2User.getAttribute("email"),
                    "attributes", oauth2User.getAttributes()
            );
        }
        return Map.of(
                "authenticated", true,
                "principal", principal.toString()
        );
    }

    @PostMapping("/token")
    @Operation(summary = "Username/password login and issue bearer JWT")
    public ResponseEntity<?> issueToken(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required"));
        }
        try {
            User user = userService.authenticate(username, password);
            String token = jwtTokenService.issueToken(user);
            return ResponseEntity.ok(new AuthTokenResponse(
                    token,
                    "Bearer",
                    jwtTokenService.getExpiresMinutes(),
                    UserDto.from(user)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }
}
