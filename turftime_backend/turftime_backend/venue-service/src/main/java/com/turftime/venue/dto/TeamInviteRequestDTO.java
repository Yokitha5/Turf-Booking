package com.turftime.venue.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO – captain invites a player to join the team.
 */
public class TeamInviteRequestDTO {

    @NotBlank(message = "Captain (from) email is required")
    private String fromEmail;

    private String fromName;

    @NotBlank(message = "Player (to) email is required")
    private String toEmail;

    private String toName;

    // Role being offered, e.g. "Midfielder"
    private String offeredRole;

    // Optional message
    private String message;

    // ===== GETTERS & SETTERS =====

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
}
