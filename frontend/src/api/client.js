const API_URL = 'http://localhost:5000/api';

export const apiClient = {
  async login(username, password) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Błąd logowania');
    }

    return response.json();
  },

  async register(username, email, password) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Błąd rejestracji');
    }

    return response.json();
  },

  async checkSession() {
    const response = await fetch(`${API_URL}/check-session`);
    if (!response.ok) {
      throw new Error('Błąd sprawdzania sesji');
    }
    return response.json();
  },

  async logout() {
    const response = await fetch(`${API_URL}/logout`, { method: 'POST' });
    if (!response.ok) {
      throw new Error('Błąd wylogowania');
    }
    return response.json();
  }
};
