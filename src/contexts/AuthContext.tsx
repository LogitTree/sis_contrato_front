import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from "react" 

import api, { setAuthToken } from '../api/api';

type User = {
  id: number;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'GESTOR' | 'OPERADOR';
  tenant_id: number | null;
};

type AuthContextData = {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isGestor: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  // 🔁 Reidrata sessão ao recarregar a página
  useEffect(() => {
    const token = localStorage.getItem('@contratos:token');
    const storedUser = localStorage.getItem('@contratos:user');

    if (token && storedUser) {
      setAuthToken(token);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 🔐 Login
  async function login(email: string, senha: string) {
    const response = await api.post('/auth/login', {
      email,
      senha,
    });

    
    const { token, user } = response.data;

    localStorage.setItem('@contratos:token', token);
    localStorage.setItem('@contratos:user', JSON.stringify(user));

    setAuthToken(token);
    setUser(user);
  }

  // 🚪 Logout
  function logout() {
    localStorage.removeItem('@contratos:token');
    localStorage.removeItem('@contratos:user');

    setAuthToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.perfil === 'ADMIN',
        isGestor: user?.perfil === 'GESTOR',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 🔥 Hook padrão
export function useAuth() {
  return useContext(AuthContext);
}
