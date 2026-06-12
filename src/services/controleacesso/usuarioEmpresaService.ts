import api from "../../api/api";

export type UsuarioEmpresaVinculo = {
  id?: number;
  usuario_id: number;
  empresa_contratada_id: number;
  empresa?: {
    id: number;
    razao_social: string;
    nome_fantasia: string;
    cnpj?: string;
    status?: string;
  };
};

export async function listarEmpresas() {
  const response = await api.get("/empresas", {
    params: { limit: 1000 },
  });

  return Array.isArray(response.data)
    ? response.data
    : response.data?.data || response.data?.rows || [];
}

export async function listarVinculosUsuarioEmpresa(usuarioId: number) {
  const response = await api.get("/usuario-empresa", {
    params: { usuario_id: usuarioId },
  });

  return response.data as UsuarioEmpresaVinculo[];
}

export async function vincularUsuarioEmpresa(payload: {
  usuario_id: number;
  empresa_contratada_id: number;
}) {
  const response = await api.post("/usuario-empresa", payload);
  return response.data;
}

export async function removerVinculoUsuarioEmpresa(id: number) {
  const response = await api.delete(`/usuario-empresa/${id}`);
  return response.data;
}

export async function removerVinculoUsuarioEmpresaPorUsuarioEmpresa(
  usuarioId: number,
  empresaId: number
) {
  const response = await api.delete(
    `/usuario-empresa/usuario/${usuarioId}/empresa/${empresaId}`
  );

  return response.data;
}