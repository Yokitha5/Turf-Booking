package com.turftime.venue.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Response DTO for Team – what the frontend receives.
 */
public class TeamResponseDTO {

    private String id;
    private String name;
    private String sport;
    private String description;
    private String location;
    private int teamSize;
    private String skillLevel;
    private List<String> playingDays;
    private String preferredTime;
    private String captainEmail;
    private String captainName;
    private List<String> memberEmails;
    private int memberCount;
    private boolean lookingForPlayers;
    private boolean active;
    private int totalMatches;
    private int totalWins;
    private double winRate;
    private LocalDate createdDate;

    // ===== GETTERS & SETTERS =====

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public List<String> getMemberEmails() { return memberEmails; }
    public void setMemberEmails(List<String> memberEmails) { this.memberEmails = memberEmails; }

    public int getMemberCount() { return memberCount; }
    public void setMemberCount(int memberCount) { this.memberCount = memberCount; }

    public boolean isLookingForPlayers() { return lookingForPlayers; }
    public void setLookingForPlayers(boolean lookingForPlayers) { this.lookingForPlayers = lookingForPlayers; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getTotalMatches() { return totalMatches; }
    public void setTotalMatches(int totalMatches) { this.totalMatches = totalMatches; }

    public int getTotalWins() { return totalWins; }
    public void setTotalWins(int totalWins) { this.totalWins = totalWins; }

    public double getWinRate() { return winRate; }
    public void setWinRate(double winRate) { this.winRate = winRate; }

    public LocalDate getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDate createdDate) { this.createdDate = createdDate; }
}
