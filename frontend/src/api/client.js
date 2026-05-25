const API_URL = 'http://localhost:5001/api';

const fetchWithAuth = async (endpoint, options = {}) => {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };
  
  // Usuń Content-Type jeśli wysyłamy FormData
  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type'];
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Błąd zapytania: ${response.status}`);
  }

  return response.json();
};

export const apiClient = {
  async login(username, password) {
    return fetchWithAuth('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async register(username, email, password) {
    return fetchWithAuth('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  async checkSession() {
    return fetchWithAuth('/check-session');
  },

  async logout() {
    return fetchWithAuth('/logout', { method: 'POST' });
  },

  async getMatches(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/matches?${query}`);
  },

  async getMatchDetails(id) {
    return fetchWithAuth(`/matches/${id}`);
  },

  async createCoupon(stawka, kursyIds) {
    return fetchWithAuth('/coupons', {
      method: 'POST',
      body: JSON.stringify({ stawka, kursy: kursyIds }),
    });
  },

  async getUserCoupons() {
    return fetchWithAuth('/coupons');
  },

  async deposit(amount) {
    return fetchWithAuth('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }
};
