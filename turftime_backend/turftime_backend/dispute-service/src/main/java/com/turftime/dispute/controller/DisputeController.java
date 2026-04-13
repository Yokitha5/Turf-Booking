package com.turftime.dispute.controller;

import com.turftime.dispute.entity.Dispute;
import com.turftime.dispute.entity.DisputeMessage;

import com.turftime.dispute.service.DisputeService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/disputes")
public class DisputeController {

    @Autowired
    private DisputeService disputeService;

    // =========================
    // CREATE DISPUTE
    // =========================
    @PostMapping
    public ResponseEntity<Dispute> createDispute(@RequestBody Dispute dispute) {

        Dispute saved = disputeService.createDispute(dispute);
        return ResponseEntity.ok(saved);
    }

    // =========================
    // GET ALL DISPUTES (ADMIN)
    // =========================
    @GetMapping
    public ResponseEntity<List<Dispute>> getAllDisputes() {

        return ResponseEntity.ok(disputeService.getAllDisputes());
    }

    // =========================
    // GET DISPUTES BY PLAYER EMAIL
    // =========================
    @GetMapping("/player/{email}")
    public ResponseEntity<List<Dispute>> getDisputesByPlayer(@PathVariable String email) {

        return ResponseEntity.ok(disputeService.getDisputesByPlayer(email));
    }

    // =========================
    // GET DISPUTE BY ID
    // =========================
    @GetMapping("/{id}")
    public ResponseEntity<Dispute> getDisputeById(@PathVariable String id) {

        return ResponseEntity.ok(disputeService.getDisputeById(id));
    }

    // =========================
    // APPROVE DISPUTE (ADMIN)
    // =========================
    @PutMapping("/{id}/approve")
    public ResponseEntity<Dispute> approveDispute(@PathVariable String id) {

        return ResponseEntity.ok(disputeService.approveDispute(id));
    }

    // =========================
    // REJECT DISPUTE (ADMIN)
    // =========================
    @PutMapping("/{id}/reject")
    public ResponseEntity<Dispute> rejectDispute(@PathVariable String id) {

        return ResponseEntity.ok(disputeService.rejectDispute(id));
    }

    // =========================
    // ADD MESSAGE
    // =========================
    @PostMapping("/{id}/messages")
    public ResponseEntity<DisputeMessage> addMessage(
            @PathVariable String id,
            @RequestBody DisputeMessage message) {

        return ResponseEntity.ok(disputeService.addMessage(id, message));
    }

    // =========================
    // GET MESSAGES
    // =========================
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<DisputeMessage>> getMessages(
            @PathVariable String id) {

        return ResponseEntity.ok(
                disputeService.getMessagesByDispute(id)
        );
    }

   


    
    
}
