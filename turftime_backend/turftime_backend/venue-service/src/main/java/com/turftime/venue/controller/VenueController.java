package com.turftime.venue.controller;

import com.turftime.venue.dto.VenueRequestDTO;
import com.turftime.venue.dto.VenueResponseDTO;
import com.turftime.venue.entity.Venue;
import com.turftime.venue.service.VenueService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/venues")
public class VenueController {

    @Autowired
    private VenueService venueService;

    // ✅ CREATE VENUE
    @PostMapping
    public ResponseEntity<VenueResponseDTO> createVenue(
            @Valid @RequestBody VenueRequestDTO requestDTO) {

        Venue venue = mapToEntity(requestDTO);
        Venue savedVenue = venueService.createVenue(venue);

        return new ResponseEntity<>(mapToResponseDTO(savedVenue), HttpStatus.CREATED);
    }

    // ✅ UPDATE VENUE
    @PutMapping("/{id}")
    public ResponseEntity<VenueResponseDTO> updateVenue(
            @PathVariable String id,
            @Valid @RequestBody VenueRequestDTO requestDTO) {

        Venue venue = mapToEntity(requestDTO);
        Venue updatedVenue = venueService.updateVenue(id, venue);

        return ResponseEntity.ok(mapToResponseDTO(updatedVenue));
    }

    // ✅ DELETE VENUE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVenue(@PathVariable String id) {

        venueService.deleteVenue(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ GET VENUE BY ID
    @GetMapping("/{id}")
    public ResponseEntity<VenueResponseDTO> getVenueById(@PathVariable String id) {

        Venue venue = venueService.getVenueById(id);
        return ResponseEntity.ok(mapToResponseDTO(venue));
    }

    // ✅ GET ALL VENUES
    @GetMapping
    public ResponseEntity<List<VenueResponseDTO>> getAllVenues() {

        List<VenueResponseDTO> response =
                venueService.getAllVenues()
                        .stream()
                        .map(this::mapToResponseDTO)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // ✅ GET ACTIVE VENUES
    @GetMapping("/active")
    public ResponseEntity<List<VenueResponseDTO>> getActiveVenues() {

        List<VenueResponseDTO> response =
                venueService.getActiveVenues()
                        .stream()
                        .map(this::mapToResponseDTO)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // ✅ GET VENUES BY OWNER
    @GetMapping("/owner/{email}")
    public ResponseEntity<List<VenueResponseDTO>> getVenuesByOwner(
            @PathVariable String email) {

        List<VenueResponseDTO> response =
                venueService.getVenuesByOwner(email)
                        .stream()
                        .map(this::mapToResponseDTO)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{venueId}/update-rating")
    public String updateRating(
            @PathVariable String venueId,
            @RequestParam double rating) {

        venueService.updateVenueRating(venueId, rating);

        return "Rating updated successfully";
    }



    // ================= MAPPING METHODS =================

    private Venue mapToEntity(VenueRequestDTO dto) {

        Venue venue = new Venue();

        venue.setName(dto.getName());
        venue.setDescription(dto.getDescription());
        venue.setOwnerEmail(dto.getOwnerEmail());
        venue.setLocation(dto.getLocation());
        venue.setLatitude(dto.getLatitude());
        venue.setLongitude(dto.getLongitude());
        venue.setAmenities(dto.getAmenities());
        venue.setMediaUrls(dto.getMediaUrls());
        venue.setPricePerHour(dto.getPricePerHour());
        venue.setOpeningTime(dto.getOpeningTime());
        venue.setClosingTime(dto.getClosingTime());
        venue.setSlotDuration(dto.getSlotDuration());

        return venue;
    }

    private VenueResponseDTO mapToResponseDTO(Venue venue) {

        VenueResponseDTO dto = new VenueResponseDTO();

        dto.setId(venue.getId());
        dto.setName(venue.getName());
        dto.setDescription(venue.getDescription());
        dto.setOwnerEmail(venue.getOwnerEmail());
        dto.setLocation(venue.getLocation());
        dto.setLatitude(venue.getLatitude());
        dto.setLongitude(venue.getLongitude());
        dto.setAmenities(venue.getAmenities());
        dto.setMediaUrls(venue.getMediaUrls());
        dto.setPricePerHour(venue.getPricePerHour());
        dto.setOpeningTime(venue.getOpeningTime());
        dto.setClosingTime(venue.getClosingTime());
        dto.setSlotDuration(venue.getSlotDuration());
        dto.setActive(venue.isActive());

        return dto;
    }
}
