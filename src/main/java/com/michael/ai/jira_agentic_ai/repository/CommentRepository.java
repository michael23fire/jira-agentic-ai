package com.michael.ai.jira_agentic_ai.repository;

import com.michael.ai.jira_agentic_ai.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByIssueIdOrderByCreatedAtAsc(Long issueId);
}
