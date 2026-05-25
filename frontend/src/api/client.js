const API_URL = 'http://localhost:5001/api';

const getToken = () => localStorage.getItem('beton_token');
const setToken = (token) => localStorage.setItem('beton_token', token);
const removeToken = () => localStorage.removeItem('beton_token');

const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getToken();

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    
    // Jeśli token wygasł lub jest nieprawidłowy, wyloguj
    if (response.status === 401 && token) {
      removeToken();
      window.location.reload();
    }
    
    throw new Error(errorData.error || `Błąd zapytania: ${response.status}`);
  }

  return response.json();
};

export const apiClient = {
  async login(username, password) {
    const data = await fetchWithAuth('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  async register(username, email, password) {
    const data = await fetchWithAuth('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  async checkSession() {
    return fetchWithAuth('/check-session');
  },

  async logout() {
    const result = await fetchWithAuth('/logout', { method: 'POST' });
    removeToken();
    return result;
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
