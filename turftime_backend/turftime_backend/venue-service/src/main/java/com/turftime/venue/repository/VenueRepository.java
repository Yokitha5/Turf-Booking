package com.turftime.venue.repository;

import com.turftime.venue.entity.Venue;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface VenueRepository extends MongoRepository<Venue, String> {

    List<Venue> findByActiveTrue();

    List<Venue> findByOwnerEmail(String ownerEmail);
}
