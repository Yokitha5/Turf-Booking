package com.turftime.notificationreview.controller;

import com.turftime.notificationreview.entity.Review;
import com.turftime.notificationreview.service.ReviewService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @PostMapping
    public Review addReview(@RequestBody Review review) {
        return reviewService.addReview(review);
    }

    @GetMapping("/{venueId}")
    public List<Review> getReviews(@PathVariable String venueId) {
        return reviewService.getReviewsByVenue(venueId);
    }
    
    @GetMapping("/{venueId}/average")
    public double getAverageRating(@PathVariable String venueId) {
        return reviewService.calculateAverageRating(venueId);
    }
}
