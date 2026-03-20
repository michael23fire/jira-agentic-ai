package com.michael.ai.jira_agentic_ai.controller;

import com.michael.ai.jira_agentic_ai.dto.CreateIssueRequest;
import com.michael.ai.jira_agentic_ai.dto.IssueDto;
import com.michael.ai.jira_agentic_ai.dto.UpdateIssueRequest;
import com.michael.ai.jira_agentic_ai.service.IssueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spaces/{spaceId}/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @GetMapping
    public List<IssueDto> getBySpace(@PathVariable Long spaceId) {
        return issueService.findBySpace(spaceId);
    }

    @GetMapping("/{issueKey}")
    public IssueDto getByKey(@PathVariable String issueKey) {
        return issueService.findByKey(issueKey);
    }

    @PostMapping
    public IssueDto create(@PathVariable Long spaceId, @RequestBody CreateIssueRequest req) {
        return issueService.create(spaceId, req);
    }

    @PutMapping("/{issueKey}")
    public IssueDto update(@PathVariable String issueKey, @RequestBody UpdateIssueRequest req) {
        return issueService.update(issueKey, req);
    }

    @DeleteMapping("/{issueKey}")
    public ResponseEntity<Void> delete(@PathVariable String issueKey) {
        issueService.delete(issueKey);
        return ResponseEntity.noContent().build();
    }
}
