package com.turftime.notificationreview.service.impl;

import com.turftime.notificationreview.entity.Review;
import com.turftime.notificationreview.repository.ReviewRepository;
import com.turftime.notificationreview.service.NotificationService;
import com.turftime.notificationreview.service.ReviewService;
import com.turftime.notificationreview.dto.BookingValidationResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpMethod;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReviewServiceImpl implements ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private RestTemplate restTemplate;

    // ===============================
    // ADD REVIEW
    // ===============================
    @Override
    public Review addReview(Review review) {

        // =========================================
        // 1️⃣ VALIDATE BOOKING (WITH JWT FORWARDING)
        // =========================================

        // Get authentication from current request
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String token = null;

        if (authentication != null && authentication.getCredentials() != null) {
            token = authentication.getCredentials().toString();
        }

        if (token == null) {
            throw new RuntimeException("Authorization token missing");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<BookingValidationResponse> response =
                restTemplate.exchange(
                        "http://localhost:10014/bookings/" + review.getBookingId(),
                        HttpMethod.GET,
                        entity,
                        BookingValidationResponse.class
                );

        BookingValidationResponse booking = response.getBody();

        if (booking == null) {
            throw new RuntimeException("Invalid booking ID");
        }

        if (!"CONFIRMED".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("Only confirmed bookings can be reviewed");
        }

        // =========================================
        // 2️⃣ PREVENT DUPLICATE REVIEW
        // =========================================

        reviewRepository.findByBookingId(review.getBookingId())
                .ifPresent(r -> {
                    throw new RuntimeException("Review already submitted for this booking");
                });

        review.setCreatedAt(LocalDateTime.now());

        Review savedReview = reviewRepository.save(review);

        // =========================================
        // 3️⃣ CALCULATE AVERAGE RATING
        // =========================================

        double average = calculateAverageRating(review.getVenueId());

        // =========================================
        // 4️⃣ UPDATE VENUE SERVICE RATING
        // =========================================

        try {
            restTemplate.put(
                    "http://localhost:10013/venues/"
                            + review.getVenueId()
                            + "/update-rating?rating=" + average,
                    null
            );
        } catch (Exception e) {
            System.out.println("⚠ Venue service not reachable");
        }

        // =========================================
        // 5️⃣ SEND EMAIL NOTIFICATION
        // =========================================

        notificationService.sendEmail(
                review.getOwnerEmail(),
                "New Review Received ⭐",
                "You received a new rating: "
                        + review.getRating()
                        + "\nAverage rating now: "
                        + average
        );

        return savedReview;
    }

    // ===============================
    // GET REVIEWS BY VENUE
    // ===============================
    @Override
    public List<Review> getReviewsByVenue(String venueId) {
        return reviewRepository.findByVenueId(venueId);
    }

    // ===============================
    // CALCULATE AVERAGE
    // ===============================
    @Override
    public double calculateAverageRating(String venueId) {

        List<Review> reviews = reviewRepository.findByVenueId(venueId);

        if (reviews.isEmpty()) return 0.0;

        return reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
    }
}
