import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_SYSTEM_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 👉 função para controlar o token globalmente
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
