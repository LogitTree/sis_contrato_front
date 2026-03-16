export type ContaPagarStatus =
  | "ABERTO"
  | "PARCIAL"
  | "PAGO"
  | "VENCIDO"
  | "CANCELADO";

export type FornecedorResumo = {
  id: number;
  nome: string;
  cpf_cnpj?: string | null;
};

export type CompraResumo = {
  id: number;
  data_pedido?: string | null;
  numero_nota_fiscal?: string | null;
  valor_total?: string | number | null;
};

export type ContaPagar = {
  id: number;
  compra_id: number;
  fornecedor_id: number;
  numero_documento?: string | null;
  descricao?: string | null;
  parcela: number;
  total_parcelas: number;
  data_emissao: string;
  data_vencimento: string;
  valor_original: string | number;
  valor_pago: string | number;
  saldo: string | number;
  status: ContaPagarStatus;
  forma_pagamento?: string | null;
  observacao?: string | null;
  fornecedor?: FornecedorResumo;
  compra?: CompraResumo;
  created_at?: string;
  updated_at?: string;
};

export type ContaPagarFiltros = {
  fornecedor_id?: string;
  compra_id?: string;
  status?: string;
  numero_documento?: string;
};