package com.michael.ai.jira_agentic_ai.repository;

import com.michael.ai.jira_agentic_ai.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IssueRepository extends JpaRepository<Issue, Long> {

    Optional<Issue> findByIssueKey(String issueKey);

    List<Issue> findBySpaceIdOrderByIssueOrderAsc(Long spaceId);

    List<Issue> findBySpaceIdAndSprintIdOrderByIssueOrderAsc(Long spaceId, Long sprintId);

    List<Issue> findBySpaceIdAndSprintIsNullOrderByIssueOrderAsc(Long spaceId);

    List<Issue> findByParentId(Long parentId);

    boolean existsByIssueKey(String issueKey);
}
