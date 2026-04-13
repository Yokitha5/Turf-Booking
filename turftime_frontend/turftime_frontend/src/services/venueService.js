const API_BASE_URL = '/api/venues';

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
      console.error('API Error Response:', {
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
    console.error('API Error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return {
      success: false,
      message: error.message || 'Network error. Please try again.',
      error: error.name
    };
  }
};

export const venueService = {
  // Get all venues
  getAllVenues: async () => {
    return await apiCall('', 'GET');
  },

  // Get active venues only
  getActiveVenues: async () => {
    return await apiCall('/active', 'GET');
  },

  // Get venue by ID
  getVenueById: async (id) => {
    return await apiCall(`/${id}`, 'GET');
  },

  // Get venues by owner email
  getVenuesByOwner: async (email) => {
    return await apiCall(`/owner/${email}`, 'GET');
  },

  // Create new venue (OWNER, ADMIN)
  createVenue: async (venueData) => {
    return await apiCall('', 'POST', venueData);
  },

  // Update venue (OWNER, ADMIN)
  updateVenue: async (id, venueData) => {
    return await apiCall(`/${id}`, 'PUT', venueData);
  },

  // Delete venue (OWNER)
  deleteVenue: async (id) => {
    return await apiCall(`/${id}`, 'DELETE');
  },

  // Update venue rating (SERVICE role only - internal use)
  updateVenueRating: async (venueId, rating) => {
    return await apiCall(`/${venueId}/update-rating?rating=${rating}`, 'PUT');
  },
};

export default venueService;

