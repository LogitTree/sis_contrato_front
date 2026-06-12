import api from "../../api/api";

export type ProdutoEmpresaVinculo = {
  id?: number;
  produto_id: number;
  empresa_contratada_id: number;
  preco_venda?: number | string | null;
  ativo?: boolean;
  empresa?: {
    id: number;
    razao_social: string;
    nome_fantasia: string;
    cnpj?: string;
    status?: string;
  };
};

export async function listarEmpresasProduto(produtoId: number) {
  const response = await api.get("/produto-empresas", {
    params: {
      produto_id: produtoId,
    },
  });

  return response.data as ProdutoEmpresaVinculo[];
}

export async function vincularProdutoEmpresa(payload: {
  produto_id: number;
  empresa_contratada_id: number;
  preco_venda?: number | string | null;
  ativo?: boolean;
}) {
  const response = await api.post("/produto-empresas", payload);
  return response.data;
}

export async function atualizarProdutoEmpresa(
  id: number,
  payload: {
    preco_venda?: number | string | null;
    ativo?: boolean;
  }
) {
  const response = await api.put(`/produto-empresas/${id}`, payload);
  return response.data;
}

export async function removerProdutoEmpresaPorProdutoEmpresa(
  produtoId: number,
  empresaId: number
) {
  const response = await api.delete(
    `/produto-empresas/produto/${produtoId}/empresa/${empresaId}`
  );

  return response.data;
}