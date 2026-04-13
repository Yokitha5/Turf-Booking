package com.turftime.notificationreview.service;

import com.turftime.notificationreview.dto.BookingDto;

public interface NotificationService {

    void sendEmail(String to, String subject, String message);

    void sendBookingNotification(BookingDto bookingDto);
}
