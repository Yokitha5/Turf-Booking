package com.turftime.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.turftime.auth.dto.LoginRequest;
import com.turftime.auth.dto.RegisterRequest;
import com.turftime.auth.dto.UpdateProfileRequest;
import com.turftime.auth.entity.User;
import com.turftime.auth.repository.UserRepository;
import com.turftime.auth.entity.Role;
import com.turftime.auth.config.JwtUtil;

import java.util.Optional;
import java.util.List;
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // ================= REGISTER =================
    public String register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email already registered!";
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            return "Username already taken!";
        }

        User user = new User();
        user.setName(request.getName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // 🔥 Role assignment logic
        if (user.getEmail().equalsIgnoreCase("vishaniharini@gmail.com")) {
            user.setRole(Role.ADMIN);

        } else if (user.getEmail().toLowerCase().endsWith("@turftime.in")) {
            user.setRole(Role.OWNER);

        } else {
            user.setRole(Role.PLAYER);
        }

        user.setPhone(request.getPhone());
        user.setPreferences(request.getPreferences());

        // ✅ Default status
        user.setStatus("ACTIVE");

        userRepository.save(user);

        return "User registered successfully!";
    }

    // ================= LOGIN =================
    public String login(LoginRequest request) {

        String input = request.getUsernameOrEmail().trim().toLowerCase();

        Optional<User> optionalUser =
                userRepository.findByUsernameOrEmail(input, input);

        if (optionalUser.isEmpty()) {
            return "User not found!";
        }

        User user = optionalUser.get();

        // ✅ Check suspended
        if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            return "Your account is suspended!";
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return "Invalid password!";
        }

        // ✅ Generate JWT Token
        return jwtUtil.generateToken(
                user.getUsername(),
                user.getRole().name()
        );
    }
    
 // ===================================================
 // 🔥 GET ALL USERS (ADMIN)
 // ===================================================
 public List<User> getAllUsers() {
     return userRepository.findAll();
 }


    // ===================================================
    // 🔥 NEW METHOD - SUSPEND USER (ADMIN)
    // ===================================================
    public User suspendUser(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus("SUSPENDED");

        return userRepository.save(user);
    }

    // ===================================================
    // 🔥 NEW METHOD - REACTIVATE USER (ADMIN)
    // ===================================================
    public User reactivateUser(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus("ACTIVE");

        return userRepository.save(user);
    }

    // ===================================================
    // 🔥 NEW METHOD - DELETE USER (ADMIN)
    // ===================================================
    public void deleteUser(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        userRepository.delete(user);
    }

    // ===================================================
    // 🔥 GET MY PROFILE (PLAYER / OWNER)
    // Returns full user from DB using username from JWT
    // ===================================================
    public User getMyProfile(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ===================================================
    // 🔥 UPDATE PROFILE (PLAYER / OWNER)
    // ===================================================
    public User updateProfile(String email, UpdateProfileRequest request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update only fields that are provided (non-null)
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getPreferences() != null) {
            user.setPreferences(request.getPreferences());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        // Player-specific fields
        if (request.getJerseyNumber() != null) {
            user.setJerseyNumber(request.getJerseyNumber());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getSkills() != null) {
            user.setSkills(request.getSkills());
        }

        return userRepository.save(user);
    }
}

