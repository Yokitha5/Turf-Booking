package com.turftime.notificationreview.service;

import com.turftime.notificationreview.entity.Review;
import java.util.List;

public interface ReviewService {

    Review addReview(Review review);

    List<Review> getReviewsByVenue(String venueId);

    double calculateAverageRating(String venueId);
}
