package com.turftime.dispute.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "disputes")
public class Dispute {

    @Id
    private String id;
    private String bookingId;
    private String raisedBy;
    private String raisedAgainst;
    private String reason;
    private String status;
    private String playerName;
    private String venueName;
    private String ownerName;
    private String issue;
    private Double amount;
    private String bookingDate;
    private String createdAt;
    private String priority;
    private String description;

    public Dispute() {}

    public Dispute(String bookingId, String raisedBy, String raisedAgainst, String reason, String status) {
        this.bookingId = bookingId;
        this.raisedBy = raisedBy;
        this.raisedAgainst = raisedAgainst;
        this.reason = reason;
        this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }
    public String getRaisedBy() { return raisedBy; }
    public void setRaisedBy(String raisedBy) { this.raisedBy = raisedBy; }
    public String getRaisedAgainst() { return raisedAgainst; }
    public void setRaisedAgainst(String raisedAgainst) { this.raisedAgainst = raisedAgainst; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }
    public String getVenueName() { return venueName; }
    public void setVenueName(String venueName) { this.venueName = venueName; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getIssue() { return issue; }
    public void setIssue(String issue) { this.issue = issue; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getBookingDate() { return bookingDate; }
    public void setBookingDate(String bookingDate) { this.bookingDate = bookingDate; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
