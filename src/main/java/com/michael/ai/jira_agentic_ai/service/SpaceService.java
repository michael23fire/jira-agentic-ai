package com.michael.ai.jira_agentic_ai.service;

import com.michael.ai.jira_agentic_ai.dto.*;
import com.michael.ai.jira_agentic_ai.entity.*;
import com.michael.ai.jira_agentic_ai.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final SpaceMemberRepository spaceMemberRepository;
    private final SpaceGroupRepository spaceGroupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserGroupRepository userGroupRepository;
    private final UserRepository userRepository;

    public List<SpaceDto> findAll() {
        return spaceRepository.findAllByOrderByIdAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<SpaceDto> findByUser(Long userId) {
        Set<Long> visibleSpaceIds = new LinkedHashSet<>();

        // Space owner should always see their own spaces.
        spaceRepository.findByOwnerId(userId)
                .forEach(s -> visibleSpaceIds.add(s.getId()));

        spaceMemberRepository.findByUserId(userId)
                .forEach(sm -> visibleSpaceIds.add(sm.getSpace().getId()));

        List<Long> groupIds = groupMemberRepository.findGroupIdsByUserId(userId);
        if (!groupIds.isEmpty()) {
            visibleSpaceIds.addAll(spaceGroupRepository.findSpaceIdsByGroupIds(groupIds));
        }

        if (visibleSpaceIds.isEmpty()) return List.of();

        return spaceRepository.findAllById(visibleSpaceIds).stream()
                .sorted(Comparator.comparingLong(Space::getId))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public SpaceDto findById(Long id) {
        Space space = spaceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Space not found: " + id));
        return toDto(space);
    }

    @Transactional
    public SpaceDto create(CreateSpaceRequest req, Long ownerId) {
        if (spaceRepository.existsByKey(req.getKey().toUpperCase())) {
            throw new RuntimeException("Space key already exists: " + req.getKey());
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("User not found: " + ownerId));

        Space space = new Space();
        space.setName(req.getName());
        space.setKey(req.getKey().toUpperCase());
        space.setColor(req.getColor());
        space.setOwner(owner);
        space = spaceRepository.save(space);

        SpaceMember ownerMember = new SpaceMember();
        ownerMember.setSpace(space);
        ownerMember.setUser(owner);
        ownerMember.setRole("ADMIN");
        spaceMemberRepository.save(ownerMember);

        return toDto(space);
    }

    @Transactional
    public SpaceDto update(Long id, CreateSpaceRequest req) {
        Space space = spaceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Space not found: " + id));
        if (req.getName() != null) space.setName(req.getName());
        if (req.getColor() != null) space.setColor(req.getColor());
        return toDto(spaceRepository.save(space));
    }

    @Transactional
    public void delete(Long id) {
        if (!spaceRepository.existsById(id)) {
            throw new RuntimeException("Space not found: " + id);
        }
        spaceRepository.deleteById(id);
    }

    public List<UserDto> getMembers(Long spaceId) {
        return spaceMemberRepository.findBySpaceId(spaceId).stream()
                .map(sm -> UserDto.from(sm.getUser()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void addMember(Long spaceId, AddMemberRequest req) {
        if (spaceMemberRepository.existsBySpaceIdAndUserId(spaceId, req.getUserId())) {
            return;
        }
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found: " + spaceId));
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found: " + req.getUserId()));

        SpaceMember sm = new SpaceMember();
        sm.setSpace(space);
        sm.setUser(user);
        sm.setRole(req.getRole() != null ? req.getRole() : "MEMBER");
        spaceMemberRepository.save(sm);
    }

    @Transactional
    public void removeMember(Long spaceId, Long userId) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found: " + spaceId));
        if (space.getOwner() != null && Objects.equals(space.getOwner().getId(), userId)) {
            throw new RuntimeException("Space admin cannot remove themselves");
        }
        spaceMemberRepository.deleteBySpaceIdAndUserId(spaceId, userId);
    }

    public List<GroupDto> getSpaceGroups(Long spaceId) {
        return spaceGroupRepository.findBySpaceId(spaceId).stream()
                .map(sg -> {
                    GroupDto dto = GroupDto.from(sg.getGroup());
                    dto.setMembers(
                        groupMemberRepository.findByGroupId(sg.getGroup().getId()).stream()
                            .map(gm -> UserDto.from(gm.getUser()))
                            .collect(Collectors.toList())
                    );
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void addGroup(Long spaceId, Long groupId) {
        if (spaceGroupRepository.existsBySpaceIdAndGroupId(spaceId, groupId)) {
            return;
        }
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found: " + spaceId));
        UserGroup group = userGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));

        SpaceGroup sg = new SpaceGroup();
        sg.setSpace(space);
        sg.setGroup(group);
        spaceGroupRepository.save(sg);
    }

    @Transactional
    public void removeGroup(Long spaceId, Long groupId) {
        spaceGroupRepository.deleteBySpaceIdAndGroupId(spaceId, groupId);
    }

    public Set<Long> getEffectiveUserIds(Long spaceId) {
        Set<Long> userIds = new LinkedHashSet<>();
        spaceMemberRepository.findBySpaceId(spaceId).forEach(sm -> userIds.add(sm.getUser().getId()));
        spaceGroupRepository.findBySpaceId(spaceId).forEach(sg ->
            groupMemberRepository.findByGroupId(sg.getGroup().getId())
                .forEach(gm -> userIds.add(gm.getUser().getId()))
        );
        return userIds;
    }

    private SpaceDto toDto(Space space) {
        SpaceDto dto = SpaceDto.from(space);
        List<UserDto> members = spaceMemberRepository.findBySpaceId(space.getId()).stream()
                .map(sm -> UserDto.from(sm.getUser()))
                .collect(Collectors.toList());
        dto.setMembers(members);

        List<GroupDto> groups = spaceGroupRepository.findBySpaceId(space.getId()).stream()
                .map(sg -> {
                    GroupDto g = GroupDto.from(sg.getGroup());
                    g.setMembers(
                        groupMemberRepository.findByGroupId(sg.getGroup().getId()).stream()
                            .map(gm -> UserDto.from(gm.getUser()))
                            .collect(Collectors.toList())
                    );
                    return g;
                })
                .collect(Collectors.toList());
        dto.setGroups(groups);

        return dto;
    }
}
