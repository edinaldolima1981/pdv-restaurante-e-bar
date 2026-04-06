const API_URL = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const api = {
  async get(collection: string) {
    const res = await fetch(`${API_URL}/${collection}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch ${collection}`);
    return res.json();
  },

  async post(collection: string, data: unknown) {
    const res = await fetch(`${API_URL}/${collection}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to create ${collection}`);
    return res.json();
  },

  async put(collection: string, id: string, data: unknown) {
    const res = await fetch(`${API_URL}/${collection}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update ${collection}`);
    return res.json();
  },

  async delete(collection: string, id: string) {
    const res = await fetch(`${API_URL}/${collection}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to delete ${collection}`);
    return res.json();
  },

  async batch(operations: unknown[]) {
    const res = await fetch(`${API_URL}/batch`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ operations }),
    });
    if (!res.ok) throw new Error('Batch operation failed');
    return res.json();
  },

  async login(credentials: unknown) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};
