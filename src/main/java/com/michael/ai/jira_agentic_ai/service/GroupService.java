package com.michael.ai.jira_agentic_ai.service;

import com.michael.ai.jira_agentic_ai.dto.*;
import com.michael.ai.jira_agentic_ai.entity.GroupMember;
import com.michael.ai.jira_agentic_ai.entity.User;
import com.michael.ai.jira_agentic_ai.entity.UserGroup;
import com.michael.ai.jira_agentic_ai.repository.GroupMemberRepository;
import com.michael.ai.jira_agentic_ai.repository.UserGroupRepository;
import com.michael.ai.jira_agentic_ai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final UserGroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    public List<GroupDto> findAll() {
        return groupRepository.findAllByOrderByIdAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public GroupDto findById(Long id) {
        UserGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found: " + id));
        return toDto(group);
    }

    @Transactional
    public GroupDto create(CreateGroupRequest req, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("User not found: " + ownerId));

        UserGroup group = new UserGroup();
        group.setName(req.getName());
        group.setDescription(req.getDescription());
        group.setOwner(owner);
        group = groupRepository.save(group);

        GroupMember ownerMember = new GroupMember();
        ownerMember.setGroup(group);
        ownerMember.setUser(owner);
        ownerMember.setRole("ADMIN");
        groupMemberRepository.save(ownerMember);

        return toDto(group);
    }

    @Transactional
    public GroupDto update(Long id, CreateGroupRequest req) {
        UserGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found: " + id));
        if (req.getName() != null) group.setName(req.getName());
        if (req.getDescription() != null) group.setDescription(req.getDescription());
        return toDto(groupRepository.save(group));
    }

    @Transactional
    public void delete(Long id) {
        if (!groupRepository.existsById(id)) {
            throw new RuntimeException("Group not found: " + id);
        }
        groupRepository.deleteById(id);
    }

    public List<UserDto> getMembers(Long groupId) {
        return groupMemberRepository.findByGroupId(groupId).stream()
                .map(gm -> UserDto.from(gm.getUser()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void addMember(Long groupId, Long userId) {
        if (groupMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            return;
        }
        UserGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        GroupMember gm = new GroupMember();
        gm.setGroup(group);
        gm.setUser(user);
        gm.setRole("MEMBER");
        groupMemberRepository.save(gm);
    }

    @Transactional
    public void removeMember(Long groupId, Long userId) {
        groupMemberRepository.deleteByGroupIdAndUserId(groupId, userId);
    }

    private GroupDto toDto(UserGroup group) {
        GroupDto dto = GroupDto.from(group);
        List<UserDto> members = groupMemberRepository.findByGroupId(group.getId()).stream()
                .map(gm -> UserDto.from(gm.getUser()))
                .collect(Collectors.toList());
        dto.setMembers(members);
        return dto;
    }
}
