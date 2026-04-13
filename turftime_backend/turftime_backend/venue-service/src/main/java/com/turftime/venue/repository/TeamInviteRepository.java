package com.turftime.venue.repository;

import com.turftime.venue.entity.TeamInvite;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * MongoDB repository for TeamInvite.
 */
public interface TeamInviteRepository extends MongoRepository<TeamInvite, String> {

    // Player uses this to see their pending invites
    List<TeamInvite> findByToEmailAndStatus(String toEmail, String status);

    // All invites for a player (all statuses)
    List<TeamInvite> findByToEmail(String toEmail);

    // Captain views all invites they have sent for a team
    List<TeamInvite> findByTeamIdAndFromEmail(String teamId, String fromEmail);
}
