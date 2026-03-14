import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from "react";

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
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('@contratos:token');
    const storedUser = localStorage.getItem('@contratos:user');

    try {
      if (token && storedUser) {
        setAuthToken(token);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Erro ao reidratar sessão:', error);
      localStorage.removeItem('@contratos:token');
      localStorage.removeItem('@contratos:user');
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}