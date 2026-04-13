package com.turftime.dispute.service.impl;

import com.turftime.dispute.entity.Dispute;
import com.turftime.dispute.entity.DisputeMessage;

import com.turftime.dispute.repository.DisputeRepository;
import com.turftime.dispute.repository.MessageRepository;

import com.turftime.dispute.service.DisputeService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class DisputeServiceImpl implements DisputeService {

    @Autowired
    private DisputeRepository disputeRepository;

    @Autowired
    private MessageRepository messageRepository;


    // =========================
    // CREATE DISPUTE
    // =========================
    @Override
    public Dispute createDispute(Dispute dispute) {

        dispute.setStatus("OPEN");
        if (dispute.getCreatedAt() == null) {
            dispute.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        }
        if (dispute.getPriority() == null) {
            dispute.setPriority("MEDIUM");
        }

        return disputeRepository.save(dispute);
    }

    // =========================
    // GET ALL DISPUTES
    // =========================
    @Override
    public List<Dispute> getAllDisputes() {
        return disputeRepository.findAll();
    }

    // =========================
    // GET DISPUTE BY ID
    // =========================
    @Override
    public Dispute getDisputeById(String id) {
        return disputeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dispute not found"));
    }

    // =========================
    // APPROVE DISPUTE (ADMIN)
    // =========================
    @Override
    public Dispute approveDispute(String id) {

        Dispute dispute = getDisputeById(id);

        dispute.setStatus("APPROVED");

        return disputeRepository.save(dispute);
    }

    // =========================
    // REJECT DISPUTE (ADMIN)
    // =========================
    @Override
    public Dispute rejectDispute(String id) {

        Dispute dispute = getDisputeById(id);

        dispute.setStatus("REJECTED");

        return disputeRepository.save(dispute);
    }

    // =========================
    // GET DISPUTES BY PLAYER
    // =========================
    @Override
    public List<Dispute> getDisputesByPlayer(String playerEmail) {
        return disputeRepository.findByRaisedBy(playerEmail);
    }

    // =========================
    // ADD MESSAGE
    // =========================
    @Override
    public DisputeMessage addMessage(String disputeId, DisputeMessage message) {

        // Check dispute exists
        Dispute dispute = getDisputeById(disputeId);

        message.setDisputeId(dispute.getId());

        return messageRepository.save(message);
    }

    // =========================
    // GET MESSAGES
    // =========================
    @Override
    public List<DisputeMessage> getMessagesByDispute(String disputeId) {
        return messageRepository.findByDisputeId(disputeId);
    }

    // =========================
    
}
