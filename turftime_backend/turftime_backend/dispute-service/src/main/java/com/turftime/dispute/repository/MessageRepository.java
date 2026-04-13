package com.turftime.dispute.repository;

import com.turftime.dispute.entity.DisputeMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MessageRepository
        extends MongoRepository<DisputeMessage, String> {

    List<DisputeMessage> findByDisputeId(String disputeId);
}
