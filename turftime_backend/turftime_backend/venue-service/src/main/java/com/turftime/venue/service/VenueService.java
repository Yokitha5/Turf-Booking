package com.turftime.venue.service;

import com.turftime.venue.entity.Venue;

import java.util.List;

public interface VenueService {

    Venue createVenue(Venue venue);

    Venue updateVenue(String id, Venue venue);

    void deleteVenue(String id);

    Venue getVenueById(String id);

    List<Venue> getAllVenues();

    List<Venue> getActiveVenues();

    List<Venue> getVenuesByOwner(String ownerEmail);

    // 🔥 NEW METHOD (Safe addition - does not affect existing APIs)
    void updateVenueRating(String venueId, double rating);
}
