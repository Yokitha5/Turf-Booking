package com.turftime.notificationreview.repository;

import com.turftime.notificationreview.entity.Review;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends MongoRepository<Review, String> {

    Optional<Review> findByBookingId(String bookingId);

    List<Review> findByVenueId(String venueId);
}
