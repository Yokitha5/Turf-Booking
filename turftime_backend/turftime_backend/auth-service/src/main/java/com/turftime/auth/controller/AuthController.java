package com.turftime.auth.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.turftime.auth.entity.User;
import com.turftime.auth.dto.RegisterRequest;
import com.turftime.auth.dto.UpdateProfileRequest;
import com.turftime.auth.service.AuthService;
import com.turftime.auth.dto.LoginRequest;
import java.util.List;
import java.security.Principal;
@RestController
@RequestMapping("/auth")

public class AuthController {

    private AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Register API
    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }
    
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        String response = authService.login(request);
        return ResponseEntity.ok(response);
    }
 // ✅ GET ALL USERS (ADMIN)
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @PutMapping("/users/{email}/suspend")
    public ResponseEntity<User> suspendUser(@PathVariable String email) {
        return ResponseEntity.ok(authService.suspendUser(email));
    }

    @PutMapping("/users/{email}/reactivate")
    public ResponseEntity<User> reactivateUser(@PathVariable String email) {
        return ResponseEntity.ok(authService.reactivateUser(email));
    }

    @DeleteMapping("/users/{email}")
    public ResponseEntity<String> deleteUser(@PathVariable String email) {
        authService.deleteUser(email);
        return ResponseEntity.ok("User deleted successfully");
    }

    // ✅ GET MY PROFILE (PLAYER / OWNER)
    // JWT principal = username; look up full user from DB
    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile(Principal principal) {
        return ResponseEntity.ok(authService.getMyProfile(principal.getName()));
    }

    // ✅ UPDATE PROFILE (PLAYER / OWNER)
    @PutMapping("/profile/{email}")
    public ResponseEntity<User> updateProfile(
            @PathVariable String email,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(email, request));
    }
}
