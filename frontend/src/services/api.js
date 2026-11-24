// Cliente API para TECFLIX

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('tecflix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || 'Error en la solicitud a TECFLIX API');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Autenticación
  auth: {
    register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    getMe: () => request('/auth/me', { method: 'GET' }),
  },

  // Videos
  videos: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/videos${query ? `?${query}` : ''}`, { method: 'GET' });
    },
    getById: (id) => request(`/videos/${id}`, { method: 'GET' }),
    upload: (formData) => request('/videos/upload', { method: 'POST', body: formData }),
    watch: (id, profileId) => request(`/videos/${id}/watch`, {
      method: 'POST',
      body: JSON.stringify({ profile_id: profileId })
    }),
    delete: (id) => request(`/videos/${id}`, { method: 'DELETE' }),
  },

  // Perfiles y Skins
  profiles: {
    getAll: () => request('/profiles', { method: 'GET' }),
    create: (payload) => request('/profiles', { method: 'POST', body: JSON.stringify(payload) }),
    updateSkin: (id, skinId) => request(`/profiles/${id}/skin`, {
      method: 'PUT',
      body: JSON.stringify({ skin_id: skinId })
    }),
    getSkins: () => request('/profiles/skins/all', { method: 'GET' }),
    createCustomSkin: (payload) => request('/profiles/skins/custom', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  },

  // Facturación y Tarjetas
  billing: {
    getMethods: () => request('/billing/methods', { method: 'GET' }),
    addMethod: (payload) => request('/billing/methods', { method: 'POST', body: JSON.stringify(payload) }),
    deleteMethod: (id) => request(`/billing/methods/${id}`, { method: 'DELETE' }),
    getSubscription: () => request('/billing/subscription', { method: 'GET' }),
    subscribe: (payload) => request('/billing/subscribe', { method: 'POST', body: JSON.stringify(payload) }),
    getCreatorStats: () => request('/billing/creator-stats', { method: 'GET' }),
  },

  // Categorías
  categories: {
    getAll: () => request('/categories', { method: 'GET' }),
  }
};
