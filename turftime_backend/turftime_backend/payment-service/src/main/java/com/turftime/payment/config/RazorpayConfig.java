package com.turftime.payment.config;

import com.razorpay.RazorpayClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RazorpayConfig {

    private final String key;
    private final String secret;

    public RazorpayConfig(
            @Value("${razorpay.key}") String key,
            @Value("${razorpay.secret}") String secret) {
        this.key = key;
        this.secret = secret;
    }

    @Bean
    public RazorpayClient razorpayClient() throws Exception {
        return new RazorpayClient(key, secret);
    }
}
