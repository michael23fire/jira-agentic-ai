package com.michael.ai.jira_agentic_ai;

import com.michael.ai.jira_agentic_ai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    // JpaRepository 已經幫你準備好 findById, findAll, save, delete 等方法
    // 不需要自己寫任何 SQL
}
