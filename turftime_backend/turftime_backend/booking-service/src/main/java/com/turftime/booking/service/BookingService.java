package com.turftime.booking.service;

import com.turftime.booking.dto.BookingRequest;
import com.turftime.booking.entity.Booking;

import java.time.LocalDate;
import java.util.List;

public interface BookingService {

    Booking createBooking(BookingRequest request);

    Booking cancelBooking(String bookingId);
    
    Booking getBookingById(String id);



    Booking rescheduleBooking(String bookingId, BookingRequest request);

    List<Booking> getBookingsByPlayer(String email);

    List<Booking> getBookingsByVenue(String venueId, LocalDate date);
}
