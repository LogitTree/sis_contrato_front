import api from "../../api/api";

export type GrupoUsuario = {
  id: number;
  nome: string;
  descricao?: string;
  status: "ATIVO" | "INATIVO";
};

export type GrupoUsuarioPayload = {
  nome: string;
  descricao?: string;
  status: "ATIVO" | "INATIVO";
};

export async function listarGruposUsuarios() {
  const response = await api.get("/grupo-usuarios");
  return response.data;
}

export async function criarGrupoUsuario(data: GrupoUsuarioPayload) {
  const response = await api.post("/grupo-usuarios", data);
  return response.data;
}

export async function atualizarGrupoUsuario(
  id: number,
  data: GrupoUsuarioPayload
) {
  const response = await api.put(`/grupo-usuarios/${id}`, data);
  return response.data;
}

export async function removerGrupoUsuario(id: number) {
  const response = await api.delete(`/grupo-usuarios/${id}`);
  return response.data;
}