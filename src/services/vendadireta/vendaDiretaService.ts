import api from "../../api/api";

export type VendaDireta = {
    id: number;
    cliente_id?: number | null;
    forma_pagamento_id?: number | null;
    data: string;
    status: string;
    valor_desconto: number | string;
    valor_total: number | string;
    observacao?: string | null;
    cliente?: {
        id: number;
        nome?: string;
        razao_social?: string;
    } | null;
    itens?: VendaDiretaItem[];
};

export type VendaDiretaItem = {
    id: number;
    pedido_venda_id: number;
    produto_id: number;
    qtd: number | string;
    preco_unitario: number | string;
    valor_desconto: number | string;
    valor_total: number | string;
    status_item: string;
    produto?: {
        id: number;
        nome: string;
        cod_barra?: string | null;
        unidade?: string;
        controla_lote?: boolean;
        lotes?: ProdutoVendaDiretaLote[];
    };
};

export type ProdutoVendaDiretaLote = {
    id: number;
    lote?: string | null;
    validade?: string | null;
    quantidade?: number | string | null;
};

export type ProdutoVendaDireta = {
    id: number;
    nome: string;

    cod_barra?: string | null;
    unidade?: string;

    controla_lote?: boolean;

    preco_referencia?: number | string;
    preco_venda?: number | string;

    qtd_disponivel?: number | string;
    qtd_reservada?: number | string;
    qtd_livre?: number | string;

    lotes?: ProdutoVendaDiretaLote[];
};

export async function listarVendasDiretas(params?: any) {
    const response = await api.get("/vendas-diretas", { params });
    return response.data;
}

export async function buscarVendaDireta(id: number) {
    const response = await api.get(`/vendas-diretas/${id}`);
    return response.data as VendaDireta;
}

export async function criarVendaDireta(payload: {
    cliente_id?: number | null;
    forma_pagamento_id?: number | null;
    data?: string;
    observacao?: string | null;
}) {
    const response = await api.post("/vendas-diretas", payload);
    return response.data as VendaDireta;
}

export async function buscarProdutosVendaDireta(params: {
    search?: string;
    cod_barra?: string;
}) {
    const response = await api.get("/vendas-diretas/produtos/buscar", {
        params,
    });

    return response.data as ProdutoVendaDireta[];
}

export async function adicionarItemVendaDireta(
    vendaId: number,
    payload: {
        produto_id: number;
        qtd: number | string;
        preco_unitario?: number | string;
        valor_desconto?: number | string;
    }
) {
    const response = await api.post(`/vendas-diretas/${vendaId}/itens`, payload);
    return response.data as VendaDiretaItem;
}

export async function removerItemVendaDireta(vendaId: number, itemId: number) {
    const response = await api.delete(`/vendas-diretas/${vendaId}/itens/${itemId}`);
    return response.data;
}

export async function finalizarVendaDireta(
    vendaId: number,
    payload?: {
        lotes?: Record<string | number, number>;
        estoque_lote_id?: number;
    }
) {
    const response = await api.post(
        `/vendas-diretas/${vendaId}/finalizar`,
        payload || {}
    );

    return response.data;
}

export async function cancelarVendaDireta(
    vendaId: number,
    payload?: {
        motivo?: string;
    }
) {
    const response = await api.post(
        `/vendas-diretas/${vendaId}/cancelar`,
        payload || {}
    );

    return response.data;
}

export async function listarClientesVendaDireta(search?: string) {
    const response = await api.get("/orgaocontratante", {
        params: {
            search: search || undefined,
            limit: 100,
        },
    });

    return response.data?.data || response.data || [];
}

export async function listarFormasPagamentoVendaDireta() {
    const response = await api.get("/formas-pagamento", {
        params: {
            limit: 100,
        },
    });

    return response.data?.data || response.data || [];
}

export async function criarClienteVendaDireta(
    payload: ClienteVendaDiretaPayload
) {
    const response = await api.post("/orgaocontratante", payload);

    return response.data;
}

export async function imprimirReciboVendaDireta(vendaId: number) {
    const response = await api.get(`/vendas-diretas/${vendaId}/recibo`, {
        responseType: "blob",
    });

    const blob = new Blob([response.data], {
        type: "application/pdf",
    });

    const url = window.URL.createObjectURL(blob);

    window.open(url, "_blank", "noopener,noreferrer");

    setTimeout(() => {
        window.URL.revokeObjectURL(url);
    }, 60_000);
}

export type ClienteVendaDiretaPayload = {
    nome?: string;
    razao_social?: string;
    nome_fantasia?: string;
    documento?: string;
    cnpj?: string;
    cpf?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    status?: string;
    tipo?: string;
    esfera?: string;
    email_oficial?: string;
};