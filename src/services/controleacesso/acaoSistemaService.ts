import api from "../../api/api";

export type AcaoSistema = {
  id: number;
  modulo: string;
  nome: string;
  codigo: string;
  descricao?: string;
  status: "ATIVO" | "INATIVO";
};

export type AcaoSistemaPayload = {
  modulo: string;
  nome: string;
  codigo: string;
  descricao?: string;
  status: "ATIVO" | "INATIVO";
};

export async function listarAcoesSistema() {
  const response = await api.get("/acoes-sistema");
  return response.data;
}

export async function criarAcaoSistema(data: AcaoSistemaPayload) {
  const response = await api.post("/acoes-sistema", data);
  return response.data;
}

export async function atualizarAcaoSistema(
  id: number,
  data: AcaoSistemaPayload
) {
  const response = await api.put(`/acoes-sistema/${id}`, data);
  return response.data;
}

export async function removerAcaoSistema(id: number) {
  const response = await api.delete(`/acoes-sistema/${id}`);
  return response.data;
}