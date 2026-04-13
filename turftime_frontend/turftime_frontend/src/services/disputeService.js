const API_BASE_URL = '/api/disputes';

const apiCall = async (endpoint, method = 'GET', body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = sessionStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
      return { success: false, message: 'Session expired. Please login again.' };
    }

    if (response.status === 403) {
      return { success: false, message: 'Access denied.' };
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      return { success: false, message: data.message || `Error: ${response.status}`, status: response.status };
    }

    return { success: true, data, status: response.status };
  } catch (error) {
    console.error('Dispute API Error:', error);
    return { success: false, message: error.message || 'Network error. Please try again.' };
  }
};

export const disputeService = {
  // Get all disputes (ADMIN)
  getAllDisputes: async () => apiCall('', 'GET'),

  // Get disputes for the current player by their email (server-side query)
  getMyDisputes: async (playerEmail) => {
    if (!playerEmail) return { success: true, data: [] };
    return apiCall(`/player/${encodeURIComponent(playerEmail)}`, 'GET');
  },

  // Store dispute ID locally for a player after creation (kept for legacy fallback)
  storeDisputeId: (playerEmail, disputeId) => {
    const key = `dispute_ids_${playerEmail}`;
    const ids = JSON.parse(localStorage.getItem(key) || '[]');
    if (!ids.includes(disputeId)) {
      ids.push(disputeId);
      localStorage.setItem(key, JSON.stringify(ids));
    }
  },


  // Get single dispute by ID
  getDisputeById: async (id) => apiCall(`/${id}`, 'GET'),

  // Create a new dispute
  createDispute: async (disputeData) => apiCall('', 'POST', disputeData),

  // Approve dispute (ADMIN)
  approveDispute: async (id) => apiCall(`/${id}/approve`, 'PUT'),

  // Reject dispute (ADMIN)
  rejectDispute: async (id) => apiCall(`/${id}/reject`, 'PUT'),

  // Get messages for a dispute
  getMessages: async (disputeId) => apiCall(`/${disputeId}/messages`, 'GET'),

  // Send a message in a dispute
  sendMessage: async (disputeId, messageData) => apiCall(`/${disputeId}/messages`, 'POST', messageData),
};

export default disputeService;
