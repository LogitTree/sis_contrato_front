export type OrgaoContratante = {
  id: number;
  nome: string;
  cnpj: string;
  tipo: string;
  esfera: 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL';

  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;

  telefone?: string;
  email_oficial?: string;

  responsavel?: string;
  cargo_responsavel?: string;

  // ===== Campos derivados / listagem =====
  total_contratos?: number;
  ativo?: boolean;

  // ===== Auditoria (opcional) =====
  created_at?: string;
  updated_at?: string;
};
