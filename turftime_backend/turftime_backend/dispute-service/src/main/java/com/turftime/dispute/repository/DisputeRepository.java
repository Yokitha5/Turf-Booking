package com.turftime.dispute.repository;

import com.turftime.dispute.entity.Dispute;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DisputeRepository extends MongoRepository<Dispute, String> {
    List<Dispute> findByRaisedBy(String raisedBy);
}
