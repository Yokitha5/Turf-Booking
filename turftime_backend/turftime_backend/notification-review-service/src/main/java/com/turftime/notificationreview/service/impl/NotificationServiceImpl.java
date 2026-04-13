package com.turftime.notificationreview.service.impl;

import com.turftime.notificationreview.dto.BookingDto;
import com.turftime.notificationreview.service.NotificationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private JavaMailSender mailSender;

    // Generic Email Method
    @Override
    public void sendEmail(String to, String subject, String message) {

        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setTo(to);
        mailMessage.setSubject(subject);
        mailMessage.setText(message);

        mailSender.send(mailMessage);
    }

    // Booking Notification Method
    @Override
    public void sendBookingNotification(BookingDto bookingDto) {

        String subject;
        String message;

        if ("CANCELLED".equalsIgnoreCase(bookingDto.getStatus())) {
            subject = "Booking Cancelled ❌";
            message = "Your booking has been cancelled.\n\nBooking ID: "
                    + bookingDto.getId();
        } else {
            subject = "Booking Confirmed ✅";
            message = "Your booking is confirmed.\n\n"
                    + "Venue: " + bookingDto.getVenueId() + "\n"
                    + "Date: " + bookingDto.getBookingDate() + "\n"
                    + "Time: " + bookingDto.getStartTime()
                    + " - " + bookingDto.getEndTime();
        }

        sendEmail(
                bookingDto.getPlayerEmail(),
                subject,
                message
        );
    }
}
