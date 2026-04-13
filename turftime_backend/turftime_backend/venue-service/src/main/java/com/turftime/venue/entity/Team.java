package com.turftime.venue.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Team entity – stores team data in MongoDB.
 * Adding this file does NOT touch any existing Venue code.
 */
@Document(collection = "teams")
public class Team {

    @Id
    private String id;

    private String name;
    private String sport;
    private String description;
    private String location;

    private int teamSize;          // max players
    private String skillLevel;     // Beginner / Intermediate / Advanced / Professional

    private List<String> playingDays = new ArrayList<>();  // e.g. ["Monday", "Saturday"]
    private String preferredTime;  // morning / afternoon / evening / flexible

    // Captain is the player who created the team (stored by email)
    private String captainEmail;
    private String captainName;

    // Current members (list of player emails)
    private List<String> memberEmails = new ArrayList<>();

    private boolean lookingForPlayers = true;
    private boolean active = true;

    // Stats
    private int totalMatches = 0;
    private int totalWins = 0;

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

    public boolean isLookingForPlayers() { return lookingForPlayers; }
    public void setLookingForPlayers(boolean lookingForPlayers) { this.lookingForPlayers = lookingForPlayers; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getTotalMatches() { return totalMatches; }
    public void setTotalMatches(int totalMatches) { this.totalMatches = totalMatches; }

    public int getTotalWins() { return totalWins; }
    public void setTotalWins(int totalWins) { this.totalWins = totalWins; }

    public LocalDate getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDate createdDate) { this.createdDate = createdDate; }
}
