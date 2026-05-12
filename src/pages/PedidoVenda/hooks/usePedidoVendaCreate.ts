import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import {
  criarPedidoVenda,
  inserirItemPedidoVenda,
  listarContratosPedidoVenda,
  listarItensContratoPedidoVenda,
  listarItensPedidoVenda,
  removerItemPedidoVenda,
  type ContratoItemOption,
  type ContratoOption,
  type PedidoVendaItem,
} from "../../../services/pedidoVenda/pedidoVendaService";

const LS_DRAFT_KEY = "pedidovenda_create_draft_v1";

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

export function normalizeDecimalString(v: string) {
  const clean = (v || "").replace(/[^\d.,]/g, "");
  const hasComma = clean.includes(",");
  const hasDot = clean.includes(".");
  if (hasComma && hasDot) return clean.replace(/\./g, "").replace(",", ".");
  if (hasComma) return clean.replace(",", ".");
  return clean;
}

export function usePedidoVendaCreate() {
  const qtdRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  const [contratosOptions, setContratosOptions] = useState<ContratoOption[]>([]);
  const [contratoItensOptions, setContratoItensOptions] = useState<
    ContratoItemOption[]
  >([]);

  const [contratoId, setContratoId] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [observacao, setObservacao] = useState("");

  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [itens, setItens] = useState<PedidoVendaItem[]>([]);

  const [contratoItemId, setContratoItemId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [qtd, setQtd] = useState("");
  const [qtdSemBaixaEstoque, setQtdSemBaixaEstoque] = useState("");

  async function carregarContratos() {
    try {
      const result = await listarContratosPedidoVenda();
      setContratosOptions(result);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar contratos.");
      setContratosOptions([]);
    }
  }

  async function carregarItensContrato(contratoIdParam: number) {
    try {
      const result = await listarItensContratoPedidoVenda(contratoIdParam);
      setContratoItensOptions(result);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar itens do contrato.");
      setContratoItensOptions([]);
    }
  }

  async function carregarPedido(id: number) {
    try {
      const result = await listarItensPedidoVenda(id);
      setItens(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar itens do pedido.");
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_DRAFT_KEY);
      if (!raw) return;

      const draft = JSON.parse(raw);

      if (!pedidoId) {
        if (draft.contratoId) setContratoId(String(draft.contratoId));
        if (draft.data) setData(String(draft.data));
        if (draft.observacao !== undefined) {
          setObservacao(String(draft.observacao ?? ""));
        }
      }
    } catch {
      // silencioso
    }
  }, [pedidoId]);

  useEffect(() => {
    if (pedidoId) return;

    try {
      localStorage.setItem(
        LS_DRAFT_KEY,
        JSON.stringify({ contratoId, data, observacao })
      );
    } catch {
      // silencioso
    }
  }, [contratoId, data, observacao, pedidoId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await carregarContratos();
      setLoading(false);
    }

    init();
  }, []);

  const contratoSelecionado = useMemo(() => {
    const id = Number(contratoId);
    if (!id) return null;
    return contratosOptions.find((contrato) => contrato.id === id) ?? null;
  }, [contratoId, contratosOptions]);

  const contratoItemSelecionado = useMemo(() => {
    const id = Number(contratoItemId);
    if (!id) return null;
    return contratoItensOptions.find((item) => item.id === id) ?? null;
  }, [contratoItemId, contratoItensOptions]);

  const qtdInformadaNum = useMemo(() => toNumberAny(qtd), [qtd]);

  const qtdSemBaixaEstoqueNum = useMemo(
    () => toNumberAny(qtdSemBaixaEstoque),
    [qtdSemBaixaEstoque]
  );

  useEffect(() => {
    const id = Number(contratoId);

    if (!id) {
      setContratoItensOptions([]);
      setContratoItemId("");
      setProdutoId("");
      setQtd("");
      setQtdSemBaixaEstoque("");
      return;
    }

    carregarItensContrato(id);
    setContratoItemId("");
    setProdutoId("");
    setQtd("");
    setQtdSemBaixaEstoque("");
  }, [contratoId]);

  useEffect(() => {
    if (!contratoItemSelecionado) return;

    setProdutoId(String(contratoItemSelecionado.produto_id));
    setTimeout(() => qtdRef.current?.focus(), 60);
  }, [contratoItemSelecionado]);

  const totais = useMemo(() => {
    const totalItens = itens.length;

    const totalQtdComBaixa = itens.reduce(
      (acc, item) => acc + toNumberAny(item.qtd),
      0
    );

    const totalQtdSemBaixa = itens.reduce(
      (acc, item) => acc + toNumberAny((item as any).qtd_sem_baixa_estoque),
      0
    );

    const totalQtd = totalQtdComBaixa + totalQtdSemBaixa;

    const totalValor = itens.reduce((acc, item) => {
      const qComBaixa = toNumberAny(item.qtd);
      const qSemBaixa = toNumberAny((item as any).qtd_sem_baixa_estoque);
      const p = moneyFromApi(item.preco_unitario);

      return acc + (qComBaixa + qSemBaixa) * p;
    }, 0);

    return {
      totalItens,
      totalQtd,
      totalQtdComBaixa,
      totalQtdSemBaixa,
      totalValor,
    };
  }, [itens]);

  const saldoContratoSelecionado = useMemo(() => {
    if (!contratoItemSelecionado) return 0;
    return toNumberAny(contratoItemSelecionado.saldo_contrato);
  }, [contratoItemSelecionado]);

  const precoContratoAtual = useMemo(() => {
    if (!contratoItemSelecionado) return 0;
    return moneyFromApi(contratoItemSelecionado.preco_unitario_contratado);
  }, [contratoItemSelecionado]);

  const qtdExcedeSaldoContrato = useMemo(() => {
    if (!contratoItemSelecionado) return false;
    if (!qtdInformadaNum) return false;
    return qtdInformadaNum > saldoContratoSelecionado;
  }, [contratoItemSelecionado, qtdInformadaNum, saldoContratoSelecionado]);

  const disableHeader = loading || savingHeader || !!pedidoId;
  const disableItem = loading || savingItem || !pedidoId;

  const canInsert =
    !disableItem &&
    !!contratoItemId &&
    (qtdInformadaNum > 0 || qtdSemBaixaEstoqueNum > 0) &&
    !qtdExcedeSaldoContrato &&
    !!contratoItemSelecionado;

  async function salvarCabecalho() {
    if (!contratoId) {
      toast.error("Selecione um contrato.");
      return;
    }

    setSavingHeader(true);

    try {
      const response = await criarPedidoVenda({
        contrato_id: Number(contratoId),
        data,
        observacao: observacao?.trim() || null,
      });

      const id = response?.id;

      if (!id) {
        throw new Error("API não retornou o ID do pedido.");
      }

      setPedidoId(id);
      localStorage.removeItem(LS_DRAFT_KEY);

      toast.success("Pedido criado. Agora adicione os itens.");
      await carregarPedido(id);

      if (contratoId) {
        await carregarItensContrato(Number(contratoId));
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao salvar cabeçalho.");
    } finally {
      setSavingHeader(false);
    }
  }

  async function adicionarItem() {
    if (!pedidoId) return toast.error("Salve o cabeçalho primeiro.");
    if (!contratoItemId) return toast.error("Selecione o item do contrato.");
    if (!produtoId) return toast.error("Produto inválido.");

    if (qtdInformadaNum <= 0 && qtdSemBaixaEstoqueNum <= 0) {
      return toast.error(
        "Informe a quantidade com baixa ou sem baixa de estoque."
      );
    }

    if (qtdExcedeSaldoContrato) {
      return toast.error("Quantidade com baixa excede o saldo do contrato.");
    }

    if (!precoContratoAtual || precoContratoAtual <= 0) {
      return toast.error("Preço do contrato inválido.");
    }

    setSavingItem(true);

    try {
      await inserirItemPedidoVenda(pedidoId, {
        contrato_item_id: Number(contratoItemId),
        produto_id: Number(produtoId),
        qtd: String(qtdInformadaNum),
        qtd_sem_baixa_estoque: String(qtdSemBaixaEstoqueNum),
        preco_unitario: String(precoContratoAtual),
      });

      toast.success("Item inserido.");

      setContratoItemId("");
      setProdutoId("");
      setQtd("");
      setQtdSemBaixaEstoque("");

      await carregarPedido(pedidoId);

      if (contratoId) {
        await carregarItensContrato(Number(contratoId));
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao inserir item.");
    } finally {
      setSavingItem(false);
    }
  }

  async function removerItem(itemId: number) {
    if (!pedidoId) return;
    if (!window.confirm("Remover este item?")) return;

    setRemovingItemId(itemId);

    try {
      await removerItemPedidoVenda(pedidoId, itemId);
      toast.success("Item removido.");

      await carregarPedido(pedidoId);

      if (contratoId) {
        await carregarItensContrato(Number(contratoId));
      }
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

    contratosOptions,
    contratoItensOptions,

    contratoId,
    setContratoId,
    data,
    setData,
    observacao,
    setObservacao,

    pedidoId,
    itens,

    contratoItemId,
    setContratoItemId,
    produtoId,
    qtd,
    setQtd,
    qtdSemBaixaEstoque,
    setQtdSemBaixaEstoque,
    qtdSemBaixaEstoqueNum,

    contratoSelecionado,
    contratoItemSelecionado,
    totais,
    saldoContratoSelecionado,
    precoContratoAtual,
    qtdExcedeSaldoContrato,

    disableHeader,
    disableItem,
    canInsert,

    salvarCabecalho,
    adicionarItem,
    removerItem,
  };
}

export const pedidoVendaCreateUtils = {
  toNumberAny,
  moneyFromApi,
};