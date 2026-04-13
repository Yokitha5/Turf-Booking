package com.turftime.venue.service;

import com.turftime.venue.entity.JoinRequest;
import com.turftime.venue.entity.Team;
import com.turftime.venue.entity.TeamInvite;

import java.util.List;

/**
 * TeamService interface – completely separate from VenueService.
 * No changes to existing venue-service contracts.
 */
public interface TeamService {

    // ─── TEAM CRUD ────────────────────────────────────────────────────────────

    /** Create a new team. The captain email/name must be set in the entity. */
    Team createTeam(Team team);

    /** Captain updates team details (name, description, settings, etc.). */
    Team updateTeam(String teamId, Team updatedTeam, String requestingEmail);

    /** Captain deletes the team. */
    void deleteTeam(String teamId, String requestingEmail);

    /** Get team by id. */
    Team getTeamById(String teamId);

    /** All available teams that are looking for players (for "Join Team" modal). */
    List<Team> getAvailableTeams();

    /** All available teams filtered by name or sport keyword. */
    List<Team> searchTeams(String keyword);

    /** Teams where the player is a member (including captain). */
    List<Team> getMyTeams(String playerEmail);

    // ─── MEMBER MANAGEMENT (captain only) ────────────────────────────────────

    /**
     * Captain removes a specific member from the team.
     * @param memberEmail email of the player to remove
     * @param captainEmail must match the team's captainEmail
     */
    Team removeMember(String teamId, String memberEmail, String captainEmail);

    // ─── JOIN REQUEST FLOW (player → captain) ────────────────────────────────

    /**
     * Player sends a join request.
     * Returns error if the player already has a PENDING request for this team.
     */
    JoinRequest sendJoinRequest(String teamId, JoinRequest request);

    /**
     * Captain fetches all PENDING join requests for their team.
     */
    List<JoinRequest> getPendingJoinRequests(String teamId, String captainEmail);

    /**
     * Captain accepts a join request – adds the player to memberEmails.
     */
    JoinRequest acceptJoinRequest(String requestId, String captainEmail);

    /**
     * Captain declines a join request.
     */
    JoinRequest declineJoinRequest(String requestId, String captainEmail);

    // ─── INVITE FLOW (captain → player) ──────────────────────────────────────

    /**
     * Captain invites a player to the team.
     */
    TeamInvite sendInvite(String teamId, TeamInvite invite, String captainEmail);

    /**
     * Player fetches all PENDING invites in their "Invites" tab.
     */
    List<TeamInvite> getPendingInvites(String playerEmail);

    /**
     * Player accepts an invite – gets added to the team's memberEmails.
     */
    TeamInvite acceptInvite(String inviteId, String playerEmail);

    /**
     * Player declines an invite.
     */
    TeamInvite declineInvite(String inviteId, String playerEmail);
}
