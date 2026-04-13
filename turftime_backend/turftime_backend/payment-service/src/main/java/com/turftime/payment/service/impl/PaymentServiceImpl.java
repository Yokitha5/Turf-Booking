package com.turftime.payment.service.impl;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import com.turftime.payment.entity.Payment;
import com.turftime.payment.entity.Payout;
import com.turftime.payment.repository.PaymentRepository;
import com.turftime.payment.repository.PayoutRepository;
import com.turftime.payment.service.PaymentService;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final RazorpayClient razorpayClient;
    private final PaymentRepository paymentRepository;
    private final PayoutRepository payoutRepository;

    @Value("${razorpay.secret}")
    private String secret;

    public PaymentServiceImpl(RazorpayClient razorpayClient,
                              PaymentRepository paymentRepository,
                              PayoutRepository payoutRepository) {
        this.razorpayClient = razorpayClient;
        this.paymentRepository = paymentRepository;
        this.payoutRepository = payoutRepository;
    }

    @Override
    public Payment createPaymentIntent(String bookingId, double amount) {

        try {
            JSONObject options = new JSONObject();
            options.put("amount", (int)(amount * 100));
            options.put("currency", "INR");
            options.put("receipt", bookingId);

            Order order = razorpayClient.orders.create(options);

            Payment payment = new Payment();
            payment.setBookingId(bookingId);
         
            payment.setRazorpayOrderId(order.get("id"));
            payment.setAmount(amount);
            payment.setStatus("CREATED");
            payment.setCreatedAt(LocalDateTime.now());

            return paymentRepository.save(payment);

        } catch (Exception e) {
            throw new RuntimeException("Error creating payment intent");
        }
    }

    @Override
    public String verifyPayment(String orderId,
                                String paymentId,
                                String signature) {

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);

            boolean isValid = Utils.verifyPaymentSignature(options, secret);

            if (isValid) {

                Payment payment = paymentRepository
                        .findAll()
                        .stream()
                        .filter(p -> p.getRazorpayOrderId().equals(orderId))
                        .findFirst()
                        .orElseThrow();

                payment.setRazorpayPaymentId(paymentId);
                payment.setStatus("SUCCESS");
                paymentRepository.save(payment);

                // Create payout (10% commission)
                double ownerAmount = payment.getAmount() * 0.9;

                Payout payout = new Payout();
                payout.setOwnerId(payment.getOwnerId());
                payout.setPaymentId(payment.getId());
                payout.setAmount(ownerAmount);
                payout.setStatus("PENDING");
                payout.setCreatedAt(LocalDateTime.now());

                payoutRepository.save(payout);

                return "Payment verified successfully";
            }

            return "Invalid signature";

        } catch (Exception e) {
            throw new RuntimeException("Payment verification failed");
        }
    }

    @Override
    public String refundPayment(String paymentId) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow();

        payment.setStatus("REFUNDED");
        paymentRepository.save(payment);

        return "Refund processed";
    }

    @Override
    public List<Payout> getPayoutStatus(String ownerId) {
        return payoutRepository.findByOwnerId(ownerId);
    }
}
