package com.turftime.dispute.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .authorizeHttpRequests(auth -> auth

            	

            	    // ================= DISPUTE CREATION =================
            	    .requestMatchers(HttpMethod.POST,
            	            "/disputes")
            	        .hasAnyRole("PLAYER", "OWNER")

            	    // ================= ADMIN DISPUTE ACTIONS =================
            	    .requestMatchers(HttpMethod.GET,
            	            "/disputes")
            	        .hasRole("ADMIN")

            	    .requestMatchers(HttpMethod.PUT,
            	            "/disputes/*/approve")
            	        .hasRole("ADMIN")

            	    .requestMatchers(HttpMethod.PUT,
            	            "/disputes/*/reject")
            	        .hasRole("ADMIN")

            	    // ================= MESSAGES =================
            	    .requestMatchers(HttpMethod.POST,
            	            "/disputes/*/messages")
            	        .hasAnyRole("PLAYER", "OWNER", "ADMIN")

            	    .requestMatchers(HttpMethod.GET,
            	            "/disputes/*/messages")
            	        .hasAnyRole("PLAYER", "OWNER", "ADMIN")

// ================= GET DISPUTES BY PLAYER =================
                    .requestMatchers(HttpMethod.GET,
                            "/disputes/player/*")
                        .hasAnyRole("PLAYER", "OWNER", "ADMIN")

                    // ================= GET SINGLE DISPUTE =================
            	    .requestMatchers(HttpMethod.GET,
            	            "/disputes/*")
            	        .hasAnyRole("PLAYER", "OWNER", "ADMIN")

            	    .anyRequest().authenticated()
            	)


            .addFilterBefore(jwtAuthenticationFilter,
                    UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowCredentials(true);
        corsConfiguration.addAllowedOrigin("http://localhost:5173");
        corsConfiguration.addAllowedOrigin("http://localhost:5174");
        corsConfiguration.addAllowedHeader("*");
        corsConfiguration.addAllowedMethod("*");
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return new CorsFilter(source);
    }

}
