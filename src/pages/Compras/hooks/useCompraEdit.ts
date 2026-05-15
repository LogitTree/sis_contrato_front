// src/pages/Compras/hooks/useCompraEdit.ts

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../../../api/api";

type CompraStatus =
  | "ABERTA"
  | "PARCIALMENTE_RECEBIDA"
  | "RECEBIDA"
  | "CANCELADA";

type FornecedorOption = {
  id: number;
  nome: string;
};

type ProdutoOption = {
  id: number;
  nome?: string;
  descricao?: string;
  nome_fantasia?: string;
  preco_custo?: string | number;
  preco_unitario?: string | number;
};

type CompraItem = {
  id: number;
  produto_id: number;
  qtd: string;
  preco_unitario: string;
  recebido_qtd?: string;
  previsao_entrega?: string | null;
  produto?: {
    id?: number;
    nome?: string;
    descricao?: string;
  };
};

function pickListArray(resData: any): any[] {
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.rows)) return resData.rows;
  if (Array.isArray(resData?.data?.rows)) return resData.data.rows;
  if (Array.isArray(resData?.data?.data)) return resData.data.data;
  if (Array.isArray(resData?.items)) return resData.items;
  if (Array.isArray(resData)) return resData;
  return [];
}

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
  return toNumberAny(v);
}

function normalizeDecimalString(v: string) {
  const clean = (v || "").replace(/[^\d.,]/g, "");
  const hasComma = clean.includes(",");
  const hasDot = clean.includes(".");

  if (hasComma && hasDot) return clean.replace(/\./g, "").replace(",", ".");
  if (hasComma) return clean.replace(",", ".");

  return clean;
}

function formatDateISO(value: any): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function normalizeCompraStatus(value: any): CompraStatus {
  const s = String(value || "ABERTA").toUpperCase();

  if (s === "PARCIALMENTE_RECEBIDA") return "PARCIALMENTE_RECEBIDA";
  if (s === "RECEBIDA") return "RECEBIDA";
  if (s === "CANCELADA") return "CANCELADA";

  return "ABERTA";
}

export function nomeProduto(p?: ProdutoOption | null) {
  if (!p) return "Produto";
  return p.nome ?? p.descricao ?? p.nome_fantasia ?? `Produto #${p.id}`;
}

export function useCompraEdit() {
  const navigate = useNavigate();
  const params = useParams();

  const compraId = Number(params.id);

  const qtdRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([]);
  const [produtos, setProdutos] = useState<ProdutoOption[]>([]);
  const [itens, setItens] = useState<CompraItem[]>([]);

  const [fornecedorId, setFornecedorId] = useState("");
  const [dataPedido, setDataPedido] = useState("");
  const [observacao, setObservacao] = useState("");
  const [status, setStatus] = useState<CompraStatus>("ABERTA");

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

  const produtosMap = useMemo(() => {
    return new Map(produtos.map((produto) => [Number(produto.id), produto]));
  }, [produtos]);

  const fornecedorSelecionado = useMemo(() => {
    const id = Number(fornecedorId);
    if (!id) return null;

    return fornecedores.find((fornecedor) => Number(fornecedor.id) === id) ?? null;
  }, [fornecedorId, fornecedores]);

  const produtoSelecionado = useMemo(() => {
    const id = Number(produtoId);
    if (!id) return null;

    return produtosMap.get(id) ?? null;
  }, [produtoId, produtosMap]);

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
    const totalFinal = Math.max(0, totalValor + frete - desconto);

    return {
      totalItens,
      totalQtd,
      totalValor,
      frete,
      desconto,
      totalFinal,
    };
  }, [itens, valorFrete, valorDesconto]);

  const compraEditavel = status === "ABERTA";

  const canReceber =
    status === "ABERTA" || status === "PARCIALMENTE_RECEBIDA";

  const disableHeader =
    loading ||
    savingHeader ||
    savingItem ||
    removingItemId !== null ||
    !compraEditavel;

  const disableItem =
    loading ||
    savingItem ||
    savingHeader ||
    removingItemId !== null ||
    !compraEditavel;

  const qtdNum = useMemo(() => toNumberAny(qtd), [qtd]);
  const precoUnitNum = useMemo(() => toNumberAny(precoUnit), [precoUnit]);

  const canInsert =
    !disableItem &&
    !!produtoId &&
    qtdNum > 0 &&
    precoUnitNum > 0;

  async function loadCombos() {
    const [resFornecedores, resProdutos] = await Promise.all([
      api.get("/fornecedores", { params: { page: 1, limit: 1000 } }),
      api.get("/produtos", { params: { page: 1, limit: 2000 } }),
    ]);

    const fornecedoresData = pickListArray(resFornecedores.data).map((f: any) => ({
      id: Number(f.id),
      nome:
        f.nome ??
        f.razao_social ??
        f.nome_fantasia ??
        `Fornecedor #${f.id}`,
    }));

    const produtosData = pickListArray(resProdutos.data).map((p: any) => ({
      id: Number(p.id),
      nome: p.nome ?? p.descricao ?? `Produto #${p.id}`,
      descricao: p.descricao,
      nome_fantasia: p.nome_fantasia,
      preco_custo: p.preco_custo,
      preco_unitario: p.preco_unitario,
    }));

    setFornecedores(fornecedoresData);
    setProdutos(produtosData);
  }

  async function loadCompra() {
    const response = await api.get(`/compras/${compraId}`);
    const compra = response?.data?.data ?? response?.data ?? null;

    if (!compra?.id) {
      throw new Error("Compra não encontrada.");
    }

    setFornecedorId(compra.fornecedor_id ? String(compra.fornecedor_id) : "");
    setDataPedido(formatDateISO(compra.data_pedido));
    setStatus(normalizeCompraStatus(compra.status));
    setObservacao(compra.observacao ?? "");

    setNumeroNF(compra.numero_nota_fiscal ? String(compra.numero_nota_fiscal) : "");
    setSerieNF(compra.serie_nota_fiscal ? String(compra.serie_nota_fiscal) : "");
    setDataEmissaoNF(formatDateISO(compra.data_emissao_nf));
    setChaveNfe(compra.chave_nfe ? String(compra.chave_nfe) : "");

    setValorFrete(
      compra.valor_frete !== null && compra.valor_frete !== undefined
        ? String(compra.valor_frete)
        : ""
    );

    setValorDesconto(
      compra.valor_desconto !== null && compra.valor_desconto !== undefined
        ? String(compra.valor_desconto)
        : ""
    );

    setFormaPagamento(compra.forma_pagamento ? String(compra.forma_pagamento) : "");
    setCondicaoPagamento(
      compra.condicao_pagamento ? String(compra.condicao_pagamento) : ""
    );
    setDataVencimento(formatDateISO(compra.data_vencimento));

    const rawItens =
      compra.itens ??
      compra.CompraItems ??
      compra.compra_itens ??
      compra.items ??
      [];

    const lista: CompraItem[] = (Array.isArray(rawItens) ? rawItens : []).map(
      (item: any) => ({
        id: Number(item.id),
        produto_id: Number(item.produto_id),
        qtd: String(item.qtd ?? "0"),
        preco_unitario: String(item.preco_unitario ?? "0"),
        recebido_qtd: String(item.recebido_qtd ?? "0"),
        previsao_entrega: item.previsao_entrega
          ? formatDateISO(item.previsao_entrega)
          : null,
        produto: item.produto ?? item.Produto ?? undefined,
      })
    );

    setItens(lista);
  }

  async function salvarCabecalho(e?: FormEvent) {
    e?.preventDefault();

    if (!dataPedido) {
      toast.error("Informe a data do pedido.");
      return;
    }

    setSavingHeader(true);

    try {
      await api.put(`/compras/${compraId}`, {
        fornecedor_id: fornecedorId ? Number(fornecedorId) : null,
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
      });

      toast.success("Cabeçalho atualizado com sucesso.");
      await loadCompra();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao salvar cabeçalho.");
    } finally {
      setSavingHeader(false);
    }
  }

  async function inserirItem() {
    if (!compraId) return toast.error("Compra inválida.");
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

      setTimeout(() => qtdRef.current?.focus(), 80);

      await loadCompra();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao inserir item.");
    } finally {
      setSavingItem(false);
    }
  }

  async function removerItem(itemId: number) {
    if (!compraId) return;

    const ok = window.confirm("Remover este item?");
    if (!ok) return;

    setRemovingItemId(itemId);

    try {
      await api.delete(`/compras/${compraId}/itens/${itemId}`);

      toast.success("Item removido.");
      await loadCompra();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao remover item.");
    } finally {
      setRemovingItemId(null);
    }
  }

  useEffect(() => {
    async function init() {
      if (!compraId) {
        toast.error("ID inválido.");
        navigate("/compras");
        return;
      }

      setLoading(true);

      try {
        await Promise.all([loadCombos(), loadCompra()]);
      } catch (error: any) {
        console.error(error);
        toast.error(error?.response?.data?.error || error?.message || "Erro ao carregar compra.");
        navigate("/compras");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [compraId]);

  useEffect(() => {
    if (!produtoSelecionado) return;

    const preco =
      produtoSelecionado.preco_custo ??
      produtoSelecionado.preco_unitario ??
      "";

    if (preco && !precoUnit) {
      setPrecoUnit(String(moneyFromApi(preco)));
    }

    setTimeout(() => qtdRef.current?.focus(), 60);
  }, [produtoSelecionado]);

  return {
    navigate,
    compraId,
    qtdRef,

    loading,
    savingHeader,
    savingItem,
    removingItemId,

    fornecedores,
    produtos,
    itens,

    fornecedorId,
    setFornecedorId,
    dataPedido,
    setDataPedido,
    observacao,
    setObservacao,
    status,

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

    compraEditavel,
    canReceber,
    disableHeader,
    disableItem,
    canInsert,

    salvarCabecalho,
    inserirItem,
    removerItem,
  };
}

export const compraEditUtils = {
  toNumberAny,
  moneyFromApi,
  normalizeDecimalString,
  formatDateISO,
  nomeProduto,
};