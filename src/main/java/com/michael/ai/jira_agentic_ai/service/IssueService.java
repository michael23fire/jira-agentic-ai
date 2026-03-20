package com.michael.ai.jira_agentic_ai.service;

import com.michael.ai.jira_agentic_ai.dto.CommentDto;
import com.michael.ai.jira_agentic_ai.dto.CreateIssueRequest;
import com.michael.ai.jira_agentic_ai.dto.IssueDto;
import com.michael.ai.jira_agentic_ai.dto.UpdateIssueRequest;
import com.michael.ai.jira_agentic_ai.entity.Issue;
import com.michael.ai.jira_agentic_ai.entity.Space;
import com.michael.ai.jira_agentic_ai.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;
    private final SpaceRepository spaceRepository;
    private final SprintRepository sprintRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    public List<IssueDto> findBySpace(Long spaceId) {
        return issueRepository.findBySpaceIdOrderByIssueOrderAsc(spaceId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public IssueDto findByKey(String issueKey) {
        Issue issue = issueRepository.findByIssueKey(issueKey)
                .orElseThrow(() -> new RuntimeException("Issue not found: " + issueKey));
        return toDto(issue);
    }

    @Transactional
    public IssueDto create(Long spaceId, CreateIssueRequest req) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found: " + spaceId));

        int num = space.nextIssueNumber();
        String issueKey = space.getKey() + "-" + num;
        spaceRepository.save(space);

        Issue issue = new Issue();
        issue.setIssueKey(issueKey);
        issue.setSpace(space);
        issue.setTitle(req.getTitle());
        issue.setDescription(req.getDescription());
        issue.setIssueType(req.getIssueType() != null ? req.getIssueType() : "task");
        issue.setStatus(req.getStatus() != null ? req.getStatus() : "planned");
        issue.setPriority(req.getPriority());
        issue.setStoryPoints(req.getStoryPoints());
        issue.setStartDate(req.getStartDate());
        issue.setDueDate(req.getDueDate());
        issue.setLabels(req.getLabels() != null ? req.getLabels() : List.of());

        if (req.getAssigneeId() != null) {
            issue.setAssignee(userRepository.findById(req.getAssigneeId()).orElse(null));
        }
        if (req.getReporterId() != null) {
            issue.setReporter(userRepository.findById(req.getReporterId()).orElse(null));
        }
        if (req.getSprintId() != null) {
            issue.setSprint(sprintRepository.findById(req.getSprintId()).orElse(null));
        }
        if (req.getParentId() != null) {
            issue.setParent(issueRepository.findById(req.getParentId()).orElse(null));
        }

        return toDto(issueRepository.save(issue));
    }

    @Transactional
    public IssueDto update(String issueKey, UpdateIssueRequest req) {
        Issue issue = issueRepository.findByIssueKey(issueKey)
                .orElseThrow(() -> new RuntimeException("Issue not found: " + issueKey));

        if (req.getTitle() != null) issue.setTitle(req.getTitle());
        if (req.getDescription() != null) issue.setDescription(req.getDescription());
        if (req.getIssueType() != null) issue.setIssueType(req.getIssueType());
        if (req.getStatus() != null) issue.setStatus(req.getStatus());
        if (req.getPriority() != null) issue.setPriority(req.getPriority());
        if (req.getStoryPoints() != null) issue.setStoryPoints(req.getStoryPoints());
        if (req.getStartDate() != null) issue.setStartDate(req.getStartDate());
        if (req.getDueDate() != null) issue.setDueDate(req.getDueDate());
        if (req.getIssueOrder() != null) issue.setIssueOrder(req.getIssueOrder());
        if (req.getLabels() != null) issue.setLabels(req.getLabels());

        if (req.getAssigneeId() != null) {
            issue.setAssignee(userRepository.findById(req.getAssigneeId()).orElse(null));
        }
        if (req.getReporterId() != null) {
            issue.setReporter(userRepository.findById(req.getReporterId()).orElse(null));
        }
        if (Boolean.TRUE.equals(req.getClearSprint())) {
            issue.setSprint(null);
        } else if (req.getSprintId() != null) {
            issue.setSprint(sprintRepository.findById(req.getSprintId()).orElse(null));
        }
        if (req.getParentId() != null) {
            issue.setParent(issueRepository.findById(req.getParentId()).orElse(null));
        }

        return toDto(issueRepository.save(issue));
    }

    @Transactional
    public void delete(String issueKey) {
        Issue issue = issueRepository.findByIssueKey(issueKey)
                .orElseThrow(() -> new RuntimeException("Issue not found: " + issueKey));
        issueRepository.delete(issue);
    }

    private IssueDto toDto(Issue issue) {
        IssueDto dto = IssueDto.from(issue);

        List<String> childKeys = issueRepository.findByParentId(issue.getId()).stream()
                .map(Issue::getIssueKey)
                .collect(Collectors.toList());
        dto.setChildKeys(childKeys);

        List<CommentDto> comments = commentRepository.findByIssueIdOrderByCreatedAtAsc(issue.getId()).stream()
                .map(CommentDto::from)
                .collect(Collectors.toList());
        dto.setComments(comments);

        return dto;
    }
}
