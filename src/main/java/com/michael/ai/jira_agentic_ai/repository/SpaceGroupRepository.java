package com.michael.ai.jira_agentic_ai.repository;

import com.michael.ai.jira_agentic_ai.entity.SpaceGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SpaceGroupRepository extends JpaRepository<SpaceGroup, Long> {

    List<SpaceGroup> findBySpaceId(Long spaceId);

    boolean existsBySpaceIdAndGroupId(Long spaceId, Long groupId);

    void deleteBySpaceIdAndGroupId(Long spaceId, Long groupId);

    @Query("SELECT sg.space.id FROM SpaceGroup sg WHERE sg.group.id IN :groupIds")
    List<Long> findSpaceIdsByGroupIds(List<Long> groupIds);
}
