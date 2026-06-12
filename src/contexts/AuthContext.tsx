import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

import api, { setAuthToken, setEmpresaAtivaHeader } from "../api/api";

export type EmpresaUsuario = {
  id: number;
  razao_social: string;
  nome_fantasia: string;
  cnpj?: string;
  status?: "ATIVA" | "INATIVA";
};

type User = {
  id: number;
  nome: string;
  email: string;
  status?: "ATIVO" | "INATIVO";
  tenant_id: number | null;
  grupo_usuario_id?: number | null;
  grupo?: {
    id: number;
    nome: string;
    descricao?: string;
  } | null;
  permissoes: string[];
  empresas?: EmpresaUsuario[];
};

type AuthContextData = {
  user: User | null;
  permissoes: string[];
  empresas: EmpresaUsuario[];
  empresaAtiva: EmpresaUsuario | null;
  setEmpresaAtiva: (empresa: EmpresaUsuario | null) => void;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
};

type AuthProviderProps = {
  children: ReactNode;
};

const USER_KEY = "@contratos:user";
const TOKEN_KEY = "@contratos:token";
const EMPRESA_ATIVA_KEY = "@contratos:empresa_ativa";

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [empresaAtivaState, setEmpresaAtivaState] =
    useState<EmpresaUsuario | null>(null);
  const [loading, setLoading] = useState(true);

  const permissoes = user?.permissoes || [];
  const empresas = user?.empresas || [];

  function definirEmpresaAtiva(empresa: EmpresaUsuario | null) {
    setEmpresaAtivaState(empresa);

    if (empresa) {
      localStorage.setItem(EMPRESA_ATIVA_KEY, JSON.stringify(empresa));
      setEmpresaAtivaHeader(empresa.id);
    } else {
      localStorage.removeItem(EMPRESA_ATIVA_KEY);
      setEmpresaAtivaHeader(null);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    const storedEmpresaAtiva = localStorage.getItem(EMPRESA_ATIVA_KEY);

    try {
      if (token && storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        const empresasUsuario = parsedUser.empresas || [];

        setAuthToken(token);
        setUser(parsedUser);

        if (storedEmpresaAtiva) {
          const parsedEmpresa = JSON.parse(storedEmpresaAtiva) as EmpresaUsuario;

          const empresaAindaPermitida = empresasUsuario.find(
            (empresa) => Number(empresa.id) === Number(parsedEmpresa.id)
          );

          if (empresaAindaPermitida) {
            definirEmpresaAtiva(empresaAindaPermitida);
          } else if (empresasUsuario.length === 1) {
            definirEmpresaAtiva(empresasUsuario[0]);
          } else {
            definirEmpresaAtiva(null);
          }
        } else if (empresasUsuario.length === 1) {
          definirEmpresaAtiva(empresasUsuario[0]);
        }
      }
    } catch (error) {
      console.error("Erro ao reidratar sessão:", error);

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(EMPRESA_ATIVA_KEY);

      setAuthToken(null);
      setEmpresaAtivaHeader(null);
      setUser(null);
      setEmpresaAtivaState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  async function login(email: string, senha: string) {
    const response = await api.post("/auth/login", {
      email,
      senha,
    });

    const { token, user } = response.data as {
      token: string;
      user: User;
    };

    const empresasUsuario = user.empresas || [];

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    setAuthToken(token);
    setUser(user);

    if (empresasUsuario.length === 1) {
      definirEmpresaAtiva(empresasUsuario[0]);
    } else {
      definirEmpresaAtiva(null);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EMPRESA_ATIVA_KEY);

    setAuthToken(null);
    setEmpresaAtivaHeader(null);
    setUser(null);
    setEmpresaAtivaState(null);
  }

  function hasPermission(permission: string) {
    return permissoes.includes(permission);
  }

  function hasAnyPermission(permissionsToCheck: string[]) {
    return permissionsToCheck.some((permission) =>
      permissoes.includes(permission)
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        permissoes,
        empresas,
        empresaAtiva: empresaAtivaState,
        setEmpresaAtiva: definirEmpresaAtiva,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}