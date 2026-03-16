import api from "../../api/api";
import type { ContaPagar, ContaPagarFiltros } from "./types";

export async function listarContasPagar(
  filtros: ContaPagarFiltros = {}
): Promise<ContaPagar[]> {
  const params = new URLSearchParams();

  if (filtros.fornecedor_id) params.append("fornecedor_id", filtros.fornecedor_id);
  if (filtros.compra_id) params.append("compra_id", filtros.compra_id);
  if (filtros.status) params.append("status", filtros.status);
  if (filtros.numero_documento) params.append("numero_documento", filtros.numero_documento);

  const query = params.toString();
  const url = query ? `/contas-pagar?${query}` : "/contas-pagar";

  const { data } = await api.get(url);
  return data;
}

export async function cancelarContaPagar(id: number) {
  const { data } = await api.put(`/contas-pagar/${id}/cancelar`);
  return data;
}

export async function cancelarContasPorCompra(compraId: number) {
  const { data } = await api.put(`/contas-pagar/compra/${compraId}/cancelar`);
  return data;
}

export async function registrarPagamentoConta(
  contaId: number,
  payload: {
    data_pagamento: string;
    valor_pago: number;
    forma_pagamento?: string;
    observacao?: string;
  }
) {
  const { data } = await api.post(`/contas-pagar/${contaId}/pagamentos`, payload);
  return data;
}