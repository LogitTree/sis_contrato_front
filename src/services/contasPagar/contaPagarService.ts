// src/services/contasPagar/contaPagarService.ts

import api from "../../api/api";

export type ContaPagarStatus =
  | "ABERTO"
  | "PARCIAL"
  | "PAGO"
  | "VENCIDO"
  | "CANCELADO";

export type ContaPagarRow = {
  id: number;
  compra_id: number;
  fornecedor_id: number;
  numero_documento?: string | null;
  descricao?: string | null;
  parcela: number;
  total_parcelas: number;
  data_emissao?: string | null;
  data_vencimento?: string | null;
  valor_original?: string | number | null;
  valor_pago?: string | number | null;
  saldo?: string | number | null;
  status?: ContaPagarStatus;
  forma_pagamento?: string | null;
  observacao?: string | null;
  fornecedor?: {
    id: number;
    nome?: string;
    razao_social?: string;
    nome_fantasia?: string;
  };
  compra?: {
    id: number;
    data_pedido?: string | null;
    numero_nota_fiscal?: string | null;
    valor_total?: string | number | null;
  };
};

export type FornecedorOption = {
  id: number;
  nome: string;
};

export type ContaPagarListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "ASC" | "DESC";
  orderBy?: string;
  orderDir?: "ASC" | "DESC";
  fornecedor_id?: number;
  status?: string;
  compra_id?: number;
  numero_documento?: string;
  vencimento_inicio?: string;
  vencimento_fim?: string;
  somente_em_aberto?: boolean;
  somente_vencidas?: boolean;
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

  if (Array.isArray(resData)) {
    return {
      data: resData,
      total: resData.length,
    };
  }

  return { data: [], total: 0 };
}

export async function listarContasPagar(params: ContaPagarListParams) {
  const response = await api.get("/contas-pagar", { params });
  return pickListResponse(response.data);
}

export async function cancelarContaPagar(id: number) {
  const response = await api.put(`/contas-pagar/${id}/cancelar`);
  return response.data;
}

export async function listarFornecedoresContaPagar() {
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

export async function gerarRelatorioContasPagarPdf(params: any) {
  const token = localStorage.getItem("@contratos:token");

  const query = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const url = `${api.defaults.baseURL}/contas-pagar/relatorio/pdf?${query.toString()}`;

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("Erro ao gerar relatório.");
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
}

// src/services/contasPagar/contaPagarService.ts

export type PagamentoContaPagar = {
  id: number;
  conta_pagar_id: number;
  data_pagamento: string;
  valor_pago: string | number;
  forma_pagamento?: string | null;
  observacao?: string | null;
  created_at?: string;
};

export type ContaPagarDetail = ContaPagarRow & {
  pagamentos?: PagamentoContaPagar[];
};

export type FormaPagamentoOption = {
  id: number;
  descricao: string;
  ativo?: boolean;
  permite_parcelamento?: boolean;
};

export async function buscarContaPagar(id: number) {
  const response = await api.get(`/contas-pagar/${id}`);
  return response.data as ContaPagarDetail;
}

export async function registrarPagamentoContaPagar(
  id: number,
  payload: {
    data_pagamento: string;
    valor_pago: number;
    forma_pagamento: string;
    observacao?: string;
  }
) {
  const response = await api.post(`/contas-pagar/${id}/pagamentos`, payload);
  return response.data;
}

export async function excluirPagamentoContaPagar(id: number) {
  const response = await api.delete(`/contas-pagar/pagamentos/${id}`);
  return response.data;
}

export async function listarFormasPagamentoContaPagar() {
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