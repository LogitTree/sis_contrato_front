import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_SYSTEM_ENDPOINT,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  setAuthToken(null);

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      logout();
    }

    return Promise.reject(error);
  }
);

export default api;