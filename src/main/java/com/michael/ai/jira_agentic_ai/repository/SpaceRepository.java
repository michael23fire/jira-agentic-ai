package com.michael.ai.jira_agentic_ai.repository;

import com.michael.ai.jira_agentic_ai.entity.Space;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpaceRepository extends JpaRepository<Space, Long> {

    List<Space> findAllByOrderByIdAsc();
    List<Space> findByOwnerId(Long ownerId);

    Optional<Space> findByKey(String key);

    boolean existsByKey(String key);
}
