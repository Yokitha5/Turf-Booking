const API_BASE_URL = '/api/bookings';

// Helper to make API calls with token
const apiCall = async (endpoint, method = 'GET', body = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add JWT token to request if available
  const token = sessionStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      // Token expired or invalid - clear storage and redirect
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
      return { success: false, message: 'Session expired. Please login again.' };
    }

    // Check content type to determine how to parse the response
    const contentType = response.headers.get('content-type');
    let jsonData;

    if (contentType && contentType.includes('application/json')) {
      // Parse as JSON
      const data = await response.text();
      jsonData = data ? JSON.parse(data) : {};
    } else {
      // If it's plain text, use as-is
      jsonData = await response.text();
    }

    if (!response.ok) {
      console.error('Booking API Error:', {
        status: response.status,
        statusText: response.statusText,
        data: jsonData
      });
      return {
        success: false,
        message: jsonData.message || jsonData.error || jsonData || `Error: ${response.status}`,
        status: response.status,
        data: jsonData
      };
    }

    return {
      success: true,
      data: jsonData,
      status: response.status,
    };
  } catch (error) {
    console.error('Booking API Error:', error);
    return {
      success: false,
      message: error.message || 'Network error. Please try again.',
      error: error.name
    };
  }
};

export const bookingService = {
  /**
   * Create a new booking
   * @param {Object} bookingData - Booking details
   * @param {string} bookingData.venueId - Venue ID
   * @param {string} bookingData.playerEmail - Player email
   * @param {string} bookingData.bookingDate - Booking date (YYYY-MM-DD)
   * @param {string} bookingData.startTime - Start time (HH:MM:SS)
   * @param {string} bookingData.endTime - End time (HH:MM:SS)
   */
  createBooking: async (bookingData) => {
    return await apiCall('', 'POST', bookingData);
  },

  /**
   * Get booking by ID
   * @param {string} bookingId - Booking ID
   */
  getBookingById: async (bookingId) => {
    return await apiCall(`/${bookingId}`, 'GET');
  },

  /**
   * Get all bookings for a player
   * @param {string} email - Player email
   */
  getBookingsByPlayer: async (email) => {
    return await apiCall(`/player/${email}`, 'GET');
  },

  /**
   * Get all bookings for a venue on a specific date
   * @param {string} venueId - Venue ID
   * @param {string} date - Date (YYYY-MM-DD), optional
   */
  getBookingsByVenue: async (venueId, date) => {
    const endpoint = date ? `/venue/${venueId}?date=${date}` : `/venue/${venueId}`;
    return await apiCall(endpoint, 'GET');
  },

  /**
   * Cancel a booking
   * @param {string} bookingId - Booking ID
   */
  cancelBooking: async (bookingId) => {
    return await apiCall(`/${bookingId}/cancel`, 'PUT');
  },

  /**
   * Reschedule a booking
   * @param {string} bookingId - Booking ID
   * @param {Object} bookingData - New booking details
   * @param {string} bookingData.bookingDate - New booking date (YYYY-MM-DD)
   * @param {string} bookingData.startTime - New start time (HH:MM:SS)
   * @param {string} bookingData.endTime - New end time (HH:MM:SS)
   */
  rescheduleBooking: async (bookingId, bookingData) => {
    return await apiCall(`/${bookingId}/reschedule`, 'PUT', bookingData);
  },

  /**
   * Get all bookings for an owner (across all their venues)
   * @param {string} ownerEmail - Owner email
   */
  getBookingsByOwner: async (ownerEmail) => {
    return await apiCall(`/owner/${encodeURIComponent(ownerEmail)}`, 'GET');
  },
};

export default bookingService;
