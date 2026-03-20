package com.michael.ai.jira_agentic_ai.service;

import com.michael.ai.jira_agentic_ai.dto.CreateUserRequest;
import com.michael.ai.jira_agentic_ai.entity.User;
import com.michael.ai.jira_agentic_ai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Cacheable(value = "users", key = "#id")
    public User findById(Long id) {
        log.info("DB lookup user id={}", id);
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    public User create(CreateUserRequest req) {
        User user = new User();
        user.setUsername(req.getUsername());
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword("123");
        user.setAvatarColor(req.getAvatarColor());
        return userRepository.save(user);
    }

    public User authenticate(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        String storedPassword = user.getPassword() != null ? user.getPassword() : "123";
        if (!storedPassword.equals(password)) {
            throw new RuntimeException("Invalid password");
        }
        return user;
    }

    @CacheEvict(value = "users", key = "#id")
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }
}
