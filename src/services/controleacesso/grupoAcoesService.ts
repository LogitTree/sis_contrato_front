import api from "../../api/api";

export async function listarAcoesDoGrupo(grupoUsuarioId: number) {
  const response = await api.get(`/grupo-usuarios/${grupoUsuarioId}/acoes`);
  return response.data;
}

export async function sincronizarAcoesDoGrupo(
  grupoUsuarioId: number,
  acoesIds: number[]
) {
  const response = await api.put(`/grupo-usuarios/${grupoUsuarioId}/acoes`, {
    acoes: acoesIds,
  });

  return response.data;
}