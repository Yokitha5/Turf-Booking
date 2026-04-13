/**
 * teamService.js
 * Handles all team-related API calls to the venue-service backend.
 * Endpoints live under /api/teams (proxied to localhost:10013 by Vite).
 */

import API_CONFIG from '../config/apiConfig';

const BASE = API_CONFIG.TEAM_API_URL; // '/api/teams'

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

/**
 * Centralised response checker.
 * - 401 â†’ token expired/missing â†’ clear storage + redirect to login
 * - other non-ok â†’ throw with server message
 */
const checkResponse = async (res) => {
  if (res.status === 401) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }
  if (res.status === 403) {
    throw new Error('Access denied (403). The venue-service may need to be restarted in STS, or your session may have expired — please log out and log back in.');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res;
};

// â”€â”€â”€ TEAM CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Create a new team.
 * @param {Object} teamData - matches TeamRequestDTO
 * @param {string} token - JWT token
 */
export const createTeam = async (teamData, token) => {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(teamData),
  });
  await checkResponse(res);
  return res.json();
};

/**
 * Get all available teams (lookingForPlayers = true).
 * Shown in the "Available Teams to Join" modal.
 */
export const getAvailableTeams = async (token) => {
  const res = await fetch(BASE, {
    headers: authHeaders(token),
  });
  await checkResponse(res);
  return res.json();
};

/**
 * Search teams by name or sport keyword.
 * @param {string} keyword
 */
export const searchTeams = async (keyword, token) => {
  const res = await fetch(`${BASE}/search?keyword=${encodeURIComponent(keyword)}`, {
    headers: authHeaders(token),
  });
  await checkResponse(res);
  return res.json();
};

/**
 * Get teams the player is a member of (My Teams page).
 * @param {string} email - player's email
 */
export const getMyTeams = async (email, token) => {
  const res = await fetch(`${BASE}/my?email=${encodeURIComponent(email)}`, {
    headers: authHeaders(token),
  });
  await checkResponse(res);
  return res.json();
};

/**
 * Get a single team by ID.
 */
export const getTeamById = async (teamId, token) => {
  const res = await fetch(`${BASE}/${teamId}`, {
    headers: authHeaders(token),
  });
  await checkResponse(res);
  return res.json();
};

/**
 * Update team details (captain only).
 * @param {string} teamId
 * @param {Object} teamData - matches TeamRequestDTO
 * @param {string} captainEmail
 */
export const updateTeam = async (teamId, teamData, captainEmail, token) => {
  const res = await fetch(`${BASE}/${teamId}?captainEmail=${encodeURIComponent(captainEmail)}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(teamData),
  });
  await checkResponse(res);
  return res.json();
};

/**
 * Delete a team (captain only).
 * @param {string} teamId
 * @param {string} captainEmail
 */
export const deleteTeam = async (teamId, captainEmail, token) => {
  const res = await fetch(`${BASE}/${teamId}?captainEmail=${encodeURIComponent(captainEmail)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await checkResponse(res);
  // 204 No Content
};

// â”€â”€â”€ MEMBER MANAGEMENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Captain removes a member from the team.
 * @param {string} teamId
 * @param {string} memberEmail
 * @param {string} captainEmail
 */
export const removeMember = async (teamId, memberEmail, captainEmail, token) => {
  const res = await fetch(
    `${BASE}/${teamId}/members/${encodeURIComponent(memberEmail)}?captainEmail=${encodeURIComponent(captainEmail)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  await checkResponse(res);
  // 204 No Content — nothing to parse
  if (res.status === 204 || res.headers.get('content-length') === '0') return;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

// â”€â”€â”€ JOIN REQUESTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Player sends a join request.
 * @param {string} teamId
 * @param {Object} requestData - { playerEmail, playerName, requestedRole, message }
 */
export const sendJoinRequest = async (teamId, requestData, token) => {
  const res = await fetch(`${BASE}/${teamId}/join-requests`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(requestData),
  });
  await checkResponse(res);
  return res.json();
};

/**
 * Captain gets all pending join requests for their team.
 */
export const getPendingJoinRequests = async (teamId, captainEmail, token) => {
  const res = await fetch(
    `${BASE}/${teamId}/join-requests?captainEmail=${encodeURIComponent(captainEmail)}`,
    { headers: authHeaders(token) }
  );
  await checkResponse(res);
  return res.json();
};

/**
 * Captain accepts a join request.
 */
export const acceptJoinRequest = async (teamId, requestId, captainEmail, token) => {
  const res = await fetch(
    `${BASE}/${teamId}/join-requests/${requestId}/accept?captainEmail=${encodeURIComponent(captainEmail)}`,
    { method: 'PUT', headers: authHeaders(token) }
  );
  await checkResponse(res);
  return res.json();
};

/**
 * Captain declines a join request.
 */
export const declineJoinRequest = async (teamId, requestId, captainEmail, token) => {
  const res = await fetch(
    `${BASE}/${teamId}/join-requests/${requestId}/decline?captainEmail=${encodeURIComponent(captainEmail)}`,
    { method: 'PUT', headers: authHeaders(token) }
  );
  await checkResponse(res);
  return res.json();
};

// â”€â”€â”€ INVITES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Captain sends an invite to a specific player.
 * @param {string} teamId
 * @param {Object} inviteData - { fromEmail, fromName, toEmail, toName, offeredRole, message }
 * @param {string} captainEmail
 */
export const sendInvite = async (teamId, inviteData, captainEmail, token) => {
  const res = await fetch(
    `${BASE}/${teamId}/invites?captainEmail=${encodeURIComponent(captainEmail)}`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(inviteData),
    }
  );
  await checkResponse(res);
  return res.json();
};

/**
 * Player fetches their pending invites (shown in the "Invites" tab).
 */
export const getPendingInvites = async (playerEmail, token) => {
  const res = await fetch(
    `${BASE}/invites?playerEmail=${encodeURIComponent(playerEmail)}`,
    { headers: authHeaders(token) }
  );
  await checkResponse(res);
  return res.json();
};

/**
 * Player accepts an invite.
 */
export const acceptInvite = async (inviteId, playerEmail, token) => {
  const res = await fetch(
    `${BASE}/invites/${inviteId}/accept?playerEmail=${encodeURIComponent(playerEmail)}`,
    { method: 'PUT', headers: authHeaders(token) }
  );
  await checkResponse(res);
  return res.json();
};

/**
 * Player declines an invite.
 */
export const declineInvite = async (inviteId, playerEmail, token) => {
  const res = await fetch(
    `${BASE}/invites/${inviteId}/decline?playerEmail=${encodeURIComponent(playerEmail)}`,
    { method: 'PUT', headers: authHeaders(token) }
  );
  await checkResponse(res);
  return res.json();
};

