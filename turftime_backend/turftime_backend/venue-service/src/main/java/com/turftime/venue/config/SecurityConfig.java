package com.turftime.venue.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // Return 401 for missing/expired/invalid token so the frontend can redirect to login
        AuthenticationEntryPoint unauthorizedHandler = (request, response, ex) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized - token missing or expired\"}");
        };

        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedHandler))
            .authorizeHttpRequests(auth -> auth

                // ALLOW ALL OPTIONS REQUESTS FOR CORS PREFLIGHT
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Swagger
                .requestMatchers(
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/swagger-ui.html"
                ).permitAll()

                // ONLY REVIEW SERVICE CAN UPDATE RATING
                .requestMatchers(HttpMethod.PUT, "/venues/*/update-rating").hasRole("SERVICE")

                // GET -> PLAYER, OWNER, ADMIN
                .requestMatchers(HttpMethod.GET, "/venues/**").hasAnyRole("PLAYER", "OWNER", "ADMIN")

                // POST -> OWNER, ADMIN
                .requestMatchers(HttpMethod.POST, "/venues/**").hasAnyRole("OWNER", "ADMIN")

                // PUT -> OWNER, ADMIN
                .requestMatchers(HttpMethod.PUT, "/venues/**").hasAnyRole("OWNER", "ADMIN")

                // DELETE -> OWNER
                .requestMatchers(HttpMethod.DELETE, "/venues/**").hasRole("OWNER")

                // --- TEAM ENDPOINTS ---
                // All team operations accessible to PLAYER, OWNER, ADMIN.
                // Captain-only checks enforced in TeamService business logic.
                .requestMatchers(HttpMethod.GET,    "/teams/**").hasAnyRole("PLAYER", "OWNER", "ADMIN")
                .requestMatchers(HttpMethod.POST,   "/teams/**").hasAnyRole("PLAYER", "OWNER", "ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/teams/**").hasAnyRole("PLAYER", "OWNER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/teams/**").hasAnyRole("PLAYER", "OWNER", "ADMIN")

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
