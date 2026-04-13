package com.turftime.payment.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secretKey;

    // ===============================
    // Extract Username
    // ===============================
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    // ===============================
    // Extract Role
    // ===============================
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    // ===============================
    // Extract Expiration
    // ===============================
    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    // ===============================
    // Validate Token
    // ===============================
    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return !extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return false;
        }
    }


    // ===============================
    // Extract All Claims
    // ===============================
    private Claims extractAllClaims(String token) {

        Key key = Keys.hmacShaKeyFor(secretKey.getBytes());

        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
