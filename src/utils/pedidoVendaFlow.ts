import api from "../api/api";

export function flowPerms(status?: string) {
  const s = (status || "").toUpperCase();

  return {
    canEdit: s === "RASCUNHO",
    canAprovar: s === "RASCUNHO",
    canExpedir: s === "APROVADO",
    canConcluir: s === "EXPEDIDO",
    canCancelar: s === "RASCUNHO" || s === "APROVADO" || s === "EXPEDIDO",
    canDevolver: s === "CONCLUIDO",
  };
}

export const pedidoVendaActions = {
  aprovar: (id: number) => api.post(`/pedidosvenda/${id}/aprovar`),
  expedir: (id: number) => api.post(`/pedidosvenda/${id}/expedir`),
  concluir: (id: number) => api.post(`/pedidosvenda/${id}/concluir`),
  cancelar: (id: number, motivo?: string) =>
    api.post(`/pedidosvenda/${id}/cancelar`, { motivo }),
  devolver: (id: number, motivo?: string) =>
    api.post(`/pedidosvenda/${id}/devolver`, { motivo }),
};