import api from "../../api/api";

export type PedidoVendaStatus =
  | "RASCUNHO"
  | "APROVADO"
  | "PARCIALMENTE_ATENDIDO"
  | "ATENDIDO"
  | "CONCLUIDO"
  | "CANCELADO"
  | "DEVOLVIDO"
  | "PARCIALMENTE_DEVOLVIDO";

export type PedidoVenda = {
  id: number;
  data: string;
  contrato_id: number;
  status: PedidoVendaStatus | string;
  total?: number | string;
  total_liquido?: number | string;
  total_expedido?: number | string;
  total_devolvido?: number | string;
  itens?: any[];
};

export type ContratoOption = {
  id: number;
  numero: string;
  orgaoNome?: string;
};

export type EmpresaOption = {
  id: number;
  nome: string;
};

export type PedidoVendaFilters = {
  page: number;
  limit: number;
  orderBy: "id" | "data" | "status" | "contrato_id";
  orderDir: "ASC" | "DESC";
  contrato_id?: number;
  empresa_contratada_id?: number;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
};

function pickListResponse(resData: any) {
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

export async function listarPedidosVenda(filters: PedidoVendaFilters) {
  const params: any = {
    page: filters.page,
    limit: filters.limit,
    sort: filters.orderBy,
    order: filters.orderDir,
    orderBy: filters.orderBy,
    orderDir: filters.orderDir,
  };

  if (filters.contrato_id) params.contrato_id = filters.contrato_id;
  if (filters.empresa_contratada_id) {
    params.empresa_contratada_id = filters.empresa_contratada_id;
  }
  if (filters.status) params.status = filters.status;
  if (filters.data_inicio) params.data_inicio = filters.data_inicio;
  if (filters.data_fim) params.data_fim = filters.data_fim;

  const response = await api.get("/pedidosvenda", { params });
  return pickListResponse(response.data);
}

export async function listarContratosPedidoVenda() {
  const response = await api.get("/contratos", {
    params: { page: 1, limit: 500 },
  });

  const rows = response.data?.data ?? response.data?.rows ?? [];

  return rows.map((c: any) => ({
    id: c.id,
    numero: c.numero,
    orgaoNome: c.orgao?.nome ?? "",
  })) as ContratoOption[];
}

export async function listarEmpresasPedidoVenda() {
  const response = await api.get("/empresas", {
    params: { page: 1, limit: 500 },
  });

  const rows = response.data?.data ?? response.data?.rows ?? [];

  return rows.map((e: any) => ({
    id: e.id,
    nome: e.razao_social ?? e.nome_fantasia ?? `Empresa #${e.id}`,
  })) as EmpresaOption[];
}

export async function excluirPedidoVenda(id: number) {
  const response = await api.delete(`/pedidosvenda/${id}`);
  return response.data;
}

export async function aprovarPedidoVenda(id: number) {
  const response = await api.post(`/pedidosvenda/${id}/aprovar`);
  return response.data;
}

export async function concluirPedidoVenda(id: number) {
  const response = await api.post(`/pedidosvenda/${id}/concluir`);
  return response.data;
}

export async function cancelarPedidoVenda(id: number, motivo?: string) {
  const response = await api.post(
    `/pedidosvenda/${id}/cancelar`,
    motivo ? { motivo } : undefined
  );

  return response.data;
}

export async function devolverPedidoVenda(id: number, motivo?: string) {
  const response = await api.post(
    `/pedidosvenda/${id}/devolver`,
    motivo ? { motivo } : undefined
  );

  return response.data;
}

export async function gerarRelatorioOperacionalPedidoVenda(id: number) {
  const response = await api.get(`/pedidosvenda/${id}/relatorio-operacional`, {
    responseType: "blob",
  });

  return response.data;
}

export type ContratoItemOption = {
  id: number;
  produto_id: number;
  produtoNome?: string;
  unidade_contratada?: string;
  fator_multiplicacao?: string | number;
  preco_unitario_contratado?: string | number;
  qtd_maxima_contratada?: string | number;
  saldo_contrato?: string | number;
  qtd_utilizada?: string | number;
};

export type PedidoVendaItem = {
  id: number;
  contrato_item_id: number;
  produto_id: number;
  qtd: string;
  preco_unitario: string;
  status_item?: string;
  qtd_reservada?: string;
  qtd_expedida?: string;
  qtd_cancelada?: string;
  qtd_devolvida?: string;
  saldo_pendente?: number;
  qtd_sem_baixa_estoque?: string | number;
  motivo_bloqueio?: string | null;
  produto?: {
    nome?: string;
  };
};

export type PedidoVendaCreatePayload = {
  contrato_id: number;
  data: string;
  observacao?: string | null;
};

export type PedidoVendaItemPayload = {
  contrato_item_id: number;
  produto_id: number;
  qtd: string;
  qtd_sem_baixa_estoque?: string;
  preco_unitario: string;
};

export async function buscarContratoPedidoVenda(id: number) {
  const response = await api.get(`/contratos/${id}`);
  return response.data;
}

export async function listarItensContratoPedidoVenda(contratoId: number) {
  const contrato = await buscarContratoPedidoVenda(contratoId);

  const itens = contrato?.itens ?? [];

  return itens.map((it: any) => ({
    id: it.id,
    produto_id: it.produto_id,
    produtoNome: it.produto?.nome ?? "",
    unidade_contratada: it.unidade_contratada ?? "UN",
    fator_multiplicacao: it.fator_multiplicacao ?? 1,
    preco_unitario_contratado: it.preco_unitario_contratado ?? "",
    qtd_maxima_contratada: it.qtd_maxima_contratada ?? "",
    saldo_contrato: it.saldo_contrato ?? it.saldoContrato ?? 0,
    qtd_utilizada: it.qtd_utilizada ?? it.qtdUtilizada ?? 0,
  })) as ContratoItemOption[];
}

export async function criarPedidoVenda(data: PedidoVendaCreatePayload) {
  const response = await api.post("/pedidosvenda", data);
  return response.data;
}

export async function buscarPedidoVenda(id: number) {
  const response = await api.get(`/pedidosvenda/${id}`);
  return response.data;
}

export async function listarItensPedidoVenda(id: number) {
  const pedido = await buscarPedidoVenda(id);

  return (
    pedido?.itens ??
    pedido?.PedidoItemVendas ??
    pedido?.pedidoItens ??
    []
  ) as PedidoVendaItem[];
}

export async function inserirItemPedidoVenda(
  pedidoId: number,
  data: PedidoVendaItemPayload
) {
  const response = await api.post(`/pedidosvenda/${pedidoId}/itens`, data);
  return response.data;
}

export async function removerItemPedidoVenda(
  pedidoId: number,
  itemId: number
) {
  const response = await api.delete(`/pedidosvenda/${pedidoId}/itens/${itemId}`);
  return response.data;
}

export type PedidoVendaDetalhe = {
  id: number;
  contrato_id: number;
  data: string;
  observacao?: string | null;
  status: string;
  itens?: PedidoVendaItem[];
};

export async function atualizarPedidoVenda(
  id: number,
  data: PedidoVendaCreatePayload
) {
  const response = await api.put(`/pedidosvenda/${id}`, data);
  return response.data;
}

export async function aprovarItemPedidoVenda(
  pedidoId: number,
  itemId: number
) {
  const response = await api.post(
    `/pedidosvenda/${pedidoId}/itens/${itemId}/aprovar`
  );

  return response.data;
}

export async function expedirItemPedidoVenda(
  pedidoId: number,
  itemId: number,
  data?: any
) {
  const response = await api.post(
    `/pedidosvenda/${pedidoId}/itens/${itemId}/baixar`,
    data || {}
  );

  return response.data;
}

export async function devolverItemPedidoVenda(
  pedidoId: number,
  itemId: number,
  data?: any
) {
  const response = await api.post(
    `/pedidosvenda/${pedidoId}/itens/${itemId}/devolver`,
    data || {}
  );

  return response.data;
}