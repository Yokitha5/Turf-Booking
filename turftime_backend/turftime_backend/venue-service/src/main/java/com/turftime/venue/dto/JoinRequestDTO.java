package com.turftime.venue.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for a player requesting to join a team.
 */
public class JoinRequestDTO {

    @NotBlank(message = "Player email is required")
    private String playerEmail;

    private String playerName;

    // Optional role the player would like to play
    private String requestedRole;

    // Optional message to the captain
    private String message;

    // ===== GETTERS & SETTERS =====

    public String getPlayerEmail() { return playerEmail; }
    public void setPlayerEmail(String playerEmail) { this.playerEmail = playerEmail; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public String getRequestedRole() { return requestedRole; }
    public void setRequestedRole(String requestedRole) { this.requestedRole = requestedRole; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
