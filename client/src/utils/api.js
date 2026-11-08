const BASE_URL = '/api';

const parseResponse = async (res, fallbackMessage) => {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await res.json();
  }
  await res.text();
  throw new Error(
    res.status >= 500
      ? 'Backend server is unavailable. Start the server on port 5000 and try again.'
      : `${fallbackMessage} (HTTP ${res.status})`
  );
};

export const API = {
  // Opportunities
  async getOpportunities(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'All') {
        searchParams.append(key, value);
      }
    });

    const url = `${BASE_URL}/opportunities${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch opportunities');
    return await res.json();
  },

  async getOpportunityById(id) {
    const res = await fetch(`${BASE_URL}/opportunities/${id}`);
    if (!res.ok) throw new Error('Failed to fetch opportunity details');
    return await res.json();
  },

  async getStats() {
    const res = await fetch(`${BASE_URL}/opportunities/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  },

  async requestAdminCode(email, password) {
    const res = await fetch(`${BASE_URL}/admin/session/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password })
    });
    const result = await parseResponse(res, 'Could not send verification code');
    if (!res.ok) throw new Error(result.message || 'Could not send verification code');
    return result;
  },

  async verifyAdminCode(code) {
    const res = await fetch(`${BASE_URL}/admin/session/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ code })
    });
    const result = await parseResponse(res, 'Admin verification failed');
    if (!res.ok) throw new Error(result.message || 'Admin verification failed');
    return result;
  },

  async checkAdminSession() {
    const res = await fetch(`${BASE_URL}/admin/session`, { credentials: 'same-origin' });
    return res.ok;
  },

  async endAdminSession() {
    const res = await fetch(`${BASE_URL}/admin/session`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error('Could not end the admin session');
    return await res.json();
  },

  async getMatcherContacts() {
    const res = await fetch(`${BASE_URL}/admin/matcher-contacts`, {
      credentials: 'same-origin'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Could not load matcher contacts');
    return result;
  },

  async createOpportunity(data) {
    const res = await fetch(`${BASE_URL}/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create opportunity');
    return result;
  },

  async updateOpportunity(id, data) {
    const res = await fetch(`${BASE_URL}/opportunities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update opportunity');
    return result;
  },

  async deleteOpportunity(id) {
    const res = await fetch(`${BASE_URL}/opportunities/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete opportunity');
    return result;
  },

  async verifyMatcherAccount(data) {
    const res = await fetch(`${BASE_URL}/matcher/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Could not verify your Google account');
    return result;
  },

  // File Upload
  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to upload photo');
    return result;
  },

  // Banner Settings
  async getBanner() {
    const res = await fetch(`${BASE_URL}/banner`);
    if (!res.ok) throw new Error('Failed to fetch banner settings');
    return await res.json();
  },

  async updateBanner(data) {
    const res = await fetch(`${BASE_URL}/banner`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update banner settings');
    return result;
  }
};

export default API;
