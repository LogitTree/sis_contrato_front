export type Fornecedor = {
  id: number;
  nome: string;
  documento?: string | null; // cpf/cnpj
  telefone?: string | null;
  email?: string | null;
  ativo?: boolean;
  observacao?: string | null;

  created_at?: string;
  updated_at?: string;
};