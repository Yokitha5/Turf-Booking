package com.turftime.venue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.util.List;

/**
 * Request DTO for creating or updating a Team.
 */
public class TeamRequestDTO {

    @NotBlank(message = "Team name is required")
    private String name;

    @NotBlank(message = "Sport is required")
    private String sport;

    private String description;

    @NotBlank(message = "Location is required")
    private String location;

    @Positive(message = "Team size must be greater than 0")
    private int teamSize;

    private String skillLevel;

    private List<String> playingDays;

    private String preferredTime;

    // Captain info – comes from the authenticated user on the frontend
    @NotBlank(message = "Captain email is required")
    private String captainEmail;

    private String captainName;

    private boolean lookingForPlayers = true;

    // ===== GETTERS & SETTERS =====

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public int getTeamSize() { return teamSize; }
    public void setTeamSize(int teamSize) { this.teamSize = teamSize; }

    public String getSkillLevel() { return skillLevel; }
    public void setSkillLevel(String skillLevel) { this.skillLevel = skillLevel; }

    public List<String> getPlayingDays() { return playingDays; }
    public void setPlayingDays(List<String> playingDays) { this.playingDays = playingDays; }

    public String getPreferredTime() { return preferredTime; }
    public void setPreferredTime(String preferredTime) { this.preferredTime = preferredTime; }

    public String getCaptainEmail() { return captainEmail; }
    public void setCaptainEmail(String captainEmail) { this.captainEmail = captainEmail; }

    public String getCaptainName() { return captainName; }
    public void setCaptainName(String captainName) { this.captainName = captainName; }

    public boolean isLookingForPlayers() { return lookingForPlayers; }
    public void setLookingForPlayers(boolean lookingForPlayers) { this.lookingForPlayers = lookingForPlayers; }
}
