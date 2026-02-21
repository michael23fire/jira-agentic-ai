package com.michael.ai.jira_agentic_ai;

import com.michael.ai.jira_agentic_ai.entity.User;
import com.michael.ai.jira_agentic_ai.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET /api/users        → 查全部
    @GetMapping
    public List<User> getAll() {
        return userService.findAll();
    }

    // GET /api/users/1      → 查單一（有 cache）
    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) {
        return userService.findById(id);
    }

    // POST /api/users       → 新增
    @PostMapping
    public User create(@RequestBody User user) {
        return userService.create(user);
    }

    // DELETE /api/users/1   → 刪除（同時清 cache）
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
