import { API_CONFIG } from '../config/apiConfig';

const NOTIFICATION_API_URL = API_CONFIG.NOTIFICATION_API_URL;

const reviewService = {
  /**
   * Add a new review for a venue
   * @param {Object} reviewData - Review data object
   * @param {string} reviewData.bookingId - Booking ID
   * @param {string} reviewData.venueId - Venue ID
   * @param {string} reviewData.ownerEmail - Owner email
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment
   * @param {string} token - JWT token for authentication
   * @returns {Promise<Object>} Response from backend
   */
  addReview: async (reviewData, token) => {
    try {
      const response = await fetch(
        `${NOTIFICATION_API_URL}/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(reviewData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add review');
      }

      return {
        success: true,
        data: await response.json(),
      };
    } catch (error) {
      console.error('Error adding review:', error);
      return {
        success: false,
        message: error.message || 'Error adding review',
      };
    }
  },

  /**
   * Get all reviews for a venue
   * @param {string} venueId - Venue ID
   * @returns {Promise<Object>} Response from backend
   */
  getReviewsByVenue: async (venueId) => {
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(
        `${NOTIFICATION_API_URL}/reviews/${venueId}`,
        { method: 'GET', headers }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      return {
        success: true,
        data: await response.json(),
      };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return {
        success: false,
        message: error.message || 'Error fetching reviews',
        data: [],
      };
    }
  },

  /**
   * Get average rating for a venue
   * @param {string} venueId - Venue ID
   * @returns {Promise<Object>} Response from backend with average rating
   */
  getAverageRating: async (venueId) => {
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(
        `${NOTIFICATION_API_URL}/reviews/${venueId}/average`,
        { method: 'GET', headers }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch average rating');
      }

      const rating = await response.json();

      return {
        success: true,
        data: rating,
      };
    } catch (error) {
      console.error('Error fetching average rating:', error);
      return {
        success: false,
        message: error.message || 'Error fetching average rating',
        data: 0,
      };
    }
  },
};

export default reviewService;
