// src/services/controleAcesso/usuarioService.ts
import api from "../../api/api";

export type UsuarioSistema = {
  id: number;
  nome: string;
  email: string;
  status: "ATIVO" | "INATIVO";
  tenant_id?: number;
  grupo_usuario_id: number;
  grupoUsuario?: {
    id: number;
    nome: string;
  };
};

export type UsuarioPayload = {
  nome: string;
  email?: string;
  senha?: string;
  status: "ATIVO" | "INATIVO";
  grupo_usuario_id: number;
};

export async function listarUsuarios() {
  const response = await api.get("/usuario");
  return response.data;
}

export async function criarUsuario(data: UsuarioPayload) {
  const response = await api.post("/usuario", data);
  return response.data;
}

export async function atualizarUsuario(id: number, data: UsuarioPayload) {
  const response = await api.put(`/usuario/${id}`, data);
  return response.data;
}

export async function removerUsuario(id: number) {
  const response = await api.delete(`/usuario/${id}`);
  return response.data;
}

export async function alterarSenhaUsuario(
  usuarioId: number,
  novaSenha: string
) {
  const response = await api.put(
    `/usuario/${usuarioId}/senha`,
    {
      nova_senha: novaSenha,
    }
  );

  return response.data;
}