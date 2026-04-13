package com.turftime.venue.service.impl;

import com.turftime.venue.entity.JoinRequest;
import com.turftime.venue.entity.Team;
import com.turftime.venue.entity.TeamInvite;
import com.turftime.venue.exception.ResourceNotFoundException;
import com.turftime.venue.repository.JoinRequestRepository;
import com.turftime.venue.repository.TeamInviteRepository;
import com.turftime.venue.repository.TeamRepository;
import com.turftime.venue.service.TeamService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * TeamServiceImpl – full business logic for team management.
 * Completely separate from VenueServiceImpl; no venue code is touched.
 */
@Service
public class TeamServiceImpl implements TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private JoinRequestRepository joinRequestRepository;

    @Autowired
    private TeamInviteRepository teamInviteRepository;

    // ─── TEAM CRUD ────────────────────────────────────────────────────────────

    @Override
    public Team createTeam(Team team) {
        // Captain is automatically the first member
        if (team.getMemberEmails() == null) {
            team.setMemberEmails(new ArrayList<>());
        }
        if (!team.getMemberEmails().contains(team.getCaptainEmail())) {
            team.getMemberEmails().add(team.getCaptainEmail());
        }
        team.setActive(true);
        team.setCreatedDate(LocalDate.now());
        return teamRepository.save(team);
    }

    @Override
    public Team updateTeam(String teamId, Team updatedTeam, String requestingEmail) {
        Team existing = getTeamById(teamId);

        // Only the captain can update
        if (!existing.getCaptainEmail().equalsIgnoreCase(requestingEmail)) {
            throw new IllegalArgumentException("Only the team captain can update team details.");
        }

        existing.setName(updatedTeam.getName());
        existing.setSport(updatedTeam.getSport());
        existing.setDescription(updatedTeam.getDescription());
        existing.setLocation(updatedTeam.getLocation());
        existing.setTeamSize(updatedTeam.getTeamSize());
        existing.setSkillLevel(updatedTeam.getSkillLevel());
        existing.setPlayingDays(updatedTeam.getPlayingDays());
        existing.setPreferredTime(updatedTeam.getPreferredTime());
        existing.setLookingForPlayers(updatedTeam.isLookingForPlayers());

        return teamRepository.save(existing);
    }

    @Override
    public void deleteTeam(String teamId, String requestingEmail) {
        Team team = getTeamById(teamId);

        if (!team.getCaptainEmail().equalsIgnoreCase(requestingEmail)) {
            throw new IllegalArgumentException("Only the team captain can delete the team.");
        }

        teamRepository.delete(team);
    }

    @Override
    public Team getTeamById(String teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + teamId));
    }

    @Override
    public List<Team> getAvailableTeams() {
        return teamRepository.findByLookingForPlayersTrue();
    }

    @Override
    public List<Team> searchTeams(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return teamRepository.findByLookingForPlayersTrue();
        }
        // Merge name-search and sport-search results, remove duplicates
        List<Team> byName  = teamRepository.findByNameContainingIgnoreCase(keyword);
        List<Team> bySport = teamRepository.findBySportIgnoreCase(keyword);

        return java.util.stream.Stream.concat(byName.stream(), bySport.stream())
                .distinct()
                .collect(Collectors.toList());
    }

    @Override
    public List<Team> getMyTeams(String playerEmail) {
        return teamRepository.findByMemberEmailsContaining(playerEmail);
    }

    // ─── MEMBER MANAGEMENT ────────────────────────────────────────────────────

    @Override
    public Team removeMember(String teamId, String memberEmail, String captainEmail) {
        Team team = getTeamById(teamId);

        if (!team.getCaptainEmail().equalsIgnoreCase(captainEmail)) {
            throw new IllegalArgumentException("Only the team captain can remove members.");
        }
        if (memberEmail.equalsIgnoreCase(captainEmail)) {
            throw new IllegalArgumentException("Captain cannot remove themselves. Delete the team instead.");
        }

        team.getMemberEmails().remove(memberEmail);
        return teamRepository.save(team);
    }

    // ─── JOIN REQUEST FLOW ────────────────────────────────────────────────────

    @Override
    public JoinRequest sendJoinRequest(String teamId, JoinRequest request) {
        Team team = getTeamById(teamId);

        // Prevent duplicate pending request
        boolean alreadyPending = joinRequestRepository
                .existsByTeamIdAndPlayerEmailAndStatus(teamId, request.getPlayerEmail(), "PENDING");
        if (alreadyPending) {
            throw new IllegalArgumentException("You already have a pending join request for this team.");
        }

        // Prevent joining if already a member
        if (team.getMemberEmails().contains(request.getPlayerEmail())) {
            throw new IllegalArgumentException("You are already a member of this team.");
        }

        request.setTeamId(teamId);
        request.setTeamName(team.getName());
        request.setStatus("PENDING");
        request.setRequestedAt(LocalDateTime.now());

        return joinRequestRepository.save(request);
    }

    @Override
    public List<JoinRequest> getPendingJoinRequests(String teamId, String captainEmail) {
        Team team = getTeamById(teamId);

        if (!team.getCaptainEmail().equalsIgnoreCase(captainEmail)) {
            throw new IllegalArgumentException("Only the team captain can view join requests.");
        }

        return joinRequestRepository.findByTeamIdAndStatus(teamId, "PENDING");
    }

    @Override
    public JoinRequest acceptJoinRequest(String requestId, String captainEmail) {
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found: " + requestId));

        Team team = getTeamById(request.getTeamId());

        if (!team.getCaptainEmail().equalsIgnoreCase(captainEmail)) {
            throw new IllegalArgumentException("Only the team captain can accept join requests.");
        }

        // Add player to team
        if (!team.getMemberEmails().contains(request.getPlayerEmail())) {
            team.getMemberEmails().add(request.getPlayerEmail());
            teamRepository.save(team);
        }

        request.setStatus("ACCEPTED");
        request.setRespondedAt(LocalDateTime.now());
        return joinRequestRepository.save(request);
    }

    @Override
    public JoinRequest declineJoinRequest(String requestId, String captainEmail) {
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found: " + requestId));

        Team team = getTeamById(request.getTeamId());

        if (!team.getCaptainEmail().equalsIgnoreCase(captainEmail)) {
            throw new IllegalArgumentException("Only the team captain can decline join requests.");
        }

        request.setStatus("DECLINED");
        request.setRespondedAt(LocalDateTime.now());
        return joinRequestRepository.save(request);
    }

    // ─── INVITE FLOW ──────────────────────────────────────────────────────────

    @Override
    public TeamInvite sendInvite(String teamId, TeamInvite invite, String captainEmail) {
        Team team = getTeamById(teamId);

        if (!team.getCaptainEmail().equalsIgnoreCase(captainEmail)) {
            throw new IllegalArgumentException("Only the team captain can send invites.");
        }

        invite.setTeamId(teamId);
        invite.setTeamName(team.getName());
        invite.setSport(team.getSport());
        invite.setStatus("PENDING");
        invite.setSentAt(LocalDateTime.now());

        return teamInviteRepository.save(invite);
    }

    @Override
    public List<TeamInvite> getPendingInvites(String playerEmail) {
        return teamInviteRepository.findByToEmailAndStatus(playerEmail, "PENDING");
    }

    @Override
    public TeamInvite acceptInvite(String inviteId, String playerEmail) {
        TeamInvite invite = teamInviteRepository.findById(inviteId)
                .orElseThrow(() -> new ResourceNotFoundException("Invite not found: " + inviteId));

        if (!invite.getToEmail().equalsIgnoreCase(playerEmail)) {
            throw new IllegalArgumentException("This invite was not sent to you.");
        }

        // Add player to team
        Team team = getTeamById(invite.getTeamId());
        if (!team.getMemberEmails().contains(playerEmail)) {
            team.getMemberEmails().add(playerEmail);
            teamRepository.save(team);
        }

        invite.setStatus("ACCEPTED");
        invite.setRespondedAt(LocalDateTime.now());
        return teamInviteRepository.save(invite);
    }

    @Override
    public TeamInvite declineInvite(String inviteId, String playerEmail) {
        TeamInvite invite = teamInviteRepository.findById(inviteId)
                .orElseThrow(() -> new ResourceNotFoundException("Invite not found: " + inviteId));

        if (!invite.getToEmail().equalsIgnoreCase(playerEmail)) {
            throw new IllegalArgumentException("This invite was not sent to you.");
        }

        invite.setStatus("DECLINED");
        invite.setRespondedAt(LocalDateTime.now());
        return teamInviteRepository.save(invite);
    }
}
