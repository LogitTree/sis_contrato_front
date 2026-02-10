export type ProdutoStatus = 'ATIVO' | 'INATIVO';

export interface Produto {
  id: number;

  nome: string;
  descricao?: string;
  ativo?: boolean;
  unidade: string;

  preco_referencia: number;
  custo_medio: number;
  ult_custo: number;

  status: ProdutoStatus;

  grupo?: {
    id: number;
    nome: string;
  };

  subgrupo?: {
    id: number;
    nome: string;
  };

  created_at?: string;
  updated_at?: string;
}
