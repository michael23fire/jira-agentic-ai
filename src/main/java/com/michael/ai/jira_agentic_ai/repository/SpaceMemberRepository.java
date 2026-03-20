package com.michael.ai.jira_agentic_ai.repository;

import com.michael.ai.jira_agentic_ai.entity.SpaceMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpaceMemberRepository extends JpaRepository<SpaceMember, Long> {

    List<SpaceMember> findBySpaceId(Long spaceId);

    List<SpaceMember> findByUserId(Long userId);

    Optional<SpaceMember> findBySpaceIdAndUserId(Long spaceId, Long userId);

    boolean existsBySpaceIdAndUserId(Long spaceId, Long userId);

    void deleteBySpaceIdAndUserId(Long spaceId, Long userId);
}
