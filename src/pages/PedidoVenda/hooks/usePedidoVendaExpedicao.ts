import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  buscarPedidoVenda,
  cancelarExpedicaoPedidoVenda,
  expedirItemPedidoVenda,
  listarLotesItemPedidoVenda,
  type PedidoVendaDetalhe,
  type PedidoVendaItem,
  type PedidoVendaLoteOption,
} from "../../../services/pedidoVenda/pedidoVendaService";

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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function usePedidoVendaExpedicao() {
  const navigate = useNavigate();
  const { id } = useParams();

  const pedidoId = Number(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pedido, setPedido] = useState<PedidoVendaDetalhe | null>(null);
  const [itens, setItens] = useState<PedidoVendaItem[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<PedidoVendaItem | null>(
    null
  );

  const [qtdBaixa, setQtdBaixa] = useState("");
  const [dataExpedicao, setDataExpedicao] = useState(todayISO());
  const [observacaoExpedicao, setObservacaoExpedicao] = useState("");

  const [estoqueLoteId, setEstoqueLoteId] = useState("");
  const [lotes, setLotes] = useState<PedidoVendaLoteOption[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [produtoControlaLote, setProdutoControlaLote] = useState(false);

  async function carregarPedido() {
    if (!pedidoId) return;

    setLoading(true);

    try {
      const data = await buscarPedidoVenda(pedidoId);

      const lista =
        data?.itens ??
        data?.PedidoItemVendas ??
        data?.pedidoItens ??
        [];

      setPedido(data);
      setItens(Array.isArray(lista) ? lista : []);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao carregar pedido.");
      navigate("/pedidosvenda");
    } finally {
      setLoading(false);
    }
  }

  async function carregarLotes(item: PedidoVendaItem) {
    setLoadingLotes(true);

    try {
      const result = await listarLotesItemPedidoVenda(pedidoId, item.id);

      setLotes(result.data || []);
      setProdutoControlaLote(!!result.produto_controla_lote);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao carregar lotes.");
      setLotes([]);
      setProdutoControlaLote(false);
    } finally {
      setLoadingLotes(false);
    }
  }

  function getSaldoPendente(item: PedidoVendaItem) {
    const qtd = toNumberAny(item.qtd);
    const expedida = toNumberAny(item.qtd_expedida);
    const cancelada = toNumberAny(item.qtd_cancelada);
    const devolvida = toNumberAny(item.qtd_devolvida);

    return Math.max(0, qtd - expedida - cancelada + devolvida);
  }

  function abrirModalExpedicao(item: PedidoVendaItem) {
    const saldo = getSaldoPendente(item);

    if (saldo <= 0) {
      toast.warning("Este item não possui saldo pendente para expedição.");
      return;
    }

    setItemSelecionado(item);
    setQtdBaixa(String(saldo));
    setDataExpedicao(todayISO());
    setObservacaoExpedicao("");
    setEstoqueLoteId("");
    setLotes([]);
    setProdutoControlaLote(false);
    setModalOpen(true);

    carregarLotes(item);
  }

  function fecharModal() {
    if (saving) return;

    setModalOpen(false);
    setItemSelecionado(null);
    setQtdBaixa("");
    setEstoqueLoteId("");
    setObservacaoExpedicao("");
    setLotes([]);
    setProdutoControlaLote(false);
  }

  async function confirmarExpedicao() {
    if (!itemSelecionado) return;

    const qtd = toNumberAny(qtdBaixa);
    const saldo = getSaldoPendente(itemSelecionado);

    if (qtd <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }

    if (qtd > saldo) {
      toast.error(`Quantidade maior que o saldo pendente (${saldo}).`);
      return;
    }

    if (!dataExpedicao) {
      toast.error("Informe a data da expedição.");
      return;
    }

    if (produtoControlaLote && !estoqueLoteId) {
      toast.error("Selecione o lote para expedir este produto.");
      return;
    }

    setSaving(true);

    try {
      await expedirItemPedidoVenda(pedidoId, itemSelecionado.id, {
        qtd_baixa: qtd,
        estoque_lote_id: estoqueLoteId ? Number(estoqueLoteId) : null,
        data_expedicao: dataExpedicao,
        observacao: observacaoExpedicao || undefined,
        observacao_expedicao: observacaoExpedicao || undefined,
      });

      toast.success("Expedição registrada com sucesso.");

      fecharModal();
      await carregarPedido();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao registrar expedição.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelarExpedicao(itemId: number, expedicaoId: number) {
    const motivo = window.prompt("Motivo do cancelamento da expedição:");

    if (motivo === null) return;

    setSaving(true);

    try {
      await cancelarExpedicaoPedidoVenda(pedidoId, itemId, expedicaoId, {
        observacao: motivo || "Cancelamento de expedição",
      });

      toast.success("Expedição cancelada com sucesso.");
      await carregarPedido();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao cancelar expedição.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    carregarPedido();
  }, [pedidoId]);

  const resumo = useMemo(() => {
    const totalItens = itens.length;

    const totalPedido = itens.reduce(
      (acc, item) => acc + toNumberAny(item.qtd),
      0
    );

    const totalExpedido = itens.reduce(
      (acc, item) => acc + toNumberAny(item.qtd_expedida),
      0
    );

    const totalPendente = itens.reduce(
      (acc, item) => acc + getSaldoPendente(item),
      0
    );

    return {
      totalItens,
      totalPedido,
      totalExpedido,
      totalPendente,
    };
  }, [itens]);

  return {
    navigate,
    pedidoId,

    loading,
    saving,

    pedido,
    itens,
    resumo,

    modalOpen,
    itemSelecionado,
    qtdBaixa,
    setQtdBaixa,
    dataExpedicao,
    setDataExpedicao,
    observacaoExpedicao,
    setObservacaoExpedicao,

    estoqueLoteId,
    setEstoqueLoteId,
    lotes,
    loadingLotes,
    produtoControlaLote,

    getSaldoPendente,
    abrirModalExpedicao,
    fecharModal,
    confirmarExpedicao,
    cancelarExpedicao,
    refetch: carregarPedido,
  };
}

export const pedidoVendaExpedicaoUtils = {
  toNumberAny,
};