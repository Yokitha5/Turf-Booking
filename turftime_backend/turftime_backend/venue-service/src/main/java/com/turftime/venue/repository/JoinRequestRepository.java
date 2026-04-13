package com.turftime.venue.repository;

import com.turftime.venue.entity.JoinRequest;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * MongoDB repository for JoinRequest.
 */
public interface JoinRequestRepository extends MongoRepository<JoinRequest, String> {

    // Captain uses this to fetch all pending requests for a team
    List<JoinRequest> findByTeamIdAndStatus(String teamId, String status);

    // Player uses this to see their own submitted requests
    List<JoinRequest> findByPlayerEmail(String playerEmail);

    // Check if player already submitted a request for this team
    boolean existsByTeamIdAndPlayerEmailAndStatus(String teamId, String playerEmail, String status);
}
