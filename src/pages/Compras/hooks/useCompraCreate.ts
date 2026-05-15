// src/pages/Compras/hooks/useCompraCreate.ts

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import api from "../../../api/api";

import {
    listarFornecedoresCompra,
    type FornecedorOption,
} from "../../../services/compras/compraService";

const LS_DRAFT_KEY = "compra_create_draft_v1";

type ProdutoOption = {
    id: number;
    nome: string;
    descricao?: string;
    preco_custo?: string | number;
    preco_unitario?: string | number;
};

type CompraItem = {
    id: number;
    produto_id: number;
    qtd: string | number;
    preco_unitario: string | number;
    previsao_entrega?: string | null;
    produto?: {
        id: number;
        nome?: string;
        descricao?: string;
    };
};

function toNumberAny(v: any): number {
    if (v === null || v === undefined) return 0;

    const s = String(v).trim();
    if (!s) return 0;

    if (s.includes(",") && s.includes(".")) {
        const n = Number(s.replace(/\./g, "").replace(",", "."));
        return Number.isFinite(n) ? n : 0;
    }

    if (s.includes(",")) {
        const n = Number(s.replace(",", "."));
        return Number.isFinite(n) ? n : 0;
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
}

function moneyFromApi(v: any): number {
    const n = toNumberAny(v);
    const isInt = Math.abs(n - Math.round(n)) < 1e-9;
    if (isInt && n >= 100000) return n / 100;
    return n;
}

export function useCompraCreate() {
    const qtdRef = useRef<HTMLInputElement | null>(null);

    const [loading, setLoading] = useState(true);
    const [savingHeader, setSavingHeader] = useState(false);
    const [savingItem, setSavingItem] = useState(false);
    const [removingItemId, setRemovingItemId] = useState<number | null>(null);

    const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([]);
    const [produtos, setProdutos] = useState<ProdutoOption[]>([]);

    const [compraId, setCompraId] = useState<number | null>(null);
    const [itens, setItens] = useState<CompraItem[]>([]);

    const [fornecedorId, setFornecedorId] = useState("");
    const [dataPedido, setDataPedido] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );
    const [observacao, setObservacao] = useState("");

    const [numeroNF, setNumeroNF] = useState("");
    const [serieNF, setSerieNF] = useState("");
    const [dataEmissaoNF, setDataEmissaoNF] = useState("");
    const [chaveNfe, setChaveNfe] = useState("");

    const [valorFrete, setValorFrete] = useState("");
    const [valorDesconto, setValorDesconto] = useState("");

    const [formaPagamento, setFormaPagamento] = useState("");
    const [condicaoPagamento, setCondicaoPagamento] = useState("");
    const [dataVencimento, setDataVencimento] = useState("");

    const [produtoId, setProdutoId] = useState("");
    const [qtd, setQtd] = useState("");
    const [precoUnit, setPrecoUnit] = useState("");
    const [previsaoEntrega, setPrevisaoEntrega] = useState("");

    async function loadCombos() {
        try {
            const fornecedoresData = await listarFornecedoresCompra();
            setFornecedores(fornecedoresData);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar fornecedores.");
            setFornecedores([]);
        }

        try {
            const res = await api.get("/produtos", {
                params: { page: 1, limit: 1000 },
            });

            const rows =
                res.data?.data ??
                res.data?.rows ??
                res.data?.items ??
                res.data ??
                [];

            setProdutos(Array.isArray(rows) ? rows : []);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar produtos.");
            setProdutos([]);
        }
    }

    async function loadCompra(id: number) {
        try {
            const res = await api.get(`/compras/${id}`);

            const compra = res.data?.data ?? res.data ?? {};

            const lista =
                compra?.itens ??
                compra?.CompraItems ??
                compra?.compra_itens ??
                compra?.items ??
                [];

            setItens(Array.isArray(lista) ? lista : []);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar itens da compra.");
        }
    }

    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_DRAFT_KEY);
            if (!raw) return;

            const draft = JSON.parse(raw);
            if (!draft || compraId) return;

            if (draft.fornecedorId) setFornecedorId(String(draft.fornecedorId));
            if (draft.dataPedido) setDataPedido(String(draft.dataPedido));
            if (draft.observacao !== undefined) {
                setObservacao(String(draft.observacao ?? ""));
            }

            if (draft.numeroNF !== undefined) setNumeroNF(String(draft.numeroNF ?? ""));
            if (draft.serieNF !== undefined) setSerieNF(String(draft.serieNF ?? ""));
            if (draft.dataEmissaoNF !== undefined) {
                setDataEmissaoNF(String(draft.dataEmissaoNF ?? ""));
            }
            if (draft.chaveNfe !== undefined) setChaveNfe(String(draft.chaveNfe ?? ""));
            if (draft.valorFrete !== undefined) {
                setValorFrete(String(draft.valorFrete ?? ""));
            }
            if (draft.valorDesconto !== undefined) {
                setValorDesconto(String(draft.valorDesconto ?? ""));
            }
            if (draft.formaPagamento !== undefined) {
                setFormaPagamento(String(draft.formaPagamento ?? ""));
            }
            if (draft.condicaoPagamento !== undefined) {
                setCondicaoPagamento(String(draft.condicaoPagamento ?? ""));
            }
            if (draft.dataVencimento !== undefined) {
                setDataVencimento(String(draft.dataVencimento ?? ""));
            }
        } catch {
            // silencioso
        }
    }, [compraId]);

    useEffect(() => {
        if (compraId) return;

        try {
            localStorage.setItem(
                LS_DRAFT_KEY,
                JSON.stringify({
                    fornecedorId,
                    dataPedido,
                    observacao,
                    numeroNF,
                    serieNF,
                    dataEmissaoNF,
                    chaveNfe,
                    valorFrete,
                    valorDesconto,
                    formaPagamento,
                    condicaoPagamento,
                    dataVencimento,
                })
            );
        } catch {
            // silencioso
        }
    }, [
        fornecedorId,
        dataPedido,
        observacao,
        numeroNF,
        serieNF,
        dataEmissaoNF,
        chaveNfe,
        valorFrete,
        valorDesconto,
        formaPagamento,
        condicaoPagamento,
        dataVencimento,
        compraId,
    ]);

    useEffect(() => {
        async function init() {
            setLoading(true);
            await loadCombos();
            setLoading(false);
        }

        init();
    }, []);

    const fornecedoresMap = useMemo(() => {
        const map = new Map<number, FornecedorOption>();
        fornecedores.forEach((f) => map.set(Number(f.id), f));
        return map;
    }, [fornecedores]);

    const produtosMap = useMemo(() => {
        const map = new Map<number, ProdutoOption>();
        produtos.forEach((p) => map.set(Number(p.id), p));
        return map;
    }, [produtos]);

    const fornecedorSelecionado = useMemo(() => {
        const id = Number(fornecedorId);
        if (!id) return null;
        return fornecedoresMap.get(id) ?? null;
    }, [fornecedorId, fornecedoresMap]);

    const produtoSelecionado = useMemo(() => {
        const id = Number(produtoId);
        if (!id) return null;
        return produtosMap.get(id) ?? null;
    }, [produtoId, produtosMap]);

    useEffect(() => {
        if (!produtoId) return;

        if (produtoSelecionado) {
            const preco =
                produtoSelecionado.preco_custo ??
                produtoSelecionado.preco_unitario ??
                "";

            if (preco && !precoUnit) {
                setPrecoUnit(String(moneyFromApi(preco)));
            }
        }

        setTimeout(() => qtdRef.current?.focus(), 60);
    }, [produtoId, produtoSelecionado]);

    const totais = useMemo(() => {
        const totalItens = itens.length;

        const totalQtd = itens.reduce(
            (acc, item) => acc + toNumberAny(item.qtd),
            0
        );

        const totalValor = itens.reduce((acc, item) => {
            const q = toNumberAny(item.qtd);
            const p = moneyFromApi(item.preco_unitario);
            return acc + q * p;
        }, 0);

        const frete = toNumberAny(valorFrete);
        const desconto = toNumberAny(valorDesconto);
        const totalFinal = totalValor + frete - desconto;

        return {
            totalItens,
            totalQtd,
            totalValor,
            frete,
            desconto,
            totalFinal,
        };
    }, [itens, valorFrete, valorDesconto]);

    const disableHeader = loading || savingHeader || !!compraId;
    const disableItem = loading || savingItem || !compraId;

    const qtdNum = useMemo(() => toNumberAny(qtd), [qtd]);
    const precoUnitNum = useMemo(() => toNumberAny(precoUnit), [precoUnit]);

    const canInsert =
        !disableItem && !!produtoId && qtdNum > 0 && precoUnitNum > 0;

    async function salvarCabecalho(e?: React.FormEvent) {
        e?.preventDefault();

        if (!fornecedorId) {
            toast.error("Selecione o fornecedor.");
            return;
        }

        if (!dataPedido) {
            toast.error("Informe a data do pedido.");
            return;
        }

        setSavingHeader(true);

        try {
            const payload = {
                fornecedor_id: Number(fornecedorId),
                data_pedido: dataPedido,
                observacao: observacao?.trim() || null,

                numero_nota_fiscal: numeroNF?.trim() || null,
                serie_nota_fiscal: serieNF?.trim() || null,
                data_emissao_nf: dataEmissaoNF || null,
                chave_nfe: chaveNfe?.trim() || null,

                valor_frete: String(toNumberAny(valorFrete)),
                valor_desconto: String(toNumberAny(valorDesconto)),

                forma_pagamento: formaPagamento?.trim() || null,
                condicao_pagamento: condicaoPagamento?.trim() || null,
                data_vencimento: dataVencimento || null,
            };

            const res = await api.post("/compras", payload);

            const id =
                res.data?.data?.id ??
                res.data?.id ??
                res.data?.data?.data?.id ??
                null;

            if (!id) {
                throw new Error("API não retornou o ID da compra.");
            }

            setCompraId(Number(id));

            try {
                localStorage.removeItem(LS_DRAFT_KEY);
            } catch {
                // silencioso
            }

            toast.success("Compra criada. Agora adicione os itens.");
            await loadCompra(Number(id));
        } catch (error: any) {
            console.error(error);
            toast.error(
                error?.response?.data?.error ||
                error?.message ||
                "Erro ao salvar cabeçalho."
            );
        } finally {
            setSavingHeader(false);
        }
    }

    async function adicionarItem() {
        if (!compraId) return toast.error("Salve o cabeçalho da compra primeiro.");
        if (!produtoId) return toast.error("Selecione um produto.");

        if (qtdNum <= 0) return toast.error("Informe a quantidade.");
        if (precoUnitNum <= 0) {
            return toast.error("Informe um preço unitário maior que zero.");
        }

        setSavingItem(true);

        try {
            await api.post(`/compras/${compraId}/itens`, {
                produto_id: Number(produtoId),
                qtd: String(qtdNum),
                preco_unitario: String(precoUnitNum),
                previsao_entrega: previsaoEntrega || null,
            });

            toast.success("Item inserido.");

            setProdutoId("");
            setQtd("");
            setPrecoUnit("");
            setPrevisaoEntrega("");

            await loadCompra(compraId);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.error || "Erro ao inserir item.");
        } finally {
            setSavingItem(false);
        }
    }

    async function removerItem(itemId: number) {
        if (!compraId) return;
        if (!window.confirm("Remover este item?")) return;

        setRemovingItemId(itemId);

        try {
            await api.delete(`/compras/${compraId}/itens/${itemId}`);

            toast.success("Item removido.");
            await loadCompra(compraId);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.error || "Erro ao remover item.");
        } finally {
            setRemovingItemId(null);
        }
    }

    return {
        qtdRef,

        loading,
        savingHeader,
        savingItem,
        removingItemId,

        fornecedores,
        produtos,

        compraId,
        itens,

        fornecedorId,
        setFornecedorId,
        dataPedido,
        setDataPedido,
        observacao,
        setObservacao,

        numeroNF,
        setNumeroNF,
        serieNF,
        setSerieNF,
        dataEmissaoNF,
        setDataEmissaoNF,
        chaveNfe,
        setChaveNfe,

        valorFrete,
        setValorFrete,
        valorDesconto,
        setValorDesconto,

        formaPagamento,
        setFormaPagamento,
        condicaoPagamento,
        setCondicaoPagamento,
        dataVencimento,
        setDataVencimento,

        produtoId,
        setProdutoId,
        qtd,
        setQtd,
        precoUnit,
        setPrecoUnit,
        previsaoEntrega,
        setPrevisaoEntrega,

        fornecedorSelecionado,
        produtoSelecionado,
        totais,

        disableHeader,
        disableItem,
        canInsert,

        salvarCabecalho,
        adicionarItem,
        removerItem,
    };
}

export const compraCreateUtils = {
    toNumberAny,
    moneyFromApi,
};