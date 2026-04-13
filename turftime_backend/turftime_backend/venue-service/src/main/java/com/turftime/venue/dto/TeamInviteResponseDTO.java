package com.turftime.venue.dto;

import java.time.LocalDateTime;

/**
 * Response DTO for TeamInvite – returned to the player on the "Invites" tab.
 */
public class TeamInviteResponseDTO {

    private String id;
    private String teamId;
    private String teamName;
    private String sport;
    private String fromEmail;
    private String fromName;
    private String toEmail;
    private String toName;
    private String offeredRole;
    private String message;
    private String status;
    private LocalDateTime sentAt;
    private LocalDateTime respondedAt;

    // ===== GETTERS & SETTERS =====

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public String getFromEmail() { return fromEmail; }
    public void setFromEmail(String fromEmail) { this.fromEmail = fromEmail; }

    public String getFromName() { return fromName; }
    public void setFromName(String fromName) { this.fromName = fromName; }

    public String getToEmail() { return toEmail; }
    public void setToEmail(String toEmail) { this.toEmail = toEmail; }

    public String getToName() { return toName; }
    public void setToName(String toName) { this.toName = toName; }

    public String getOfferedRole() { return offeredRole; }
    public void setOfferedRole(String offeredRole) { this.offeredRole = offeredRole; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }
}
