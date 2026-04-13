package com.turftime.auth.dto;

public class RegisterRequest {

    private String name;
    private String username;   // ✅ Added
    private String email;
    private String password;
    private String role;
    private String phone;
    private String preferences;

    public RegisterRequest() {
    }

    public RegisterRequest(String name, String username, String email,
                           String password, String role,
                           String phone, String preferences) {
        this.name = name;
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
        this.phone = phone;
        this.preferences = preferences;
    }

    // Getters and Setters

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUsername() {   // ✅
        return username;
    }

    public void setUsername(String username) {   // ✅
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPreferences() {
        return preferences;
    }

    public void setPreferences(String preferences) {
        this.preferences = preferences;
    }
}
