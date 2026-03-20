package com.michael.ai.jira_agentic_ai.service;

import com.michael.ai.jira_agentic_ai.dto.CommentDto;
import com.michael.ai.jira_agentic_ai.dto.CreateCommentRequest;
import com.michael.ai.jira_agentic_ai.entity.Comment;
import com.michael.ai.jira_agentic_ai.entity.Issue;
import com.michael.ai.jira_agentic_ai.repository.CommentRepository;
import com.michael.ai.jira_agentic_ai.repository.IssueRepository;
import com.michael.ai.jira_agentic_ai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;

    public List<CommentDto> findByIssue(Long issueId) {
        return commentRepository.findByIssueIdOrderByCreatedAtAsc(issueId).stream()
                .map(CommentDto::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentDto create(Long issueId, CreateCommentRequest req) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue not found: " + issueId));

        Comment comment = new Comment();
        comment.setIssue(issue);
        comment.setAuthor(userRepository.findById(req.getAuthorId())
                .orElseThrow(() -> new RuntimeException("User not found: " + req.getAuthorId())));
        comment.setContent(req.getContent());
        return CommentDto.from(commentRepository.save(comment));
    }

    @Transactional
    public CommentDto update(Long commentId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));
        comment.setContent(content);
        return CommentDto.from(commentRepository.save(comment));
    }

    @Transactional
    public void delete(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new RuntimeException("Comment not found: " + commentId);
        }
        commentRepository.deleteById(commentId);
    }
}
