const API_URL = 'http://localhost:5001/api';

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
  },

  async getMatches(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/matches?${query}`);
    if (!response.ok) throw new Error('Błąd pobierania meczów');
    return response.json();
  },

  async getMatchDetails(id) {
    const response = await fetch(`${API_URL}/matches/${id}`);
    if (!response.ok) throw new Error('Błąd pobierania szczegółów meczu');
    return response.json();
  },

  async createCoupon(stawka, kursyIds) {
    const response = await fetch(`${API_URL}/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stawka, kursy: kursyIds }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Błąd tworzenia kuponu');
    }
    return response.json();
  },

  async getUserCoupons() {
    const response = await fetch(`${API_URL}/coupons`);
    if (!response.ok) throw new Error('Błąd pobierania kuponów');
    return response.json();
  },

  async deposit(amount) {
    const response = await fetch(`${API_URL}/wallet/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
    });
    if (!response.ok) throw new Error('Błąd wpłaty');
    return response.json();
  }
};
