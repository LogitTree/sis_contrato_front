import axios from "axios";

const TOKEN_KEY = "@contratos:token";
const USER_KEY = "@contratos:user";
const EMPRESA_ATIVA_KEY = "@contratos:empresa_ativa";

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

export function setEmpresaAtivaHeader(empresaId: number | null) {
  if (empresaId) {
    api.defaults.headers.common["x-empresa-id"] = String(empresaId);
  } else {
    delete api.defaults.headers.common["x-empresa-id"];
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EMPRESA_ATIVA_KEY);

  setAuthToken(null);
  setEmpresaAtivaHeader(null);

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const empresaAtiva = localStorage.getItem(EMPRESA_ATIVA_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (empresaAtiva) {
    try {
      const empresa = JSON.parse(empresaAtiva);

      if (empresa?.id) {
        config.headers["x-empresa-id"] = String(empresa.id);
      }
    } catch (error) {
      console.error("Erro ao recuperar empresa ativa:", error);
      localStorage.removeItem(EMPRESA_ATIVA_KEY);
      setEmpresaAtivaHeader(null);
    }
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