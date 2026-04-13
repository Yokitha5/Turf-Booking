package com.turftime.payment.controller;

import com.turftime.payment.dto.*;
import com.turftime.payment.entity.Payout;
import com.turftime.payment.service.PaymentService;

import org.apache.tomcat.util.net.openssl.ciphers.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // ===============================
    // Create Payment Intent
    // ===============================
    @PostMapping("/create-intent")
    public ResponseEntity<?> createPaymentIntent(
            @RequestBody PaymentRequest request
    ) {
        return ResponseEntity.ok(
                paymentService.createPaymentIntent(
                        request.getBookingId(),
                        request.getAmount()
                )
        );
    }

    // ===============================
    // Verify Payment
    // ===============================
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(
            @RequestBody PaymentVerificationRequest request
    ) {
        return ResponseEntity.ok(
                paymentService.verifyPayment(
                        request.getOrderId(),
                        request.getPaymentId(),
                        request.getSignature()
                )
        );
    }

    // ===============================
    // Refund
    // ===============================
    @PostMapping("/refund")
    public ResponseEntity<?> refund(
            @RequestBody RefundRequest request
    ) {
        return ResponseEntity.ok(
                paymentService.refundPayment(request.getPaymentId())
        );
    }

    // ===============================
    // Payout Status
    // ===============================
    @GetMapping("/payout-status/{ownerId}")
    public ResponseEntity<List<Payout>> payoutStatus(
            @PathVariable String ownerId
    ) {
        return ResponseEntity.ok(
                paymentService.getPayoutStatus(ownerId)
        );
    }

}
