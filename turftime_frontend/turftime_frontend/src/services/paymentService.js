const API_BASE_URL = '/api/payments';

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
      console.error('Payment API Error:', {
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
    console.error('Payment API Error:', error);
    return {
      success: false,
      message: error.message || 'Network error. Please try again.',
      error: error.name
    };
  }
};

export const paymentService = {
  /**
   * Create a payment intent (Razorpay order)
   * @param {Object} paymentData
   * @param {string} paymentData.bookingId - Booking ID
   * @param {number} paymentData.amount - Amount in INR
   */
  createPaymentIntent: async (paymentData) => {
    return await apiCall('/create-intent', 'POST', paymentData);
  },

  /**
   * Verify payment after Razorpay success
   * @param {Object} verificationData
   * @param {string} verificationData.orderId - Razorpay order ID
   * @param {string} verificationData.paymentId - Razorpay payment ID
   * @param {string} verificationData.signature - Razorpay signature
   */
  verifyPayment: async (verificationData) => {
    return await apiCall('/verify', 'POST', verificationData);
  },

  /**
   * Request refund for a payment
   * @param {string} paymentId - Payment ID
   */
  refundPayment: async (paymentId) => {
    return await apiCall('/refund', 'POST', { paymentId });
  },

  /**
   * Get payout status for owner
   * @param {string} ownerId - Owner ID
   */
  getPayoutStatus: async (ownerId) => {
    return await apiCall(`/payout-status/${ownerId}`, 'GET');
  },
};

export default paymentService;
