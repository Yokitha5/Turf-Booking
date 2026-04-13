package com.turftime.notificationreview.controller;

import com.turftime.notificationreview.dto.BookingDto;
import com.turftime.notificationreview.service.NotificationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // ==========================================
    // BOOKING CREATED / CANCELLED NOTIFICATION
    // ==========================================
    @PostMapping("/booking")
    public String sendBookingNotification(@RequestBody BookingDto bookingDTO) {

        notificationService.sendBookingNotification(bookingDTO);

        return "Notification sent successfully";
    }
}
