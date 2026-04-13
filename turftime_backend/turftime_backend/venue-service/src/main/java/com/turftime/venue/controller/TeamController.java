package com.turftime.venue.controller;

import com.turftime.venue.dto.*;
import com.turftime.venue.entity.JoinRequest;
import com.turftime.venue.entity.Team;
import com.turftime.venue.entity.TeamInvite;
import com.turftime.venue.service.TeamService;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * TeamController – all team-related REST endpoints.
 *
 * Base path: /teams
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  TEAM CRUD                                                                  │
 * │  POST   /teams                          → create team                      │
 * │  GET    /teams                          → all available (lookingForPlayers) │
 * │  GET    /teams/search?keyword=...       → search by name / sport            │
 * │  GET    /teams/my?email=...             → my teams (member or captain)      │
 * │  GET    /teams/{id}                     → get team by id                   │
 * │  PUT    /teams/{id}?captainEmail=...    → update team (captain only)        │
 * │  DELETE /teams/{id}?captainEmail=...    → delete team (captain only)       │
 * │                                                                             │
 * │  MEMBER MANAGEMENT (captain)                                                │
 * │  DELETE /teams/{id}/members/{memberEmail}?captainEmail=... → remove member │
 * │                                                                             │
 * │  JOIN REQUEST (player → captain)                                            │
 * │  POST /teams/{id}/join-requests                  → player sends request    │
 * │  GET  /teams/{id}/join-requests?captainEmail=... → captain views PENDING   │
 * │  PUT  /teams/{id}/join-requests/{reqId}/accept?captainEmail=... → accept   │
 * │  PUT  /teams/{id}/join-requests/{reqId}/decline?captainEmail=...→ decline  │
 * │                                                                             │
 * │  INVITES (captain → player)                                                 │
 * │  POST /teams/{id}/invites?captainEmail=...       → captain sends invite    │
 * │  GET  /teams/invites?playerEmail=...             → player views PENDING    │
 * │  PUT  /teams/invites/{inviteId}/accept?playerEmail=...  → player accepts   │
 * │  PUT  /teams/invites/{inviteId}/decline?playerEmail=... → player declines  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * NOTE: This controller is isolated from VenueController and does NOT modify
 * any existing venue endpoints.
 */
@RestController
@RequestMapping("/teams")
public class TeamController {

    @Autowired
    private TeamService teamService;

    // ─────────────────────────── TEAM CRUD ───────────────────────────────────

    // ✅ CREATE TEAM
    @PostMapping
    public ResponseEntity<TeamResponseDTO> createTeam(
            @Valid @RequestBody TeamRequestDTO dto) {

        Team team = mapToEntity(dto);
        Team saved = teamService.createTeam(team);
        return new ResponseEntity<>(mapToResponseDTO(saved), HttpStatus.CREATED);
    }

    // ✅ GET ALL AVAILABLE TEAMS (for "Join Team" modal)
    @GetMapping
    public ResponseEntity<List<TeamResponseDTO>> getAvailableTeams() {
        List<TeamResponseDTO> list = teamService.getAvailableTeams()
                .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // ✅ SEARCH TEAMS by name or sport (search bar in "Join Team" modal)
    @GetMapping("/search")
    public ResponseEntity<List<TeamResponseDTO>> searchTeams(
            @RequestParam(required = false) String keyword) {

        List<TeamResponseDTO> list = teamService.searchTeams(keyword)
                .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // ✅ GET MY TEAMS (teams the player is a member / captain of)
    @GetMapping("/my")
    public ResponseEntity<List<TeamResponseDTO>> getMyTeams(
            @RequestParam String email) {

        List<TeamResponseDTO> list = teamService.getMyTeams(email)
                .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // ✅ GET TEAM BY ID
    @GetMapping("/{id}")
    public ResponseEntity<TeamResponseDTO> getTeamById(@PathVariable String id) {
        return ResponseEntity.ok(mapToResponseDTO(teamService.getTeamById(id)));
    }

    // ✅ UPDATE TEAM (captain only)
    @PutMapping("/{id}")
    public ResponseEntity<TeamResponseDTO> updateTeam(
            @PathVariable String id,
            @RequestParam String captainEmail,
            @Valid @RequestBody TeamRequestDTO dto) {

        Team updated = teamService.updateTeam(id, mapToEntity(dto), captainEmail);
        return ResponseEntity.ok(mapToResponseDTO(updated));
    }

    // ✅ DELETE TEAM (captain only)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(
            @PathVariable String id,
            @RequestParam String captainEmail) {

        teamService.deleteTeam(id, captainEmail);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────── MEMBER MANAGEMENT ───────────────────────────

    // ✅ REMOVE MEMBER FROM TEAM (captain only)
    @DeleteMapping("/{id}/members/{memberEmail}")
    public ResponseEntity<TeamResponseDTO> removeMember(
            @PathVariable String id,
            @PathVariable String memberEmail,
            @RequestParam String captainEmail) {

        Team updated = teamService.removeMember(id, memberEmail, captainEmail);
        return ResponseEntity.ok(mapToResponseDTO(updated));
    }

    // ─────────────────────────── JOIN REQUESTS ───────────────────────────────

    // ✅ PLAYER SENDS A JOIN REQUEST
    @PostMapping("/{id}/join-requests")
    public ResponseEntity<JoinRequestResponseDTO> sendJoinRequest(
            @PathVariable String id,
            @Valid @RequestBody JoinRequestDTO dto) {

        JoinRequest request = mapJoinRequestDTOToEntity(dto);
        JoinRequest saved = teamService.sendJoinRequest(id, request);
        return new ResponseEntity<>(mapJoinRequestToResponseDTO(saved), HttpStatus.CREATED);
    }

    // ✅ CAPTAIN VIEWS PENDING JOIN REQUESTS FOR THEIR TEAM
    @GetMapping("/{id}/join-requests")
    public ResponseEntity<List<JoinRequestResponseDTO>> getPendingJoinRequests(
            @PathVariable String id,
            @RequestParam String captainEmail) {

        List<JoinRequestResponseDTO> list = teamService
                .getPendingJoinRequests(id, captainEmail)
                .stream().map(this::mapJoinRequestToResponseDTO).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // ✅ CAPTAIN ACCEPTS A JOIN REQUEST
    @PutMapping("/{id}/join-requests/{requestId}/accept")
    public ResponseEntity<JoinRequestResponseDTO> acceptJoinRequest(
            @PathVariable String id,
            @PathVariable String requestId,
            @RequestParam String captainEmail) {

        JoinRequest updated = teamService.acceptJoinRequest(requestId, captainEmail);
        return ResponseEntity.ok(mapJoinRequestToResponseDTO(updated));
    }

    // ✅ CAPTAIN DECLINES A JOIN REQUEST
    @PutMapping("/{id}/join-requests/{requestId}/decline")
    public ResponseEntity<JoinRequestResponseDTO> declineJoinRequest(
            @PathVariable String id,
            @PathVariable String requestId,
            @RequestParam String captainEmail) {

        JoinRequest updated = teamService.declineJoinRequest(requestId, captainEmail);
        return ResponseEntity.ok(mapJoinRequestToResponseDTO(updated));
    }

    // ─────────────────────────── INVITES ─────────────────────────────────────

    // ✅ CAPTAIN SENDS AN INVITE TO A PLAYER
    @PostMapping("/{id}/invites")
    public ResponseEntity<TeamInviteResponseDTO> sendInvite(
            @PathVariable String id,
            @RequestParam String captainEmail,
            @Valid @RequestBody TeamInviteRequestDTO dto) {

        TeamInvite invite = mapInviteDTOToEntity(dto);
        TeamInvite saved = teamService.sendInvite(id, invite, captainEmail);
        return new ResponseEntity<>(mapInviteToResponseDTO(saved), HttpStatus.CREATED);
    }

    // ✅ PLAYER VIEWS THEIR PENDING INVITES (Invites tab)
    @GetMapping("/invites")
    public ResponseEntity<List<TeamInviteResponseDTO>> getPendingInvites(
            @RequestParam String playerEmail) {

        List<TeamInviteResponseDTO> list = teamService.getPendingInvites(playerEmail)
                .stream().map(this::mapInviteToResponseDTO).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // ✅ PLAYER ACCEPTS AN INVITE
    @PutMapping("/invites/{inviteId}/accept")
    public ResponseEntity<TeamInviteResponseDTO> acceptInvite(
            @PathVariable String inviteId,
            @RequestParam String playerEmail) {

        TeamInvite updated = teamService.acceptInvite(inviteId, playerEmail);
        return ResponseEntity.ok(mapInviteToResponseDTO(updated));
    }

    // ✅ PLAYER DECLINES AN INVITE
    @PutMapping("/invites/{inviteId}/decline")
    public ResponseEntity<TeamInviteResponseDTO> declineInvite(
            @PathVariable String inviteId,
            @RequestParam String playerEmail) {

        TeamInvite updated = teamService.declineInvite(inviteId, playerEmail);
        return ResponseEntity.ok(mapInviteToResponseDTO(updated));
    }

    // ═════════════════════════ MAPPING HELPERS ════════════════════════════════

    private Team mapToEntity(TeamRequestDTO dto) {
        Team team = new Team();
        team.setName(dto.getName());
        team.setSport(dto.getSport());
        team.setDescription(dto.getDescription());
        team.setLocation(dto.getLocation());
        team.setTeamSize(dto.getTeamSize());
        team.setSkillLevel(dto.getSkillLevel());
        team.setPlayingDays(dto.getPlayingDays());
        team.setPreferredTime(dto.getPreferredTime());
        team.setCaptainEmail(dto.getCaptainEmail());
        team.setCaptainName(dto.getCaptainName());
        team.setLookingForPlayers(dto.isLookingForPlayers());
        return team;
    }

    private TeamResponseDTO mapToResponseDTO(Team team) {
        TeamResponseDTO dto = new TeamResponseDTO();
        dto.setId(team.getId());
        dto.setName(team.getName());
        dto.setSport(team.getSport());
        dto.setDescription(team.getDescription());
        dto.setLocation(team.getLocation());
        dto.setTeamSize(team.getTeamSize());
        dto.setSkillLevel(team.getSkillLevel());
        dto.setPlayingDays(team.getPlayingDays());
        dto.setPreferredTime(team.getPreferredTime());
        dto.setCaptainEmail(team.getCaptainEmail());
        dto.setCaptainName(team.getCaptainName());
        dto.setMemberEmails(team.getMemberEmails());
        dto.setMemberCount(team.getMemberEmails() != null ? team.getMemberEmails().size() : 0);
        dto.setLookingForPlayers(team.isLookingForPlayers());
        dto.setActive(team.isActive());
        dto.setTotalMatches(team.getTotalMatches());
        dto.setTotalWins(team.getTotalWins());
        dto.setWinRate(team.getTotalMatches() > 0
                ? Math.round((double) team.getTotalWins() / team.getTotalMatches() * 100.0) : 0.0);
        dto.setCreatedDate(team.getCreatedDate());
        return dto;
    }

    private JoinRequest mapJoinRequestDTOToEntity(JoinRequestDTO dto) {
        JoinRequest req = new JoinRequest();
        req.setPlayerEmail(dto.getPlayerEmail());
        req.setPlayerName(dto.getPlayerName());
        req.setRequestedRole(dto.getRequestedRole());
        req.setMessage(dto.getMessage());
        return req;
    }

    private JoinRequestResponseDTO mapJoinRequestToResponseDTO(JoinRequest req) {
        JoinRequestResponseDTO dto = new JoinRequestResponseDTO();
        dto.setId(req.getId());
        dto.setTeamId(req.getTeamId());
        dto.setTeamName(req.getTeamName());
        dto.setPlayerEmail(req.getPlayerEmail());
        dto.setPlayerName(req.getPlayerName());
        dto.setRequestedRole(req.getRequestedRole());
        dto.setMessage(req.getMessage());
        dto.setStatus(req.getStatus());
        dto.setRequestedAt(req.getRequestedAt());
        dto.setRespondedAt(req.getRespondedAt());
        return dto;
    }

    private TeamInvite mapInviteDTOToEntity(TeamInviteRequestDTO dto) {
        TeamInvite invite = new TeamInvite();
        invite.setFromEmail(dto.getFromEmail());
        invite.setFromName(dto.getFromName());
        invite.setToEmail(dto.getToEmail());
        invite.setToName(dto.getToName());
        invite.setOfferedRole(dto.getOfferedRole());
        invite.setMessage(dto.getMessage());
        return invite;
    }

    private TeamInviteResponseDTO mapInviteToResponseDTO(TeamInvite invite) {
        TeamInviteResponseDTO dto = new TeamInviteResponseDTO();
        dto.setId(invite.getId());
        dto.setTeamId(invite.getTeamId());
        dto.setTeamName(invite.getTeamName());
        dto.setSport(invite.getSport());
        dto.setFromEmail(invite.getFromEmail());
        dto.setFromName(invite.getFromName());
        dto.setToEmail(invite.getToEmail());
        dto.setToName(invite.getToName());
        dto.setOfferedRole(invite.getOfferedRole());
        dto.setMessage(invite.getMessage());
        dto.setStatus(invite.getStatus());
        dto.setSentAt(invite.getSentAt());
        dto.setRespondedAt(invite.getRespondedAt());
        return dto;
    }
}
