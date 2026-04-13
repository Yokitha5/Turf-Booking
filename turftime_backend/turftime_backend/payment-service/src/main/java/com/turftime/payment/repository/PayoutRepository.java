package com.turftime.payment.repository;

import com.turftime.payment.entity.Payout;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PayoutRepository extends MongoRepository<Payout, String> {
    List<Payout> findByOwnerId(String ownerId);
}
