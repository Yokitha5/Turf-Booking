package com.turftime.booking.service.impl;

import com.turftime.booking.dto.BookingRequest;
import com.turftime.booking.dto.BookingNotificationDto;
import com.turftime.booking.entity.Booking;
import com.turftime.booking.exception.BookingNotFoundException;
import com.turftime.booking.exception.InvalidBookingException;
import com.turftime.booking.repository.BookingRepository;
import com.turftime.booking.service.BookingService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final RestTemplate restTemplate;

    @Autowired
    public BookingServiceImpl(BookingRepository bookingRepository,
                              RestTemplate restTemplate) {
        this.bookingRepository = bookingRepository;
        this.restTemplate = restTemplate;
    }

    // =========================
    // CREATE BOOKING
    // =========================
    @Override
    public Booking createBooking(BookingRequest request) {

        validateTimeRange(request);

        checkSlotConflict(
                request.getVenueId(),
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime(),
                null
        );

        Booking booking = new Booking();
        booking.setId(UUID.randomUUID().toString());
        booking.setVenueId(request.getVenueId());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPlayerEmail(request.getPlayerEmail());
        booking.setStatus("CONFIRMED");

        Booking savedBooking = bookingRepository.save(booking);

        // 🔥 Send Notification (Service-to-Service)
        sendNotification(savedBooking);

        return savedBooking;
    }

    // =========================
    // CANCEL BOOKING
    // =========================
    @Override
    public Booking cancelBooking(String bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found"));

        if ("CANCELLED".equals(booking.getStatus())) {
            throw new InvalidBookingException("Booking already cancelled");
        }

        booking.setStatus("CANCELLED");

        Booking updatedBooking = bookingRepository.save(booking);

        // 🔥 Notify cancellation
        sendNotification(updatedBooking);

        return updatedBooking;
    }

    // =========================
    // RESCHEDULE BOOKING
    // =========================
    @Override
    public Booking rescheduleBooking(String bookingId, BookingRequest request) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found"));

        if ("CANCELLED".equals(booking.getStatus())) {
            throw new InvalidBookingException("Cannot reschedule cancelled booking");
        }

        validateTimeRange(request);

        checkSlotConflict(
                booking.getVenueId(),
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime(),
                bookingId
        );

        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());

        Booking updatedBooking = bookingRepository.save(booking);

        // 🔥 Notify reschedule
        sendNotification(updatedBooking);

        return updatedBooking;
    }

    // =========================
    // GET BOOKINGS BY PLAYER
    // =========================
    @Override
    public List<Booking> getBookingsByPlayer(String email) {
        return bookingRepository.findByPlayerEmail(email);
    }

    // =========================
    // GET BOOKINGS BY VENUE
    // =========================
    @Override
    public List<Booking> getBookingsByVenue(String venueId, LocalDate date) {
        return bookingRepository.findByVenueIdAndBookingDate(venueId, date)
                .stream()
                .filter(b -> !"CANCELLED".equals(b.getStatus()))
                .collect(java.util.stream.Collectors.toList());
    }

    // =========================
    // PRIVATE: SEND NOTIFICATION
    // =========================
    
    @Override
    public Booking getBookingById(String id) {

        return bookingRepository.findById(id)
                .orElseThrow(() ->
                        new BookingNotFoundException("Booking not found with id: " + id));
    }

    
    private void sendNotification(Booking booking) {

        try {
            BookingNotificationDto dto = new BookingNotificationDto();
            dto.setId(booking.getId());
            dto.setVenueId(booking.getVenueId());
            dto.setPlayerEmail(booking.getPlayerEmail());
            dto.setStatus(booking.getStatus());
            dto.setBookingDate(booking.getBookingDate());
            dto.setStartTime(booking.getStartTime());
            dto.setEndTime(booking.getEndTime());

            restTemplate.postForObject(
                    "http://localhost:10017/notifications/booking",
                    dto,
                    String.class
            );

        } catch (Exception e) {
            System.out.println("⚠ Notification service not reachable");
        }
    }

    // =========================
    // VALIDATION METHODS
    // =========================
    private void validateTimeRange(BookingRequest request) {

        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new InvalidBookingException("Start time and End time are required");
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new InvalidBookingException("Invalid time range");
        }
    }

    private void checkSlotConflict(String venueId,
                                   LocalDate date,
                                   LocalTime start,
                                   LocalTime end,
                                   String excludeBookingId) {

        List<Booking> existingBookings =
                bookingRepository.findByVenueIdAndBookingDate(venueId, date);

        for (Booking existing : existingBookings) {

            if ("CANCELLED".equals(existing.getStatus())) {
                continue;
            }

            if (excludeBookingId != null &&
                    existing.getId().equals(excludeBookingId)) {
                continue;
            }

            boolean overlaps =
                    start.isBefore(existing.getEndTime()) &&
                    end.isAfter(existing.getStartTime());

            if (overlaps) {
                throw new InvalidBookingException("Slot already booked");
            }
        }
    }
}
