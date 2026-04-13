package com.turftime.booking.repository;

import com.turftime.booking.entity.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByVenueIdAndBookingDate(String venueId, LocalDate bookingDate);

    List<Booking> findByPlayerEmail(String playerEmail);
}
