package com.turftime.venue.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * JoinRequest – a player requests to join a team.
 * The captain can ACCEPT or DECLINE.
 * Status values: PENDING | ACCEPTED | DECLINED
 */
@Document(collection = "team_join_requests")
public class JoinRequest {

    @Id
    private String id;

    private String teamId;
    private String teamName;

    private String playerEmail;
    private String playerName;

    // Optional role the player wants to play
    private String requestedRole;
    // Optional message from the player
    private String message;

    // PENDING | ACCEPTED | DECLINED
    private String status = "PENDING";

    private LocalDateTime requestedAt;
    private LocalDateTime respondedAt;

    // ===== GETTERS & SETTERS =====

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getPlayerEmail() { return playerEmail; }
    public void setPlayerEmail(String playerEmail) { this.playerEmail = playerEmail; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public String getRequestedRole() { return requestedRole; }
    public void setRequestedRole(String requestedRole) { this.requestedRole = requestedRole; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }

    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }
}
