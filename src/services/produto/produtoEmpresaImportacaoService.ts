import api from "../../api/api";

export async function simularImportacao(payload: {
    empresa_contratada_id: number;
    grupo_ids: number[];
    subgrupo_ids?: number[];
}) {
    const { data } = await api.post(
        "/produto-empresas/importacao/simular",
        payload
    );

    return data.data;
}

export async function importarProdutos(payload: {
    empresa_contratada_id: number;
    grupo_ids: number[];
    subgrupo_ids?: number[];
}) {
    const { data } = await api.post(
        "/produto-empresas/importacao",
        payload
    );

    return data.data;
}