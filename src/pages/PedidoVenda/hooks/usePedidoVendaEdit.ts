import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import api from "../../../api/api";

import {
  atualizarPedidoVenda,
  expedirItemPedidoVenda,
  inserirItemPedidoVenda,
  listarContratosPedidoVenda,
  listarItensContratoPedidoVenda,
  listarItensPedidoVenda,
  removerItemPedidoVenda,
  buscarPedidoVenda,
  type ContratoItemOption,
  type ContratoOption,
  type PedidoVendaItem,
} from "../../../services/pedidoVenda/pedidoVendaService";

import { pedidoVendaCreateUtils } from "./usePedidoVendaCreate";

function controlaLoteProduto(item: any) {
  return (
    item?.produto?.controla_lote === true ||
    item?.produto?.controla_lote === "true"
  );
}

export function usePedidoVendaEdit(pedidoId: number) {
  const qtdRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [actingItemId, setActingItemId] = useState<number | null>(null);

  const [modalBaixaOpen, setModalBaixaOpen] = useState(false);
  const [itemBaixa, setItemBaixa] = useState<any>(null);
  const [qtdBaixa, setQtdBaixa] = useState("");
  const [estoqueLoteId, setEstoqueLoteId] = useState("");

  const [lotesOptions, setLotesOptions] = useState<any[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);

  const [contratosOptions, setContratosOptions] = useState<ContratoOption[]>([]);
  const [contratoItensOptions, setContratoItensOptions] = useState<
    ContratoItemOption[]
  >([]);

  const [contratoId, setContratoId] = useState("");
  const [data, setData] = useState("");
  const [observacao, setObservacao] = useState("");
  const [pedidoStatus, setPedidoStatus] = useState("");

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

  async function carregarItens(id: number) {
    try {
      const result = await listarItensPedidoVenda(id);
      setItens(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar itens do pedido.");
      setItens([]);
    }
  }

  async function carregarPedido() {
    if (!pedidoId) return;

    setLoading(true);

    try {
      const pedido = await buscarPedidoVenda(pedidoId);

      setContratoId(String(pedido?.contrato_id || ""));
      setData(String(pedido?.data || "").slice(0, 10));
      setObservacao(pedido?.observacao || "");
      setPedidoStatus(pedido?.status || "");

      const lista =
        pedido?.itens ??
        pedido?.PedidoItemVendas ??
        pedido?.pedidoItens ??
        [];

      setItens(Array.isArray(lista) ? lista : []);

      if (pedido?.contrato_id) {
        await carregarItensContrato(Number(pedido.contrato_id));
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar pedido.");
    } finally {
      setLoading(false);
    }
  }

  async function carregarLotesProduto(produtoIdParam: number) {
    setLoadingLotes(true);

    try {
      const response = await api.get("/estoque-lotes", {
        params: {
          produto_id: produtoIdParam,
          apenas_com_saldo: true,
        },
      });

      const rows = Array.isArray(response.data)
        ? response.data
        : response.data?.data || response.data?.rows || [];

      setLotesOptions(rows);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar lotes do produto.");
      setLotesOptions([]);
    } finally {
      setLoadingLotes(false);
    }
  }

  useEffect(() => {
    async function init() {
      await carregarContratos();
      await carregarPedido();
    }

    init();
  }, [pedidoId]);

  const contratoItemSelecionado = useMemo(() => {
    const id = Number(contratoItemId);
    if (!id) return null;
    return contratoItensOptions.find((item) => item.id === id) ?? null;
  }, [contratoItemId, contratoItensOptions]);

  useEffect(() => {
    if (!contratoItemSelecionado) return;

    setProdutoId(String(contratoItemSelecionado.produto_id));
    setTimeout(() => qtdRef.current?.focus(), 60);
  }, [contratoItemSelecionado]);

  const qtdInformadaNum = useMemo(
    () => pedidoVendaCreateUtils.toNumberAny(qtd),
    [qtd]
  );

  const qtdSemBaixaEstoqueNum = useMemo(
    () => pedidoVendaCreateUtils.toNumberAny(qtdSemBaixaEstoque),
    [qtdSemBaixaEstoque]
  );

  const totais = useMemo(() => {
    const totalItens = itens.length;

    const totalQtdComBaixa = itens.reduce(
      (acc, item) => acc + pedidoVendaCreateUtils.toNumberAny(item.qtd),
      0
    );

    const totalQtdSemBaixa = itens.reduce(
      (acc, item) =>
        acc +
        pedidoVendaCreateUtils.toNumberAny(
          (item as any).qtd_sem_baixa_estoque
        ),
      0
    );

    const totalQtd = totalQtdComBaixa + totalQtdSemBaixa;

    const totalValor = itens.reduce((acc, item) => {
      const qComBaixa = pedidoVendaCreateUtils.toNumberAny(item.qtd);
      const qSemBaixa = pedidoVendaCreateUtils.toNumberAny(
        (item as any).qtd_sem_baixa_estoque
      );
      const p = pedidoVendaCreateUtils.moneyFromApi(item.preco_unitario);

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
    return pedidoVendaCreateUtils.toNumberAny(
      contratoItemSelecionado.saldo_contrato
    );
  }, [contratoItemSelecionado]);

  const precoContratoAtual = useMemo(() => {
    if (!contratoItemSelecionado) return 0;
    return pedidoVendaCreateUtils.moneyFromApi(
      contratoItemSelecionado.preco_unitario_contratado
    );
  }, [contratoItemSelecionado]);

  const qtdExcedeSaldoContrato = useMemo(() => {
    if (!contratoItemSelecionado) return false;
    if (!qtdInformadaNum) return false;
    return qtdInformadaNum > saldoContratoSelecionado;
  }, [contratoItemSelecionado, qtdInformadaNum, saldoContratoSelecionado]);

  const canEditHeader = ["RASCUNHO"].includes(
    String(pedidoStatus || "").toUpperCase()
  );

  const canManageItems = [
    "RASCUNHO",
    "APROVADO",
    "PARCIALMENTE_ATENDIDO",
    "ATENDIDO",
  ].includes(String(pedidoStatus || "").toUpperCase());

  const disableHeader = loading || savingHeader || !canEditHeader;
  const disableItem = loading || savingItem || !canManageItems;

  const canInsert =
    !disableItem &&
    !!contratoItemId &&
    (qtdInformadaNum > 0 || qtdSemBaixaEstoqueNum > 0) &&
    !qtdExcedeSaldoContrato &&
    !!contratoItemSelecionado;

  async function salvarCabecalho() {
    if (!pedidoId) return;

    if (!contratoId) {
      toast.error("Selecione um contrato.");
      return;
    }

    setSavingHeader(true);

    try {
      await atualizarPedidoVenda(pedidoId, {
        contrato_id: Number(contratoId),
        data,
        observacao: observacao?.trim() || null,
      });

      toast.success("Pedido atualizado com sucesso.");
      await carregarPedido();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao atualizar pedido.");
    } finally {
      setSavingHeader(false);
    }
  }

  async function adicionarItem() {
    if (!pedidoId) return toast.error("Pedido inválido.");
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

      await carregarItens(pedidoId);

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

      await carregarItens(pedidoId);

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

  async function abrirModalBaixa(item: any) {
    const qtdReservada = pedidoVendaCreateUtils.toNumberAny(item.qtd_reservada);
    const qtdExpedida = pedidoVendaCreateUtils.toNumberAny(item.qtd_expedida);
    const qtdDevolvida = pedidoVendaCreateUtils.toNumberAny(item.qtd_devolvida);

    const saldoParaBaixa = Math.max(
      0,
      qtdReservada - qtdExpedida + qtdDevolvida
    );

    setItemBaixa(item);
    setQtdBaixa(String(saldoParaBaixa || qtdReservada || item.qtd || ""));
    setEstoqueLoteId("");
    setLotesOptions([]);
    setModalBaixaOpen(true);

    if (controlaLoteProduto(item) && item?.produto_id) {
      await carregarLotesProduto(Number(item.produto_id));
    }
  }

  async function confirmarBaixa() {
    if (!pedidoId || !itemBaixa) return;

    const qtdNum = pedidoVendaCreateUtils.toNumberAny(qtdBaixa);

    if (!qtdNum || qtdNum <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }

    if (controlaLoteProduto(itemBaixa) && !estoqueLoteId) {
      toast.error("Selecione o lote/validade para realizar a baixa.");
      return;
    }

    setActingItemId(itemBaixa.id);

    try {
      await expedirItemPedidoVenda(pedidoId, itemBaixa.id, {
        qtd_baixa: qtdNum,
        estoque_lote_id: estoqueLoteId ? Number(estoqueLoteId) : undefined,
      });

      toast.success("Baixa realizada com sucesso.");

      setModalBaixaOpen(false);
      setItemBaixa(null);
      setQtdBaixa("");
      setEstoqueLoteId("");
      setLotesOptions([]);

      await carregarPedido();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao realizar baixa.");
    } finally {
      setActingItemId(null);
    }
  }

  return {
    qtdRef,

    loading,
    savingHeader,
    savingItem,
    removingItemId,
    actingItemId,

    contratosOptions,
    contratoItensOptions,

    contratoId,
    setContratoId,
    data,
    setData,
    observacao,
    setObservacao,
    pedidoStatus,

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

    contratoItemSelecionado,
    totais,
    saldoContratoSelecionado,
    precoContratoAtual,
    qtdExcedeSaldoContrato,

    canEditHeader,
    canManageItems,
    disableHeader,
    disableItem,
    canInsert,

    salvarCabecalho,
    adicionarItem,
    removerItem,

    modalBaixaOpen,
    setModalBaixaOpen,
    itemBaixa,
    qtdBaixa,
    setQtdBaixa,
    estoqueLoteId,
    setEstoqueLoteId,
    lotesOptions,
    loadingLotes,
    abrirModalBaixa,
    confirmarBaixa,

    refetch: carregarPedido,
  };
}