import authService from './authService';

const API_BASE_URL = '/api/auth';

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

    const text = await response.text();

    // Backend may return plain text (e.g. "User deleted successfully")
    let jsonData = {};
    try {
      jsonData = text ? JSON.parse(text) : {};
    } catch {
      // Plain text response — treat as message
      jsonData = { message: text };
    }

    if (!response.ok) {
      return {
        success: false,
        message: jsonData.message || `Error: ${response.status}`,
        status: response.status,
      };
    }

    return {
      success: true,
      data: jsonData,
      message: jsonData.message || text,
      status: response.status,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      message: error.message || 'Network error. Please try again.',
    };
  }
};

export const adminService = {
  // Get all users (ADMIN only)
  getAllUsers: async () => {
    const result = await apiCall('/users', 'GET');
    return result;
  },

  // Suspend a user (ADMIN only)
  suspendUser: async (email) => {
    const result = await apiCall(`/users/${email}/suspend`, 'PUT');
    
    if (result.success) {
      return {
        success: true,
        user: result.data,
      };
    }
    
    return result;
  },

  // Reactivate a suspended user (ADMIN only)
  reactivateUser: async (email) => {
    const result = await apiCall(`/users/${email}/reactivate`, 'PUT');

    if (result.success) {
      return {
        success: true,
        user: result.data,
      };
    }

    return result;
  },
  deleteUser: async (email) => {
    const result = await apiCall(`/users/${email}`, 'DELETE');
    return result;
  },
};

export default adminService;

