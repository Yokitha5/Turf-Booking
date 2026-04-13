package com.turftime.booking.controller;

import com.turftime.booking.dto.BookingRequest;
import com.turftime.booking.entity.Booking;
import com.turftime.booking.service.BookingService;

import jakarta.validation.Valid;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;

    // ✅ Constructor Injection (Industry Standard)
    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }
    
 // ✅ NEW: GET BOOKING BY ID
    // =========================
    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable String id) {

        Booking booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(booking);
    }

    // =========================
    // CREATE BOOKING
    // =========================
    @PostMapping
    public ResponseEntity<Booking> createBooking(
            @Valid @RequestBody BookingRequest request) {

        Booking booking = bookingService.createBooking(request);

        // 201 CREATED (Correct REST Practice)
        return new ResponseEntity<>(booking, HttpStatus.CREATED);
    }

    // =========================
    // CANCEL BOOKING
    // =========================
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable String id) {

        Booking booking = bookingService.cancelBooking(id);

        return ResponseEntity.ok(booking);
    }

    // =========================
    // RESCHEDULE BOOKING
    // =========================
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<Booking> rescheduleBooking(
            @PathVariable String id,
            @Valid @RequestBody BookingRequest request) {

    	Booking booking = bookingService.rescheduleBooking(id, request);


        return ResponseEntity.ok(booking);
    }
    


    // =========================
    // GET BOOKINGS BY PLAYER
    // =========================
    @GetMapping("/player/{email}")
    public ResponseEntity<List<Booking>> getBookingsByPlayer(
            @PathVariable String email) {

        List<Booking> bookings = bookingService.getBookingsByPlayer(email);

        return ResponseEntity.ok(bookings);
    }

    // =========================
    // GET BOOKINGS BY VENUE + DATE
    // =========================
    @GetMapping("/venue/{venueId}")
    public ResponseEntity<List<Booking>> getBookingsByVenue(
            @PathVariable String venueId,
            @RequestParam(required = false)
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
            LocalDate date) {

        List<Booking> bookings = bookingService.getBookingsByVenue(venueId, date);
        return ResponseEntity.ok(bookings);
    }

}
