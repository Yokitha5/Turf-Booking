package com.turftime.notificationreview.dto;

public class BookingValidationResponse {

    private String id;
    private String venueId;
    private String playerEmail;
    private String status;

    // getters & setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getVenueId() { return venueId; }
    public void setVenueId(String venueId) { this.venueId = venueId; }

    public String getPlayerEmail() { return playerEmail; }
    public void setPlayerEmail(String playerEmail) { this.playerEmail = playerEmail; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
