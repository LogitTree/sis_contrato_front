export interface EmpresaContratada {
  id: number;

  razao_social: string;
  nome_fantasia: string;
  cnpj: string;

  inscricao_estadual?: string;
  inscricao_municipal?: string;

  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;

  telefone?: string;
  email?: string;

  responsavel_legal?: string;
  cargo_responsavel?: string;

  status?: 'ATIVA' | 'INATIVA';

  created_at?: string;
  updated_at?: string;
}
