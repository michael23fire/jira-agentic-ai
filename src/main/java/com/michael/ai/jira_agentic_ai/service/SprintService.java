package com.michael.ai.jira_agentic_ai.service;

import com.michael.ai.jira_agentic_ai.dto.CreateSprintRequest;
import com.michael.ai.jira_agentic_ai.dto.SprintDto;
import com.michael.ai.jira_agentic_ai.entity.Space;
import com.michael.ai.jira_agentic_ai.entity.Sprint;
import com.michael.ai.jira_agentic_ai.repository.SpaceRepository;
import com.michael.ai.jira_agentic_ai.repository.SprintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final SpaceRepository spaceRepository;

    public List<SprintDto> findBySpace(Long spaceId) {
        return sprintRepository.findBySpaceIdOrderByStartDateAsc(spaceId).stream()
                .map(SprintDto::from)
                .collect(Collectors.toList());
    }

    public SprintDto findById(Long id) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found: " + id));
        return SprintDto.from(sprint);
    }

    @Transactional
    public SprintDto create(Long spaceId, CreateSprintRequest req) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found: " + spaceId));

        Sprint sprint = new Sprint();
        sprint.setSpace(space);
        sprint.setName(req.getName());
        sprint.setGoal(req.getGoal());
        sprint.setStartDate(req.getStartDate());
        sprint.setEndDate(req.getEndDate());
        sprint.setStatus(req.getStatus() != null ? req.getStatus() : "future");
        return SprintDto.from(sprintRepository.save(sprint));
    }

    @Transactional
    public SprintDto update(Long id, CreateSprintRequest req) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found: " + id));
        if (req.getName() != null) sprint.setName(req.getName());
        if (req.getGoal() != null) sprint.setGoal(req.getGoal());
        if (req.getStartDate() != null) sprint.setStartDate(req.getStartDate());
        if (req.getEndDate() != null) sprint.setEndDate(req.getEndDate());
        if (req.getStatus() != null) sprint.setStatus(req.getStatus());
        return SprintDto.from(sprintRepository.save(sprint));
    }

    @Transactional
    public void delete(Long id) {
        if (!sprintRepository.existsById(id)) {
            throw new RuntimeException("Sprint not found: " + id);
        }
        sprintRepository.deleteById(id);
    }
}
