// src/pages/VendaDireta/hooks/useVendaDiretaCreate.ts

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import {
  adicionarItemVendaDireta,
  buscarProdutosVendaDireta,
  buscarVendaDireta,
  criarVendaDireta,
  finalizarVendaDireta,
  removerItemVendaDireta,
  cancelarVendaDireta,
  listarClientesVendaDireta,
  listarFormasPagamentoVendaDireta,
  type ProdutoVendaDireta,
  type VendaDireta,
  type VendaDiretaItem,
} from "../../../services/vendadireta/vendaDiretaService";

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

export function useVendaDiretaCreate() {
  const codBarraRef = useRef<HTMLInputElement | null>(null);
  const qtdRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [creatingVenda, setCreatingVenda] = useState(false);
  const [searchingProduto, setSearchingProduto] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  const [venda, setVenda] = useState<VendaDireta | null>(null);
  const [itens, setItens] = useState<VendaDiretaItem[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [formaPagamentoId, setFormaPagamentoId] = useState("");

  const [clientesOptions, setClientesOptions] = useState<any[]>([]);
  const [formasPagamentoOptions, setFormasPagamentoOptions] = useState<any[]>([]);

  const [observacao, setObservacao] = useState("");

  const [codBarra, setCodBarra] = useState("");
  const [searchProduto, setSearchProduto] = useState("");
  const [produtosEncontrados, setProdutosEncontrados] = useState<
    ProdutoVendaDireta[]
  >([]);

  const [produtoSelecionado, setProdutoSelecionado] =
    useState<ProdutoVendaDireta | null>(null);

  const [qtd, setQtd] = useState("1");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [valorDesconto, setValorDesconto] = useState("");

  const [lotesSelecionados, setLotesSelecionados] = useState<
    Record<string | number, number>
  >({});

  const vendaId = venda?.id ?? null;

  async function carregarClientes() {
    try {
      const result = await listarClientesVendaDireta();
      setClientesOptions(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar clientes.");
      setClientesOptions([]);
    }
  }

  async function carregarFormasPagamento() {
    try {
      const result = await listarFormasPagamentoVendaDireta();
      setFormasPagamentoOptions(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar formas de pagamento.");
      setFormasPagamentoOptions([]);
    }
  }

  async function carregarVenda(id: number) {
    setLoading(true);

    try {
      const result = await buscarVendaDireta(id);

      setVenda(result);
      setItens(Array.isArray(result?.itens) ? result.itens : []);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao carregar venda.");
    } finally {
      setLoading(false);
    }
  }

  async function iniciarVenda() {

    if (!clienteId) {
      return toast.error("Selecione o cliente/órgão.");
    }

    if (!formaPagamentoId) {
      return toast.error("Selecione a forma de pagamento.");
    }

    if (vendaId) return;

    setCreatingVenda(true);

    try {
      const result = await criarVendaDireta({
        cliente_id: clienteId ? Number(clienteId) : null,
        forma_pagamento_id: formaPagamentoId ? Number(formaPagamentoId) : null,
        observacao: observacao?.trim() || null,
      });

      setVenda(result);
      setItens([]);

      toast.success("Venda iniciada.");

      setTimeout(() => codBarraRef.current?.focus(), 80);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao iniciar venda.");
    } finally {
      setCreatingVenda(false);
    }
  }

  function selecionarProduto(produto: ProdutoVendaDireta) {
    setProdutoSelecionado(produto);

    setPrecoUnitario(
      String(moneyFromApi(produto.preco_venda || produto.preco_referencia || 0))
    );

    setQtd("1");
    setValorDesconto("");

    setTimeout(() => qtdRef.current?.focus(), 80);
  }

  async function buscarPorCodigoBarras() {
    const codigo = codBarra.trim();

    if (!codigo) return;

    if (!vendaId) {
      toast.error("Inicie a venda primeiro.");
      return;
    }

    setSearchingProduto(true);

    try {
      const result = await buscarProdutosVendaDireta({
        cod_barra: codigo,
      });

      if (!result.length) {
        toast.warning("Produto não encontrado.");
        setProdutoSelecionado(null);
        setCodBarra("");
        setTimeout(() => codBarraRef.current?.focus(), 80);
        return;
      }

      selecionarProduto(result[0]);
      setProdutosEncontrados(result);
      setCodBarra("");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao buscar produto.");
    } finally {
      setSearchingProduto(false);
    }
  }

  async function pesquisarProdutos() {
    const termo = searchProduto.trim();

    if (!vendaId) {
      toast.error("Inicie a venda primeiro.");
      return;
    }

    if (!termo) {
      setProdutosEncontrados([]);
      return;
    }

    setSearchingProduto(true);

    try {
      const result = await buscarProdutosVendaDireta({
        search: termo,
      });

      setProdutosEncontrados(result);

      if (!result.length) {
        toast.info("Nenhum produto encontrado.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao pesquisar produtos.");
    } finally {
      setSearchingProduto(false);
    }
  }

  const qtdNum = useMemo(() => toNumberAny(qtd), [qtd]);

  const precoNum = useMemo(() => moneyFromApi(precoUnitario), [precoUnitario]);

  const descontoNum = useMemo(
    () => moneyFromApi(valorDesconto),
    [valorDesconto]
  );

  const subtotalItem = useMemo(() => {
    return Math.max(0, qtdNum * precoNum - descontoNum);
  }, [qtdNum, precoNum, descontoNum]);

  const totais = useMemo(() => {
    const totalItens = itens.length;

    const totalQtd = itens.reduce((acc, item) => {
      return acc + toNumberAny(item.qtd);
    }, 0);

    const totalDesconto = itens.reduce((acc, item) => {
      return acc + moneyFromApi(item.valor_desconto);
    }, 0);

    const totalVenda = itens.reduce((acc, item) => {
      return acc + moneyFromApi(item.valor_total);
    }, 0);

    return {
      totalItens,
      totalQtd,
      totalDesconto,
      totalVenda,
    };
  }, [itens]);

  const vendaBloqueada = useMemo(() => {
    return !!venda?.status && String(venda.status).toUpperCase() !== "RASCUNHO";
  }, [venda]);

  const canStartVenda = !creatingVenda && !vendaId;

  const canAddItem =
    !!vendaId &&
    !vendaBloqueada &&
    !!produtoSelecionado &&
    qtdNum > 0 &&
    precoNum > 0 &&
    !savingItem;

  async function adicionarItem() {
    if (!vendaId) {
      toast.error("Inicie a venda primeiro.");
      return;
    }

    if (vendaBloqueada) {
      toast.error("Esta venda não permite alteração.");
      return;
    }

    if (!produtoSelecionado) {
      toast.error("Selecione um produto.");
      return;
    }

    if (qtdNum <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }

    if (precoNum <= 0) {
      toast.error("Informe um preço válido.");
      return;
    }

    setSavingItem(true);

    try {
      await adicionarItemVendaDireta(vendaId, {
        produto_id: produtoSelecionado.id,
        qtd: String(qtdNum),
        preco_unitario: String(precoNum),
        valor_desconto: String(descontoNum),
      });

      toast.success("Item adicionado.");

      setProdutoSelecionado(null);
      setQtd("1");
      setPrecoUnitario("");
      setValorDesconto("");
      setProdutosEncontrados([]);
      setSearchProduto("");

      await carregarVenda(vendaId);

      setTimeout(() => codBarraRef.current?.focus(), 80);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao adicionar item.");
    } finally {
      setSavingItem(false);
    }
  }

  async function removerItem(itemId: number) {
    if (!vendaId) return;

    if (vendaBloqueada) {
      toast.error("Esta venda não permite remover itens.");
      return;
    }

    if (!window.confirm("Remover este item da venda?")) return;

    setRemovingItemId(itemId);

    try {
      await removerItemVendaDireta(vendaId, itemId);

      toast.success("Item removido.");

      await carregarVenda(vendaId);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao remover item.");
    } finally {
      setRemovingItemId(null);
    }
  }

  function selecionarLote(itemId: number, loteId: string) {
    setLotesSelecionados((prev) => ({
      ...prev,
      [itemId]: Number(loteId),
    }));
  }

  async function cancelarVenda() {
    if (!vendaId) return;

    if (vendaBloqueada) {
      toast.error("Esta venda já foi finalizada ou cancelada.");
      return;
    }

    if (!window.confirm("Cancelar esta venda?")) return;

    setFinishing(true);

    try {
      await cancelarVendaDireta(vendaId, {
        motivo: "Cancelada pelo usuário.",
      });

      toast.success("Venda cancelada.");

      await carregarVenda(vendaId);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao cancelar venda.");
    } finally {
      setFinishing(false);
    }
  }

  async function finalizarVenda() {
    if (!vendaId) return;

    if (!itens.length) {
      toast.error("Adicione pelo menos um item para finalizar.");
      return;
    }

    if (vendaBloqueada) {
      toast.error("Esta venda já foi finalizada ou cancelada.");
      return;
    }

    setFinishing(true);

    try {
      await finalizarVendaDireta(vendaId, {
        lotes: lotesSelecionados,
      });

      toast.success("Venda finalizada com sucesso.");

      await carregarVenda(vendaId);
    } catch (error: any) {
      console.error(error);

      const details = error?.response?.data?.details;

      if (Array.isArray(details) && details.length > 0) {
        toast.error(details[0]?.motivo || "Erro ao finalizar venda.");
      } else {
        toast.error(error?.response?.data?.error || "Erro ao finalizar venda.");
      }
    } finally {
      setFinishing(false);
    }
  }

  useEffect(() => {
    carregarClientes();
    carregarFormasPagamento();

    setTimeout(() => codBarraRef.current?.focus(), 100);
  }, []);

  return {
    codBarraRef,
    qtdRef,

    loading,
    creatingVenda,
    searchingProduto,
    savingItem,
    finishing,
    removingItemId,

    venda,
    vendaId,
    vendaBloqueada,
    itens,

    clienteId,
    setClienteId,
    formaPagamentoId,
    setFormaPagamentoId,
    clientesOptions,
    formasPagamentoOptions,
    observacao,
    setObservacao,

    codBarra,
    setCodBarra,
    searchProduto,
    setSearchProduto,
    produtosEncontrados,

    produtoSelecionado,
    setProdutoSelecionado,
    selecionarProduto,

    qtd,
    setQtd,
    precoUnitario,
    setPrecoUnitario,
    valorDesconto,
    setValorDesconto,

    qtdNum,
    precoNum,
    descontoNum,
    subtotalItem,
    totais,

    lotesSelecionados,
    selecionarLote,

    canStartVenda,
    canAddItem,

    iniciarVenda,
    buscarPorCodigoBarras,
    pesquisarProdutos,
    adicionarItem,
    removerItem,
    finalizarVenda,
    cancelarVenda,
    carregarVenda,
    carregarClientes,
    carregarFormasPagamento,
  };
}

export const vendaDiretaUtils = {
  toNumberAny,
  moneyFromApi,
};