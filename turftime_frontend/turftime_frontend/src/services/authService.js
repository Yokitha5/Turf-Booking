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

    // Check content type to determine how to parse the response
    const contentType = response.headers.get('content-type');
    let jsonData;

    if (contentType && contentType.includes('application/json')) {
      // Parse as JSON
      const data = await response.text();
      jsonData = data ? JSON.parse(data) : {};
    } else {
      // If it's plain text (like a JWT token), use as-is
      jsonData = await response.text();
    }

    if (!response.ok) {
      return {
        success: false,
        message: jsonData.message || jsonData || `Error: ${response.status}`,
        status: response.status,
      };
    }

    return {
      success: true,
      data: jsonData,
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

export const authService = {
  // Register new user
  register: async (registerData) => {
    // Auto-generate username from the email (part before @)
    const username = registerData.username || registerData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    const result = await apiCall('/register', 'POST', {
      name: registerData.name,
      username,
      email: registerData.email,
      password: registerData.password,
      phone: registerData.phone,
      role: registerData.role || 'PLAYER',
    });

    // Backend returns plain text string for both success and error (both HTTP 200)
    const msg = typeof result.data === 'string' ? result.data : '';
    const isError = msg.toLowerCase().includes('already') || msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('error');

    if (result.success && !isError) {
      // Registration succeeded — auto-login to get the JWT token.
      try {
        const loginResult = await apiCall('/login', 'POST', {
          usernameOrEmail: registerData.email,
          password: registerData.password,
        });

        if (loginResult.success) {
          const token = loginResult.data;
          const decodedUser = decodeToken(token);
          if (decodedUser) {
            decodedUser.email = registerData.email;
            decodedUser.name = registerData.name || decodedUser.name;
          }
          sessionStorage.setItem('token', token);
          if (decodedUser) {
            sessionStorage.setItem('user', JSON.stringify(decodedUser));
          }
          return { success: true, user: decodedUser, token };
        }
      } catch (_) {}
      // Auto-login failed — account was created, send to login page
      return { success: false, registered: true, message: 'Account created! Please log in.' };
    }

    return { success: false, message: msg || result.message || 'Registration failed.' };
  },

  // Login user
  login: async (email, password) => {
    const result = await apiCall('/login', 'POST', {
      usernameOrEmail: email,
      password,
    });

    if (result.success) {
      // The backend returns a JWT token as a string
      const token = result.data;
      
      // Decode JWT to extract user info
      const decodedUser = decodeToken(token);
      
      // JWT 'sub' is often the username, not the email.
      // Always override with the actual email used to login.
      if (decodedUser) {
        decodedUser.email = email;
      }
      
      sessionStorage.setItem('token', token);
      if (decodedUser) {
        sessionStorage.setItem('user', JSON.stringify(decodedUser));
      }

      return {
        success: true,
        user: decodedUser,
        token,
      };
    }

    return result;
  },

  // Get all users (ADMIN only)
  getAllUsers: async () => {
    return await apiCall('/users', 'GET');
  },

  // Suspend user (ADMIN only)
  suspendUser: async (email) => {
    return await apiCall(`/users/${email}/suspend`, 'PUT');
  },

  // Delete user (ADMIN only)
  deleteUser: async (email) => {
    return await apiCall(`/users/${email}`, 'DELETE');
  },

  // Update profile (PLAYER / OWNER)
  updateProfile: async (email, profileData) => {
    // Always save to sessionStorage immediately — never gate on API success
    const stored = sessionStorage.getItem('user');
    if (stored) {
      try {
        const current = JSON.parse(stored);
        const merged = {
          ...current,
          ...profileData,
          skills: Array.isArray(profileData.skills)
            ? profileData.skills
            : (profileData.skills ? profileData.skills.split(',') : current.skills),
        };
        sessionStorage.setItem('user', JSON.stringify(merged));
      } catch (_) {}
    }
    // Sync to DB in background (best-effort)
    try {
      const payload = {
        ...profileData,
        skills: Array.isArray(profileData.skills)
          ? profileData.skills.join(',')
          : profileData.skills,
      };
      await apiCall(`/profile/${encodeURIComponent(email)}`, 'PUT', payload);
    } catch (_) {}
    return { success: true };
  },

  // Get my profile from DB (used on app load to restore profile fields)
  getMyProfile: async () => {
    return await apiCall('/me', 'GET');
  },

  // Logout
  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },
};

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    console.log('Decoded JWT token:', decoded);
    
    // Normalize the user object to always have an email field
    // JWT might have 'sub' instead of 'email'
    if (!decoded.email && decoded.sub) {
      decoded.email = decoded.sub;
    }
    
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export default authService;

