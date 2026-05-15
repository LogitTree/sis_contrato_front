// src/services/compras/compraService.ts

import api from "../../api/api";

export type CompraStatus =
  | "ABERTA"
  | "PARCIALMENTE_RECEBIDA"
  | "RECEBIDA"
  | "CANCELADA";

export type CompraRow = {
  id: number;
  fornecedor_id?: number | null;
  data_pedido?: string;
  status?: CompraStatus;
  observacao?: string | null;
  valor_total?: string | number | null;
  valor_frete?: string | number | null;
  valor_desconto?: string | number | null;
  forma_pagamento?: string | null;
  tem_contas_pagar?: boolean;

  fornecedor?: {
    id: number;
    nome?: string;
    razao_social?: string;
    nome_fantasia?: string;
  };

  Fornecedor?: {
    id: number;
    nome?: string;
    razao_social?: string;
    nome_fantasia?: string;
  };

  itens?: any[];
  CompraItems?: any[];
};

export type FornecedorOption = {
  id: number;
  nome: string;
};

export type FormaPagamentoOption = {
  id: number;
  descricao: string;
  ativo: boolean;
  permite_parcelamento: boolean;
};

export type ParcelaPreview = {
  parcela: number;
  total_parcelas: number;
  data_vencimento: string;
  valor_original: number;
  numero_documento?: string;
  anexo_nome?: string;
};

export type CompraListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "ASC" | "DESC";
  orderBy?: string;
  orderDir?: "ASC" | "DESC";
  fornecedor_id?: number;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
};

export function pickListResponse(resData: any) {
  if (Array.isArray(resData?.data)) {
    return {
      data: resData.data,
      total: Number(resData.total ?? resData.count ?? 0) || 0,
    };
  }

  if (Array.isArray(resData?.data?.data)) {
    return {
      data: resData.data.data,
      total: Number(resData.data.total ?? resData.data.count ?? 0) || 0,
    };
  }

  if (Array.isArray(resData?.data?.rows)) {
    return {
      data: resData.data.rows,
      total: Number(resData.data.count ?? 0) || 0,
    };
  }

  if (Array.isArray(resData?.rows)) {
    return {
      data: resData.rows,
      total: Number(resData.count ?? 0) || 0,
    };
  }

  if (Array.isArray(resData?.items)) {
    return {
      data: resData.items,
      total: Number(resData.total ?? 0) || 0,
    };
  }

  return { data: [], total: 0 };
}

export async function listarCompras(params: CompraListParams) {
  const response = await api.get("/compras", { params });
  return pickListResponse(response.data);
}

export async function excluirCompraService(id: number) {
  const response = await api.delete(`/compras/${id}`);
  return response.data;
}

export async function cancelarCompraService(id: number) {
  const response = await api.post(`/compras/${id}/cancelar`, {});
  return response.data;
}

export async function listarFornecedoresCompra() {
  const response = await api.get("/fornecedores", {
    params: {
      page: 1,
      limit: 1000,
    },
  });

  const rows =
    response.data?.data ??
    response.data?.rows ??
    response.data?.items ??
    [];

  return (Array.isArray(rows) ? rows : []).map((f: any) => ({
    id: Number(f.id),
    nome:
      f.nome ??
      f.razao_social ??
      f.nome_fantasia ??
      `Fornecedor #${f.id}`,
  }));
}

export async function listarFormasPagamentoCompra() {
  const response = await api.get("/formas-pagamento", {
    params: {
      ativo: true,
      page: 1,
      limit: 1000,
      sort: "descricao",
      order: "ASC",
    },
  });

  const rows =
    response.data?.data ??
    response.data?.rows ??
    response.data?.items ??
    [];

  return Array.isArray(rows) ? rows : [];
}

export async function buscarContasDaCompra(compraId: number) {
  const response = await api.get(`/contas-pagar/compra/${compraId}`);
  return response.data;
}

export async function cancelarFechamentoFinanceiroCompra(
  compraId: number
) {
  const response = await api.put(
    `/contas-pagar/compra/${compraId}/cancelar`
  );

  return response.data;
}

export async function gerarContasPagarCompra(
  compraId: number,
  payload: {
    quantidade_parcelas: number;
    data_primeiro_vencimento: string;
    intervalo_dias: number;
    forma_pagamento: string;
    observacao?: string;
  }
) {
  const response = await api.post(`/contas-pagar/gerar/${compraId}`, payload);
  return response.data;
}