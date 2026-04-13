package com.turftime.dispute.service;

import com.turftime.dispute.entity.Dispute;
import com.turftime.dispute.entity.DisputeMessage;


import java.util.List;

public interface DisputeService {

    // =========================
    // DISPUTE MANAGEMENT
    // =========================

    Dispute createDispute(Dispute dispute);

    List<Dispute> getAllDisputes();

    Dispute getDisputeById(String id);

    Dispute approveDispute(String id);

    Dispute rejectDispute(String id);

    List<Dispute> getDisputesByPlayer(String playerEmail);

    // =========================
    // MESSAGE MANAGEMENT
    // =========================

    DisputeMessage addMessage(String disputeId, DisputeMessage message);

    List<DisputeMessage> getMessagesByDispute(String disputeId);

 
}
