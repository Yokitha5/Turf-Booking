package com.turftime.venue.service.impl;

import com.turftime.venue.entity.Venue;
import com.turftime.venue.exception.ResourceNotFoundException;
import com.turftime.venue.repository.VenueRepository;
import com.turftime.venue.service.VenueService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VenueServiceImpl implements VenueService {

    @Autowired
    private VenueRepository venueRepository;

    @Override
    public Venue createVenue(Venue venue) {
        venue.setActive(true);
        return venueRepository.save(venue);
    }

    @Override
    public Venue updateVenue(String id, Venue venue) {

        Venue existingVenue = venueRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Venue not found with id: " + id));

        existingVenue.setName(venue.getName());
        existingVenue.setDescription(venue.getDescription());
        existingVenue.setLocation(venue.getLocation());
        existingVenue.setLatitude(venue.getLatitude());
        existingVenue.setLongitude(venue.getLongitude());
        existingVenue.setAmenities(venue.getAmenities());
        existingVenue.setMediaUrls(venue.getMediaUrls());
        existingVenue.setPricePerHour(venue.getPricePerHour());
        existingVenue.setOpeningTime(venue.getOpeningTime());
        existingVenue.setClosingTime(venue.getClosingTime());
        existingVenue.setSlotDuration(venue.getSlotDuration());

        return venueRepository.save(existingVenue);
    }

    @Override
    public void deleteVenue(String id) {

        Venue venue = venueRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Venue not found with id: " + id));

        venueRepository.delete(venue);
    }

    @Override
    public Venue getVenueById(String id) {

        return venueRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Venue not found with id: " + id));
    }

    @Override
    public List<Venue> getAllVenues() {
        return venueRepository.findAll();
    }

    @Override
    public List<Venue> getActiveVenues() {
        return venueRepository.findByActiveTrue();
    }

    @Override
    public List<Venue> getVenuesByOwner(String ownerEmail) {
        return venueRepository.findByOwnerEmail(ownerEmail);
    }

    // =========================================================
    // 🔥 NEW METHOD - UPDATE VENUE AVERAGE RATING
    // =========================================================
    @Override
    public void updateVenueRating(String venueId, double rating) {

        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Venue not found with id: " + venueId));

        venue.setAverageRating(rating);  // make sure field exists in entity

        venueRepository.save(venue);
    }
}
