import type { Produto } from './Produto';
import type { OrgaoContratante } from './OrgaoContratante';
import type { EmpresaContratada } from './EmpresaContratada';

export type ContratoItem = {
  id?: number;
  produto_id: number;
  descricao_lote: string;
  unidade: string;
  tipo: string;
  objeto?: string;
  preco_unitario_contratado: number;
  qtd_maxima_contratada: number;
  valor_maximo_contratado: number;

  produto?: Produto; // 👈 lowercase (igual ao back)
};

export type Contrato = {
  id: number;
  numero: string;
  orgao_id: number;
  empresa_contratada_id: number;

  data_inicio: string;
  data_fim: string;
  observacao: string;
  status: 'ATIVO' | 'SUSPENSO' | 'ENCERRADO' | null;
  tipo: string;
  objeto?: string;

  orgao?: OrgaoContratante;        // 👈 igual ao back
  empresa?: EmpresaContratada;     // 👈 igual ao back
  itens?: ContratoItem[];          // 👈 igual ao back
};
