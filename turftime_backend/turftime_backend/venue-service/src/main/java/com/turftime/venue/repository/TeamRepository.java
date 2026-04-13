package com.turftime.venue.repository;

import com.turftime.venue.entity.Team;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * MongoDB repository for Team.
 * Isolated from VenueRepository – no changes to existing venue queries.
 */
public interface TeamRepository extends MongoRepository<Team, String> {

    // All teams where the captain is a given email
    List<Team> findByCaptainEmail(String captainEmail);

    // All teams a player is a member of
    List<Team> findByMemberEmailsContaining(String playerEmail);

    // All teams looking for players (for "Available Teams to Join" list)
    List<Team> findByLookingForPlayersTrue();

    // Search by name (case-insensitive) – used for the search bar
    List<Team> findByNameContainingIgnoreCase(String name);

    // Search by sport
    List<Team> findBySportIgnoreCase(String sport);

    // Active teams only
    List<Team> findByActiveTrue();
}
