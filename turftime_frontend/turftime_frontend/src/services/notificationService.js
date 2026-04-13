import { API_CONFIG } from '../config/apiConfig';

const NOTIFICATION_API_URL = API_CONFIG.NOTIFICATION_API_URL;

const notificationService = {
  /**
   * Send booking notification (confirmation or cancellation)
   * @param {Object} bookingData - Booking data object
   * @param {string} bookingData.id - Booking ID
   * @param {string} bookingData.venueId - Venue ID
   * @param {string} bookingData.playerEmail - Player email
   * @param {string} bookingData.bookingDate - Booking date
   * @param {string} bookingData.startTime - Start time
   * @param {string} bookingData.endTime - End time
   * @param {string} bookingData.status - Booking status (CONFIRMED or CANCELLED)
   * @returns {Promise<Object>} Response from backend
   */
  sendBookingNotification: async (bookingData) => {
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(
        `${NOTIFICATION_API_URL}/notifications/booking`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(bookingData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send booking notification');
      }

      return {
        success: true,
        message: 'Notification sent successfully',
      };
    } catch (error) {
      console.error('Error sending booking notification:', error);
      return {
        success: false,
        message: error.message || 'Error sending notification',
      };
    }
  },
};

export default notificationService;
