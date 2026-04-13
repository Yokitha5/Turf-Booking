/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

export const API_CONFIG = {
  // Backend API Base URLs - using Vite proxy to avoid CORS
  AUTH_API_URL: '/api/auth',
  VENUE_API_URL: '/api/venues',
  BOOKING_API_URL: '/api/bookings',
  PAYMENT_API_URL: '/api/payments',
  NOTIFICATION_API_URL: '/api',
  DISPUTE_API_URL: '/api/disputes',
  TEAM_API_URL: '/api/teams',
  
  // Razorpay Configuration
  RAZORPAY_KEY: 'rzp_test_SIG97zKmLzP9Uq', // Replace with your actual Razorpay key (demo key for testing)
  
  // API Endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH_REGISTER: '/register',
    AUTH_LOGIN: '/login',
    AUTH_LOGOUT: '/logout',
    
    // User management (Admin)
    USERS_GET_ALL: '/users',
    USERS_SUSPEND: '/users/{email}/suspend',
    USERS_DELETE: '/users/{email}',
    
    // Venue endpoints
    VENUES_GET_ALL: '/venues',
    VENUES_GET_ACTIVE: '/venues/active',
    VENUES_GET_BY_ID: '/venues/{id}',
    VENUES_GET_BY_OWNER: '/venues/owner/{email}',
    VENUES_CREATE: '/venues',
    VENUES_UPDATE: '/venues/{id}',
    VENUES_DELETE: '/venues/{id}',
    VENUES_UPDATE_RATING: '/venues/{id}/update-rating',
    
    // Booking endpoints
    BOOKINGS_CREATE: '/bookings',
    BOOKINGS_GET_BY_ID: '/bookings/{id}',
    BOOKINGS_GET_BY_PLAYER: '/bookings/player/{email}',
    BOOKINGS_CANCEL: '/bookings/{id}/cancel',
    BOOKINGS_RESCHEDULE: '/bookings/{id}/reschedule',
    
    // Payment endpoints
    PAYMENT_CREATE_INTENT: '/payments/create-intent',
    PAYMENT_VERIFY: '/payments/verify',
    PAYMENT_REFUND: '/payments/refund',
    PAYMENT_PAYOUT_STATUS: '/payments/payout-status/{ownerId}',
    
    // Review endpoints
    REVIEWS_ADD: '/reviews',
    REVIEWS_GET_BY_VENUE: '/reviews/{venueId}',
    REVIEWS_GET_AVERAGE: '/reviews/{venueId}/average',
    
    // Notification endpoints
    NOTIFICATIONS_BOOKING: '/notifications/booking',

    // ─── Team endpoints ────────────────────────────────────────────────────
    // CRUD
    TEAMS_CREATE:          '/teams',                         // POST
    TEAMS_GET_ALL:         '/teams',                         // GET  (available teams)
    TEAMS_SEARCH:          '/teams/search',                  // GET  ?keyword=
    TEAMS_MY:              '/teams/my',                      // GET  ?email=
    TEAMS_GET_BY_ID:       '/teams/{id}',                    // GET
    TEAMS_UPDATE:          '/teams/{id}',                    // PUT  ?captainEmail=
    TEAMS_DELETE:          '/teams/{id}',                    // DELETE ?captainEmail=

    // Member management (captain)
    TEAMS_REMOVE_MEMBER:   '/teams/{id}/members/{memberEmail}', // DELETE ?captainEmail=

    // Join requests (player → captain)
    TEAMS_SEND_JOIN_REQUEST:    '/teams/{id}/join-requests',               // POST
    TEAMS_GET_JOIN_REQUESTS:    '/teams/{id}/join-requests',               // GET  ?captainEmail=
    TEAMS_ACCEPT_JOIN_REQUEST:  '/teams/{id}/join-requests/{requestId}/accept',  // PUT ?captainEmail=
    TEAMS_DECLINE_JOIN_REQUEST: '/teams/{id}/join-requests/{requestId}/decline', // PUT ?captainEmail=

    // Invites (captain → player)
    TEAMS_SEND_INVITE:     '/teams/{id}/invites',            // POST  ?captainEmail=
    TEAMS_MY_INVITES:      '/teams/invites',                 // GET   ?playerEmail=
    TEAMS_ACCEPT_INVITE:   '/teams/invites/{inviteId}/accept',  // PUT  ?playerEmail=
    TEAMS_DECLINE_INVITE:  '/teams/invites/{inviteId}/decline', // PUT  ?playerEmail=
  },
};

/**
 * Helper to build full URL for API calls
 * @param {string} endpoint - The API endpoint path
 * @returns {string} Full URL for the API call
 */
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.AUTH_API_URL}${endpoint}`;
};

export default API_CONFIG;

