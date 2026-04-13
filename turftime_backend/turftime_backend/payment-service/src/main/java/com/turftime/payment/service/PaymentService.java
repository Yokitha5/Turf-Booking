package com.turftime.payment.service;

import com.turftime.payment.entity.Payment;
import com.turftime.payment.entity.Payout;

import java.util.List;

public interface PaymentService {

    Payment createPaymentIntent(String bookingId, double amount);

    String verifyPayment(String orderId,
                         String paymentId,
                         String signature);

    String refundPayment(String paymentId);

    List<Payout> getPayoutStatus(String ownerId);
}
