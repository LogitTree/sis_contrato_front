export type PedidoVendaStatus = "RASCUNHO" | "APROVADO" | "ATENDIDO" | "CANCELADO";

export type PedidoVenda = {
  id: number;
  contrato_id: number;
  data: string;
  status: PedidoVendaStatus;
  observacao?: string | null;

  // se o back devolver include
  contrato?: {
    id: number;
    numero: string;
    orgao?: { id: number; nome: string };
    empresa?: { id: number; nome: string };
  };
};