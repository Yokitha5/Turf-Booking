package com.turftime.dispute.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "dispute_messages")
public class DisputeMessage {

    @Id
    private String id;

    private String disputeId;

    private String sender;   // email of sender
    private String message;

    // =====================
    // Constructors
    // =====================

    public DisputeMessage() {
    }

    public DisputeMessage(String disputeId, String sender, String message) {
        this.disputeId = disputeId;
        this.sender = sender;
        this.message = message;
    }

    // =====================
    // Getters and Setters
    // =====================

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDisputeId() {
        return disputeId;
    }

    public void setDisputeId(String disputeId) {
        this.disputeId = disputeId;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
