package com.michael.ai.jira_agentic_ai.repository;

import com.michael.ai.jira_agentic_ai.entity.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SprintRepository extends JpaRepository<Sprint, Long> {

    List<Sprint> findBySpaceIdOrderByStartDateAsc(Long spaceId);
}
