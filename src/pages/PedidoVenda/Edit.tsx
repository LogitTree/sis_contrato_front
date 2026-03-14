import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { tableStyles } from "../../styles/table";
import { filterStyles } from "../../styles/filters";

import { FiTrash2, FiCheckCircle, FiXCircle, FiSend, FiCornerUpLeft } from "react-icons/fi";

type ContratoOption = {
  id: number;
  numero: string;
  orgaoNome?: string;
  empresaNome?: string;
};

type ContratoItemOption = {
  id: number;
  produto_id: number;
  produtoNome?: string;
  unidade_contratada?: string;
  fator_multiplicacao?: string | number;
  preco_unitario_contratado?: string | number;
  qtd_maxima_contratada?: string | number;
  saldo_contrato?: string | number;
  qtd_utilizada?: string | number;
};

type PedidoItem = {
  id: number;
  contrato_item_id: number;
  produto_id: number;
  qtd: string;
  preco_unitario: string;
  aprovado?: boolean | null;
  motivo_bloqueio?: string | null;

  qtd_reservada?: string;
  qtd_expedida?: string;
  qtd_cancelada?: string;
  qtd_devolvida?: string;

  status_item?:
  | "PENDENTE"
  | "PARCIALMENTE_RESERVADO"
  | "RESERVADO"
  | "PARCIALMENTE_EXPEDIDO"
  | "EXPEDIDO"
  | "CANCELADO";

  saldo_reservado?: number;
  saldo_pendente?: number;
  saldo_ativo?: number;

  produto?: {
    nome?: string;
    controla_lote?: boolean;
    controla_validade?: boolean;
  };
  contrato_item?: { id?: number };
};

type LoteDisponivel = {
  id: number;
  produto_id: number;
  lote: string;
  validade: string | null;
  quantidade: number;
  custo?: number;
  situacao_validade?: string;
};

function toNumberAny(v: any): number {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim();
  if (!s) return 0;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    const normalized = s.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }
  if (hasComma) {
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

function formatMoneyBR(n: number) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQtyBR(n: number) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function normalizeDecimalString(v: string) {
  const clean = (v || "").replace(/[^\d.,]/g, "");
  const hasComma = clean.includes(",");
  const hasDot = clean.includes(".");
  if (hasComma && hasDot) return clean.replace(/\./g, "").replace(",", ".");
  if (hasComma) return clean.replace(",", ".");
  return clean;
}

function statusItemStyle(status?: string): React.CSSProperties {
  const s = String(status || "").toUpperCase();

  if (s === "EXPEDIDO") {
    return {
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 700,
      display: "inline-block",
      background: "#dcfce7",
      color: "#166534",
    };
  }

  if (s === "PARCIALMENTE_EXPEDIDO") {
    return {
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 700,
      display: "inline-block",
      background: "#e0f2fe",
      color: "#075985",
    };
  }

  if (s === "RESERVADO") {
    return {
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 700,
      display: "inline-block",
      background: "#dbeafe",
      color: "#1e40af",
    };
  }

  if (s === "PARCIALMENTE_RESERVADO") {
    return {
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 700,
      display: "inline-block",
      background: "#fef3c7",
      color: "#92400e",
    };
  }

  if (s === "CANCELADO") {
    return {
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 700,
      display: "inline-block",
      background: "#fee2e2",
      color: "#991b1b",
    };
  }

  return {
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    display: "inline-block",
    background: "#f8fafc",
    color: "#475569",
  };
}

function situacaoValidadeLabel(situacao?: string) {
  const s = String(situacao || "").toUpperCase();

  if (s === "VENCIDO") return { label: "Vencido", color: "#991b1b", bg: "#fee2e2" };
  if (s === "VENCE_30") return { label: "Vence em até 30 dias", color: "#92400e", bg: "#fef3c7" };
  if (s === "VENCE_60") return { label: "Vence em até 60 dias", color: "#9a3412", bg: "#ffedd5" };
  if (s === "VENCE_90") return { label: "Vence em até 90 dias", color: "#075985", bg: "#e0f2fe" };
  if (s === "OK") return { label: "OK", color: "#166534", bg: "#dcfce7" };

  return { label: "Sem validade", color: "#475569", bg: "#f8fafc" };
}

export default function PedidoVendaEdit() {
  const navigate = useNavigate();
  const params = useParams();
  const pedidoId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  const [contratosOptions, setContratosOptions] = useState<ContratoOption[]>([]);
  const [contratoItensOptions, setContratoItensOptions] = useState<ContratoItemOption[]>([]);

  const [contratoId, setContratoId] = useState("");
  const [data, setData] = useState("");
  const [observacao, setObservacao] = useState("");
  const [pedidoStatus, setPedidoStatus] = useState("");

  const [itens, setItens] = useState<PedidoItem[]>([]);

  const [contratoItemId, setContratoItemId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [qtd, setQtd] = useState("");

  const qtdRef = useRef<HTMLInputElement | null>(null);

  const [togglingItemId, setTogglingItemId] = useState<number | null>(null);
  const [motivoModalOpen, setMotivoModalOpen] = useState(false);
  const [motivoTexto, setMotivoTexto] = useState("");
  const [itemParaReprovar, setItemParaReprovar] = useState<PedidoItem | null>(null);

  const [baixaModalOpen, setBaixaModalOpen] = useState(false);
  const [itemBaixa, setItemBaixa] = useState<PedidoItem | null>(null);
  const [qtdBaixa, setQtdBaixa] = useState("");
  const [baixandoItemId, setBaixandoItemId] = useState<number | null>(null);

  const [lotesDisponiveis, setLotesDisponiveis] = useState<LoteDisponivel[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [estoqueLoteId, setEstoqueLoteId] = useState("");

  const [devolucaoModalOpen, setDevolucaoModalOpen] = useState(false);
  const [itemDevolucao, setItemDevolucao] = useState<PedidoItem | null>(null);
  const [qtdDevolucao, setQtdDevolucao] = useState("");
  const [devolvendoItemId, setDevolvendoItemId] = useState<number | null>(null);

  const [lotesDevolucao, setLotesDevolucao] = useState<LoteDisponivel[]>([]);
  const [loadingLotesDevolucao, setLoadingLotesDevolucao] = useState(false);
  const [estoqueLoteIdDevolucao, setEstoqueLoteIdDevolucao] = useState("");

  function openReprovarModal(item: PedidoItem) {
    setItemParaReprovar(item);
    setMotivoTexto(item.motivo_bloqueio || "");
    setMotivoModalOpen(true);
  }

  function closeReprovarModal() {
    setMotivoModalOpen(false);
    setItemParaReprovar(null);
    setMotivoTexto("");
  }

  async function openBaixaModal(item: PedidoItem) {
    setItemBaixa(item);
    setQtdBaixa("");
    setEstoqueLoteId("");
    setLotesDisponiveis([]);
    setBaixaModalOpen(true);

    if (item.produto?.controla_lote) {
      try {
        setLoadingLotes(true);

        const res = await api.get(
          `/pedidosvenda/${pedidoId}/itens/${item.id}/lotes-disponiveis`
        );

        const lista = Array.isArray(res.data?.data) ? res.data.data : [];
        setLotesDisponiveis(lista);
      } catch (err: any) {
        console.error(err);
        toast.error(err?.response?.data?.error || "Erro ao carregar lotes disponíveis");
        setLotesDisponiveis([]);
      } finally {
        setLoadingLotes(false);
      }
    }
  }

  function closeBaixaModal() {
    setBaixaModalOpen(false);
    setItemBaixa(null);
    setQtdBaixa("");
    setEstoqueLoteId("");
    setLotesDisponiveis([]);
    setLoadingLotes(false);
  }

  async function openDevolucaoModal(item: PedidoItem) {
    setItemDevolucao(item);
    setQtdDevolucao("");
    setEstoqueLoteIdDevolucao("");
    setLotesDevolucao([]);
    setDevolucaoModalOpen(true);

    if (item.produto?.controla_lote) {
      try {
        setLoadingLotesDevolucao(true);

        const res = await api.get(
          `/pedidosvenda/${pedidoId}/itens/${item.id}/lotes-disponiveis`
        );

        const lista = Array.isArray(res.data?.data) ? res.data.data : [];
        setLotesDevolucao(lista);
      } catch (err: any) {
        console.error(err);
        toast.error(err?.response?.data?.error || "Erro ao carregar lotes para devolução");
        setLotesDevolucao([]);
      } finally {
        setLoadingLotesDevolucao(false);
      }
    }
  }

  function closeDevolucaoModal() {
    setDevolucaoModalOpen(false);
    setItemDevolucao(null);
    setQtdDevolucao("");
    setEstoqueLoteIdDevolucao("");
    setLotesDevolucao([]);
    setLoadingLotesDevolucao(false);
  }

  async function handleDevolverItem() {
    if (!pedidoId || !itemDevolucao) return;

    const qtdN = toNumberAny(qtdDevolucao);
    if (!qtdN || qtdN <= 0) {
      toast.error("Informe a quantidade para devolução");
      return;
    }

    const controlaLote = !!itemDevolucao.produto?.controla_lote;

    if (controlaLote && !estoqueLoteIdDevolucao) {
      toast.error("Selecione o lote para devolução");
      return;
    }

    setDevolvendoItemId(itemDevolucao.id);

    try {
      await api.post(`/pedidosvenda/${pedidoId}/itens/${itemDevolucao.id}/devolver`, {
        qtd_devolucao: String(qtdN),
        estoque_lote_id: controlaLote ? Number(estoqueLoteIdDevolucao) : undefined,
      });

      toast.success("Devolução realizada");
      closeDevolucaoModal();
      await loadPedidoAndFill();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao devolver item");
    } finally {
      setDevolvendoItemId(null);
    }
  }

  async function handleAprovarItem(itemId: number) {
    if (!pedidoId) return;

    setTogglingItemId(itemId);
    try {
      await api.post(`/pedidosvenda/${pedidoId}/itens/${itemId}/aprovar`);
      toast.success("Item aprovado");
      await loadPedidoAndFill();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao aprovar item");
    } finally {
      setTogglingItemId(null);
    }
  }

  async function handleReprovarItem(itemId: number, motivo: string) {
    if (!pedidoId) return;

    if (!motivo?.trim()) {
      toast.error("Informe o motivo da reprovação");
      return;
    }

    setTogglingItemId(itemId);
    try {
      await api.post(`/pedidosvenda/${pedidoId}/itens/${itemId}/reprovar`, { motivo });
      toast.success("Item reprovado");
      closeReprovarModal();
      await loadPedidoAndFill();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao reprovar item");
    } finally {
      setTogglingItemId(null);
    }
  }

  async function handleBaixarItem() {
    if (!pedidoId || !itemBaixa) return;

    const qtdN = toNumberAny(qtdBaixa);
    if (!qtdN || qtdN <= 0) {
      toast.error("Informe a quantidade para baixa");
      return;
    }

    const controlaLote = !!itemBaixa.produto?.controla_lote;

    if (controlaLote && !estoqueLoteId) {
      toast.error("Selecione o lote para realizar a baixa");
      return;
    }

    setBaixandoItemId(itemBaixa.id);

    try {
      await api.post(`/pedidosvenda/${pedidoId}/itens/${itemBaixa.id}/baixar`, {
        qtd_baixa: String(qtdN),
        estoque_lote_id: controlaLote ? Number(estoqueLoteId) : undefined,
      });

      toast.success("Baixa realizada");
      closeBaixaModal();
      await loadPedidoAndFill();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao realizar baixa");
    } finally {
      setBaixandoItemId(null);
    }
  }

  const helperLineStyle: React.CSSProperties = {
    marginTop: 8,
    fontSize: 12,
    color: "#64748b",
    minHeight: 42,
    lineHeight: "17px",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as any,
    WebkitLineClamp: 3 as any,
  };

  const sectionTitleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    marginBottom: 10,
    borderBottom: "1px solid #eef2f7",
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  };

  const sectionHintStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 600,
  };

  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const apply = () => setIsSmall(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  async function loadContratos() {
    const res = await api.get("/contratos", { params: { page: 1, limit: 500 } });
    const list = res.data?.data ?? res.data?.rows ?? [];
    const contratos = (Array.isArray(list) ? list : []).map((c: any) => ({
      id: c.id,
      numero: c.numero,
      orgaoNome: c.orgao?.nome ?? "",
      empresaNome: c.empresa?.razao_social ?? c.empresa?.nome_fantasia ?? "",
    }));
    setContratosOptions(contratos);
  }

  async function loadContratoItens(contrato_id: number) {
    const res = await api.get(`/contratos/${contrato_id}`);
    const lista = (res.data?.itens ?? []).map((it: any) => ({
      id: it.id,
      produto_id: it.produto_id,
      produtoNome: it.produto?.nome ?? "",
      unidade_contratada: it.unidade_contratada ?? "UN",
      fator_multiplicacao: it.fator_multiplicacao ?? 1,
      preco_unitario_contratado: it.preco_unitario_contratado ?? "",
      qtd_maxima_contratada: it.qtd_maxima_contratada ?? "",
      saldo_contrato: it.saldo_contrato ?? it.saldoContrato ?? 0,
      qtd_utilizada: it.qtd_utilizada ?? it.qtdUtilizada ?? 0,
    }));
    setContratoItensOptions(lista);
  }

  async function loadPedidoAndFill() {
    if (!pedidoId || Number.isNaN(pedidoId)) {
      toast.error("Pedido inválido");
      navigate("/pedidosvenda");
      return;
    }

    const res = await api.get(`/pedidosvenda/${pedidoId}`);
    const pedido = res.data;

    const contrato_id = pedido?.contrato_id ?? "";
    const dataApi = pedido?.data ?? "";
    const obsApi = pedido?.observacao ?? "";

    setContratoId(String(contrato_id));
    setData(String(dataApi).slice(0, 10));
    setObservacao(obsApi === null || obsApi === undefined ? "" : String(obsApi));
    setPedidoStatus(String(pedido?.status ?? ""));

    setItens(Array.isArray(pedido?.itens) ? pedido.itens : []);
  }

  function getStatusItemVisual(it: PedidoItem) {
    const expedida = toNumberAny(it.qtd_expedida);
    const devolvida = toNumberAny(it.qtd_devolvida);
    const status = String(it.status_item || "").toUpperCase();

    if (expedida > 0 && devolvida >= expedida) {
      return "DEVOLVIDO";
    }

    if (devolvida > 0 && devolvida < expedida) {
      return "PARCIALMENTE_DEVOLVIDO";
    }

    return status || "PENDENTE";
  }

  function statusItemVisualStyle(status?: string): React.CSSProperties {
    const s = String(status || "").toUpperCase();

    if (s === "DEVOLVIDO") {
      return {
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        display: "inline-block",
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    if (s === "PARCIALMENTE_DEVOLVIDO") {
      return {
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        display: "inline-block",
        background: "#ffedd5",
        color: "#9a3412",
      };
    }

    return statusItemStyle(s);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        setContratoId("");
        setData("");
        setObservacao("");
        setPedidoStatus("");
        setItens([]);
        setContratoItensOptions([]);
        setContratoItemId("");
        setProdutoId("");
        setQtd("");

        await loadContratos();
        await loadPedidoAndFill();
      } catch (err: any) {
        console.error(err);
        toast.error(err?.response?.data?.error || "Erro ao carregar pedido");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  useEffect(() => {
    const id = Number(contratoId);
    if (!id) {
      setContratoItensOptions([]);
      setContratoItemId("");
      setProdutoId("");
      setQtd("");
      return;
    }

    loadContratoItens(id).catch((err) => {
      console.error(err);
      toast.error("Erro ao carregar itens do contrato");
      setContratoItensOptions([]);
    });

    setContratoItemId("");
    setProdutoId("");
    setQtd("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratoId]);

  const contratoSelecionado = useMemo(() => {
    const id = Number(contratoId);
    if (!id) return null;
    return contratosOptions.find((c) => c.id === id) ?? null;
  }, [contratoId, contratosOptions]);

  const contratoItemSelecionado = useMemo(() => {
    const id = Number(contratoItemId);
    if (!id) return null;
    return contratoItensOptions.find((i) => i.id === id) ?? null;
  }, [contratoItemId, contratoItensOptions]);

  useEffect(() => {
    if (!contratoItemSelecionado) return;
    setProdutoId(String(contratoItemSelecionado.produto_id));
    setTimeout(() => qtdRef.current?.focus(), 60);
  }, [contratoItemSelecionado]);

  const totais = useMemo(() => {
    const totalItens = itens.length;
    const totalQtd = itens.reduce((acc, it) => acc + toNumberAny(it.qtd), 0);
    const totalValor = itens.reduce((acc, it) => {
      const q = toNumberAny(it.qtd);
      const p = moneyFromApi(it.preco_unitario);
      return acc + q * p;
    }, 0);
    const totalLiquido = itens.reduce((acc, it) => {
      const expedida = toNumberAny(it.qtd_expedida);
      const devolvida = toNumberAny(it.qtd_devolvida);
      const liquida = Math.max(0, expedida - devolvida);
      const preco = moneyFromApi(it.preco_unitario);
      return acc + liquida * preco;
    }, 0);
    return { totalItens, totalQtd, totalValor, totalLiquido };
  }, [itens]);

  const qtdInformadaNum = useMemo(() => toNumberAny(qtd), [qtd]);

  const saldoContratoSelecionado = useMemo(() => {
    if (!contratoItemSelecionado) return 0;
    return toNumberAny(contratoItemSelecionado.saldo_contrato);
  }, [contratoItemSelecionado]);

  const qtdExcedeSaldoContrato = useMemo(() => {
    if (!contratoItemSelecionado) return false;
    if (!qtdInformadaNum) return false;
    return qtdInformadaNum > saldoContratoSelecionado;
  }, [contratoItemSelecionado, qtdInformadaNum, saldoContratoSelecionado]);

  async function handleSalvarCabecalho(e: React.FormEvent) {
    e.preventDefault();
    if (!pedidoId) return;
    if (!contratoId) return toast.error("Selecione um contrato");
    if (!data) return toast.error("Informe a data");

    setSavingHeader(true);
    try {
      const payload = {
        contrato_id: Number(contratoId),
        data,
        observacao: observacao?.trim() || null,
      };

      await api.put(`/pedidosvenda/${pedidoId}`, payload);
      toast.success("Cabeçalho atualizado");
      await loadPedidoAndFill();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao atualizar cabeçalho");
    } finally {
      setSavingHeader(false);
    }
  }

  async function handleAddItem() {
    if (!pedidoId) return toast.error("Pedido inválido.");
    if (!contratoItemId) return toast.error("Selecione o item do contrato");
    if (!produtoId) return toast.error("Produto inválido");

    const qtdN = toNumberAny(qtd);
    if (!qtdN || qtdN <= 0) return toast.error("Informe a quantidade");

    if (qtdExcedeSaldoContrato) {
      return toast.error("Quantidade excede o saldo do contrato para este item.");
    }

    const precoContrato = contratoItemSelecionado
      ? moneyFromApi(contratoItemSelecionado.preco_unitario_contratado)
      : 0;

    if (!precoContrato || precoContrato <= 0) {
      return toast.error("Preço do contrato inválido");
    }

    setSavingItem(true);
    try {
      const payload = {
        contrato_item_id: Number(contratoItemId),
        produto_id: Number(produtoId),
        qtd: String(qtdN),
        preco_unitario: String(precoContrato),
      };

      await api.post(`/pedidosvenda/${pedidoId}/itens`, payload);

      toast.success("Item inserido");
      setContratoItemId("");
      setProdutoId("");
      setQtd("");

      await loadPedidoAndFill();
      if (contratoId) await loadContratoItens(Number(contratoId));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao inserir item");
    } finally {
      setSavingItem(false);
    }
  }

  async function handleRemoveItem(itemId: number) {
    if (!pedidoId) return;
    if (!window.confirm("Remover este item?")) return;

    setRemovingItemId(itemId);
    try {
      await api.delete(`/pedidosvenda/${pedidoId}/itens/${itemId}`);
      toast.success("Item removido");
      await loadPedidoAndFill();
      if (contratoId) await loadContratoItens(Number(contratoId));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao remover item");
    } finally {
      setRemovingItemId(null);
    }
  }
  const canEditHeader = pedidoStatus === "RASCUNHO";
  const canManageDraftItems = pedidoStatus === "RASCUNHO";
  const canBaixarItens =
    pedidoStatus === "APROVADO" || pedidoStatus === "PARCIALMENTE_ATENDIDO";
  const canDevolverItens =
    pedidoStatus === "ATENDIDO" || pedidoStatus === "CONCLUIDO";

  const disableHeader = loading || savingHeader || !canEditHeader;
  const disableItem = loading || savingItem || !canManageDraftItems;

  const precoContratoAtual = contratoItemSelecionado
    ? moneyFromApi(contratoItemSelecionado.preco_unitario_contratado)
    : 0;

  const canInsert =
    !disableItem &&
    !!contratoItemId &&
    !!qtd &&
    toNumberAny(qtd) > 0 &&
    !qtdExcedeSaldoContrato &&
    !!contratoItemSelecionado;

  const itemGridStyle: React.CSSProperties = {
    display: "grid",
    gap: 16,
    alignItems: "end",
    gridTemplateColumns: "minmax(360px, 1fr) 220px 260px 170px",
    width: "100%",
  };

  const itemGridStyleMobile: React.CSSProperties = {
    display: "grid",
    gap: 16,
    alignItems: "end",
    gridTemplateColumns: "1fr",
    width: "100%",
  };

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Editar Pedido de Venda #{pedidoId}</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {loading
              ? "Carregando..."
              : `Status atual: ${pedidoStatus || "-"} · Edite o cabeçalho e gerencie os itens.`}
          </div>
        </div>
      </div>

      <div style={layoutStyles.card}>
        <div style={sectionTitleStyle}>
          <div style={sectionLabelStyle}>Cabeçalho do Pedido</div>
          <div style={sectionHintStyle}>
            {pedidoStatus === "RASCUNHO"
              ? "Atualize e salve"
              : "Pedido fora de rascunho: cabeçalho bloqueado"}
          </div>
        </div>

        <form onSubmit={handleSalvarCabecalho}>
          <div style={layoutStyles.cardCompact}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
              <div style={{ display: "flex", gap: 16, width: "100%", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 320 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                    Contrato (Número - Órgão)
                  </label>

                  <select
                    value={contratoId}
                    onChange={(e) => setContratoId(e.target.value)}
                    style={{
                      ...filterStyles.select,
                      height: 38,
                      padding: "0 12px",
                      boxSizing: "border-box",
                      width: "100%",
                    }}
                    disabled={disableHeader}
                  >
                    <option value="">Selecione...</option>
                    {contratosOptions.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.numero} {c.orgaoNome ? `- ${c.orgaoNome}` : ""}
                      </option>
                    ))}
                  </select>

                  <div style={helperLineStyle}>
                    {contratoSelecionado?.empresaNome ? (
                      <>
                        <span style={{ color: "#9ca3af" }}>Empresa do contrato: </span>
                        {contratoSelecionado.empresaNome}
                      </>
                    ) : (
                      "\u00A0"
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220, minWidth: 220 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Data</label>

                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    style={{
                      ...filterStyles.input,
                      height: 38,
                      padding: "0 12px",
                      boxSizing: "border-box",
                      width: "100%",
                    }}
                    disabled={disableHeader}
                  />

                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, width: "100%" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Observação</label>

                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Opcional"
                    style={{
                      ...filterStyles.input,
                      height: 120,
                      padding: "10px 12px",
                      boxSizing: "border-box",
                      width: "100%",
                      resize: "vertical",
                    }}
                    disabled={disableHeader}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button type="button" style={buttonStyles.link} onClick={() => navigate(-1)} disabled={savingHeader}>
              Voltar
            </button>

            <button type="submit" style={buttonStyles.primary} disabled={disableHeader || !contratoId || !data}>
              {savingHeader ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>

      <div style={{ height: 22 }} />

      <div style={layoutStyles.card}>
        <div style={sectionTitleStyle}>
          <div style={sectionLabelStyle}>Itens do Pedido</div>
          <div style={sectionHintStyle}>
            Itens: {totais.totalItens} · Qtd: {formatQtyBR(totais.totalQtd)} ·
            Total pedido: R$ {formatMoneyBR(totais.totalValor)} ·
            Total líquido: R$ {formatMoneyBR(totais.totalLiquido)}
          </div>
        </div>

        <div style={layoutStyles.cardCompact}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <div style={isSmall ? itemGridStyleMobile : itemGridStyle}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Item do Contrato (Produto)</label>

                <select
                  value={contratoItemId}
                  onChange={(e) => setContratoItemId(e.target.value)}
                  style={{
                    ...filterStyles.select,
                    height: 38,
                    padding: "0 12px",
                    boxSizing: "border-box",
                    width: "100%",
                  }}
                  disabled={disableItem || !contratoId}
                >
                  <option value="">Selecione...</option>
                  {contratoItensOptions.map((it) => (
                    <option key={it.id} value={String(it.id)}>
                      {it.produtoNome ? it.produtoNome : `Item #${it.id}`}
                    </option>
                  ))}
                </select>

                <div style={helperLineStyle}>
                  {contratoItemSelecionado ? (
                    <>
                      <div>
                        <span style={{ color: "#9ca3af" }}>Unidade: </span>
                        <b>{contratoItemSelecionado.unidade_contratada ?? "UN"}</b>
                        <span style={{ color: "#9ca3af", marginLeft: 10 }}>Fator: </span>
                        <b>{String(contratoItemSelecionado.fator_multiplicacao ?? 1)}</b>
                      </div>
                      <div>
                        <span style={{ color: "#9ca3af" }}>Saldo do contrato: </span>
                        <b>{formatQtyBR(saldoContratoSelecionado)}</b>
                        <span style={{ color: "#9ca3af", marginLeft: 10 }}>Preço contrat.: </span>
                        <b>R$ {formatMoneyBR(precoContratoAtual)}</b>
                      </div>
                    </>
                  ) : (
                    "\u00A0"
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Quantidade</label>
                <input
                  ref={qtdRef}
                  value={qtd}
                  onChange={(e) => setQtd(normalizeDecimalString(e.target.value))}
                  placeholder="0,000"
                  inputMode="decimal"
                  style={{
                    ...filterStyles.input,
                    height: 38,
                    padding: "0 12px",
                    boxSizing: "border-box",
                    width: "100%",
                    borderColor: qtdExcedeSaldoContrato ? "#fecaca" : undefined,
                  }}
                  disabled={disableItem}
                />
                <div style={helperLineStyle}>
                  {qtdExcedeSaldoContrato ? (
                    <span style={{ color: "#b91c1c", fontWeight: 700 }}>
                      Excede o saldo do contrato.
                    </span>
                  ) : (
                    "\u00A0"
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Preço Unitário (Contrato)</label>
                <input
                  value={contratoItemSelecionado ? `R$ ${formatMoneyBR(precoContratoAtual)}` : ""}
                  readOnly
                  style={{
                    ...filterStyles.input,
                    height: 38,
                    padding: "0 12px",
                    boxSizing: "border-box",
                    width: "100%",
                    background: "#f8fafc",
                    cursor: "not-allowed",
                  }}
                  disabled={disableItem}
                />
                <div style={{ minHeight: 42 }} aria-hidden />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>&nbsp;</label>
                <button
                  type="button"
                  style={{
                    ...buttonStyles.primary,
                    height: 36,
                    padding: "0 12px",
                    width: 150,
                    alignSelf: "flex-start",
                    whiteSpace: "nowrap",
                  }}
                  onClick={handleAddItem}
                  disabled={!canInsert}
                >
                  {savingItem ? "Inserindo..." : "+ Inserir"}
                </button>
                <div style={{ minHeight: 42 }} aria-hidden />
              </div>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 12, fontSize: 13, color: "#64748b" }}>
          Exibindo {itens.length} item(ns)
        </div>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ ...tableStyles.table, tableLayout: "auto" }}>
            <thead>
              <tr>
                <th style={{ ...tableStyles.th, width: 70 }}>ID</th>
                <th style={{ ...tableStyles.th, width: "28%" }}>PRODUTO</th>
                <th style={{ ...tableStyles.th, width: 70, textAlign: "center" }}>UNID.</th>
                <th style={{ ...tableStyles.th, width: 110, textAlign: "right" }}>QTD</th>
                <th style={{ ...tableStyles.th, width: 110, textAlign: "right" }}>RESERV.</th>
                <th style={{ ...tableStyles.th, width: 110, textAlign: "right" }}>EXPED.</th>
                <th style={{ ...tableStyles.th, width: 110, textAlign: "right" }}>PEND.</th>
                <th style={{ ...tableStyles.th, width: 110, textAlign: "right" }}>DEVOL.</th>
                <th style={{ ...tableStyles.th, width: 110, textAlign: "right" }}>LÍQUIDO</th>
                <th style={{ ...tableStyles.th, width: 150, textAlign: "right" }}>PREÇO</th>
                <th style={{ ...tableStyles.th, width: 170, textAlign: "right" }}>SUBTOTAL</th>
                <th style={{ ...tableStyles.th, width: 160, textAlign: "center" }}>STATUS ITEM</th>
                <th style={{ ...tableStyles.th, width: 170, textAlign: "center" }}>AÇÕES</th>
              </tr>
            </thead>

            <tbody>
              {itens.length === 0 && !loading && (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Nenhum item inserido ainda.
                  </td>
                </tr>
              )}

              {itens.map((it, idx) => {
                const qtdN = toNumberAny(it.qtd);
                const precoN = moneyFromApi(it.preco_unitario);
                const subtotal = qtdN * precoN;

                const qtdReservada = toNumberAny(it.qtd_reservada);
                const qtdExpedida = toNumberAny(it.qtd_expedida);
                const qtdCancelada = toNumberAny(it.qtd_cancelada);

                const qtdDevolvida = toNumberAny(it.qtd_devolvida);
                const qtdLiquida = Math.max(0, qtdExpedida - qtdDevolvida);

                const saldoPendente =
                  it.saldo_pendente ?? Math.max(0, qtdN - qtdCancelada - qtdExpedida);

                const saldoReservado =
                  it.saldo_reservado ?? Math.max(0, qtdReservada - qtdExpedida);

                const option = contratoItensOptions.find((x) => x.id === it.contrato_item_id);
                const unid = option?.unidade_contratada ?? "UN";
                const nome = it.produto?.nome || option?.produtoNome || `Produto #${it.produto_id}`;

                return (
                  <tr key={it.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={tableStyles.td}>{it.id}</td>

                    <td
                      style={{ ...tableStyles.td, whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.35 }}
                      title={nome}
                    >
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{nome}</div>
                      {it.motivo_bloqueio ? (
                        <div style={{ marginTop: 6, fontSize: 12, color: "#b91c1c" }}>
                          {it.motivo_bloqueio}
                        </div>
                      ) : null}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "center" }}>{unid}</td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                      {formatQtyBR(qtdN)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                      {formatQtyBR(qtdReservada)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                      {formatQtyBR(qtdExpedida)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8, fontWeight: 700 }}>
                      {formatQtyBR(saldoPendente)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                      {formatQtyBR(qtdDevolvida)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8, fontWeight: 700 }}>
                      {formatQtyBR(qtdLiquida)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                      R$ {formatMoneyBR(precoN)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8, fontWeight: 800 }}>
                      R$ {formatMoneyBR(subtotal)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "center" }}>
                      {(() => {
                        const statusVisual = getStatusItemVisual(it);
                        return (
                          <span style={statusItemVisualStyle(statusVisual)}>
                            {statusVisual}
                          </span>
                        );
                      })()}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button
                          style={{ ...buttonStyles.icon, opacity: togglingItemId === it.id ? 0.6 : 1 }}
                          onClick={() => handleAprovarItem(it.id)}
                          disabled={togglingItemId === it.id}
                          title="Aprovar item"
                        >
                          <FiCheckCircle size={18} color="#16a34a" />
                        </button>

                        <button
                          style={{ ...buttonStyles.icon, opacity: togglingItemId === it.id ? 0.6 : 1 }}
                          onClick={() => openReprovarModal(it)}
                          disabled={togglingItemId === it.id}
                          title="Reprovar item"
                        >
                          <FiXCircle size={18} color="#dc2626" />
                        </button>

                        <button
                          style={{ ...buttonStyles.icon, opacity: saldoReservado > 0 ? 1 : 0.35 }}
                          onClick={() => openBaixaModal(it)}
                          disabled={saldoReservado <= 0 || it.aprovado !== true || !canBaixarItens}
                          title="Baixar item"
                        >
                          <FiSend size={18} color="#075985" />
                        </button>

                        <button
                          style={{
                            ...buttonStyles.icon,
                            opacity:
                              toNumberAny(it.qtd_expedida) - toNumberAny(it.qtd_devolvida) > 0 ? 1 : 0.35,
                          }}
                          onClick={() => openDevolucaoModal(it)}
                          disabled={
                            toNumberAny(it.qtd_expedida) - toNumberAny(it.qtd_devolvida) <= 0 ||
                            !canDevolverItens
                          }
                          title="Devolver item"
                        >
                          <FiCornerUpLeft size={18} color="#854d0e" />
                        </button>

                        <button
                          style={{ ...buttonStyles.icon, opacity: removingItemId === it.id ? 0.6 : 1 }}
                          onClick={() => handleRemoveItem(it.id)}
                          disabled={removingItemId === it.id || pedidoStatus !== "RASCUNHO"}
                          title={
                            pedidoStatus === "RASCUNHO"
                              ? "Remover item"
                              : "Só é possível remover em RASCUNHO"
                          }
                        >
                          <FiTrash2 size={18} color="#dc2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Carregando...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
          <button style={buttonStyles.link} onClick={() => navigate("/pedidosvenda")} disabled={savingItem || savingHeader}>
            Voltar para lista
          </button>
        </div>
      </div>

      {motivoModalOpen && itemParaReprovar && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
          onClick={closeReprovarModal}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              background: "#fff",
              borderRadius: 14,
              padding: 16,
              boxShadow: "0 20px 50px rgba(0,0,0,.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                Reprovar item #{itemParaReprovar.id}
              </div>
              <button style={buttonStyles.link} onClick={closeReprovarModal}>
                Fechar
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 13, color: "#64748b" }}>
              Informe o motivo. Isso vai aparecer abaixo do produto.
            </div>

            <div style={{ marginTop: 12 }}>
              <textarea
                value={motivoTexto}
                onChange={(e) => setMotivoTexto(e.target.value)}
                placeholder="Ex: saldo insuficiente, margem mínima não atingida, estoque indisponível..."
                style={{
                  ...filterStyles.input,
                  width: "100%",
                  height: 120,
                  padding: "10px 12px",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button style={buttonStyles.link} onClick={closeReprovarModal}>
                Cancelar
              </button>

              <button
                style={buttonStyles.primary}
                onClick={() => handleReprovarItem(itemParaReprovar.id, motivoTexto)}
                disabled={togglingItemId === itemParaReprovar.id}
              >
                {togglingItemId === itemParaReprovar.id ? "Salvando..." : "Reprovar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {baixaModalOpen && itemBaixa && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 60,
          }}
          onClick={closeBaixaModal}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              background: "#fff",
              borderRadius: 14,
              padding: 16,
              boxShadow: "0 20px 50px rgba(0,0,0,.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
              Baixar item #{itemBaixa.id}
            </div>

            <div style={{ marginTop: 10, fontSize: 13, color: "#64748b" }}>
              Informe a quantidade para baixa
              {itemBaixa.produto?.controla_lote ? " e selecione o lote." : "."}
            </div>

            <div style={{ marginTop: 12, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
              <div>
                <b>Produto:</b> {itemBaixa.produto?.nome || `Produto #${itemBaixa.produto_id}`}
              </div>
              <div>
                <b>Qtd pedida:</b> {formatQtyBR(toNumberAny(itemBaixa.qtd))}
              </div>
              <div>
                <b>Qtd reservada:</b> {formatQtyBR(toNumberAny(itemBaixa.qtd_reservada))}
              </div>
              <div>
                <b>Qtd expedida:</b> {formatQtyBR(toNumberAny(itemBaixa.qtd_expedida))}
              </div>
              <div>
                <b>Saldo reservado:</b>{" "}
                {formatQtyBR(
                  itemBaixa.saldo_reservado ??
                  Math.max(
                    0,
                    toNumberAny(itemBaixa.qtd_reservada) - toNumberAny(itemBaixa.qtd_expedida)
                  )
                )}
              </div>
            </div>

            {itemBaixa.produto?.controla_lote && (
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  Lote disponível
                </label>

                <select
                  value={estoqueLoteId}
                  onChange={(e) => setEstoqueLoteId(e.target.value)}
                  style={{
                    ...filterStyles.select,
                    width: "100%",
                    height: 40,
                    marginTop: 6,
                    padding: "0 12px",
                    boxSizing: "border-box",
                  }}
                  disabled={loadingLotes}
                >
                  <option value="">
                    {loadingLotes ? "Carregando lotes..." : "Selecione o lote"}
                  </option>

                  {lotesDisponiveis.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.lote}
                      {l.validade ? ` | Val: ${l.validade}` : ""}
                      {` | Qtd: ${formatQtyBR(toNumberAny(l.quantidade))}`}
                    </option>
                  ))}
                </select>

                {estoqueLoteId && (
                  <div style={{ marginTop: 10 }}>
                    {(() => {
                      const loteSelecionado = lotesDisponiveis.find(
                        (l) => String(l.id) === String(estoqueLoteId)
                      );

                      if (!loteSelecionado) return null;

                      const situacao = situacaoValidadeLabel(loteSelecionado.situacao_validade);

                      return (
                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            padding: 12,
                            background: "#f8fafc",
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          <div>
                            <b>Lote:</b> {loteSelecionado.lote}
                          </div>
                          <div>
                            <b>Validade:</b> {loteSelecionado.validade || "-"}
                          </div>
                          <div>
                            <b>Quantidade disponível:</b>{" "}
                            {formatQtyBR(toNumberAny(loteSelecionado.quantidade))}
                          </div>
                          <div>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 8px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 700,
                                color: situacao.color,
                                background: situacao.bg,
                              }}
                            >
                              {situacao.label}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                Quantidade para baixa
              </label>
              <input
                value={qtdBaixa}
                onChange={(e) => setQtdBaixa(normalizeDecimalString(e.target.value))}
                placeholder="0,000"
                inputMode="decimal"
                style={{
                  ...filterStyles.input,
                  width: "100%",
                  height: 40,
                  marginTop: 6,
                  padding: "0 12px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button style={buttonStyles.link} onClick={closeBaixaModal}>
                Cancelar
              </button>

              <button
                style={buttonStyles.primary}
                onClick={handleBaixarItem}
                disabled={baixandoItemId === itemBaixa.id || loadingLotes}
              >
                {baixandoItemId === itemBaixa.id ? "Baixando..." : "Confirmar baixa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {devolucaoModalOpen && itemDevolucao && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 70,
          }}
          onClick={closeDevolucaoModal}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              background: "#fff",
              borderRadius: 14,
              padding: 16,
              boxShadow: "0 20px 50px rgba(0,0,0,.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
              Devolver item #{itemDevolucao.id}
            </div>

            <div style={{ marginTop: 10, fontSize: 13, color: "#64748b" }}>
              Informe a quantidade para devolução
              {itemDevolucao.produto?.controla_lote ? " e selecione o lote." : "."}
            </div>

            <div style={{ marginTop: 12, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
              <div>
                <b>Produto:</b> {itemDevolucao.produto?.nome || `Produto #${itemDevolucao.produto_id}`}
              </div>
              <div>
                <b>Qtd expedida:</b> {formatQtyBR(toNumberAny(itemDevolucao.qtd_expedida))}
              </div>
              <div>
                <b>Qtd devolvida:</b> {formatQtyBR(toNumberAny(itemDevolucao.qtd_devolvida))}
              </div>
              <div>
                <b>Saldo devolvível:</b>{" "}
                {formatQtyBR(
                  Math.max(
                    0,
                    toNumberAny(itemDevolucao.qtd_expedida) - toNumberAny(itemDevolucao.qtd_devolvida)
                  )
                )}
              </div>
            </div>

            {itemDevolucao.produto?.controla_lote && (
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  Lote da devolução
                </label>

                <select
                  value={estoqueLoteIdDevolucao}
                  onChange={(e) => setEstoqueLoteIdDevolucao(e.target.value)}
                  style={{
                    ...filterStyles.select,
                    width: "100%",
                    height: 40,
                    marginTop: 6,
                    padding: "0 12px",
                    boxSizing: "border-box",
                  }}
                  disabled={loadingLotesDevolucao}
                >
                  <option value="">
                    {loadingLotesDevolucao ? "Carregando lotes..." : "Selecione o lote"}
                  </option>

                  {lotesDevolucao.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.lote}
                      {l.validade ? ` | Val: ${l.validade}` : ""}
                      {` | Qtd: ${formatQtyBR(toNumberAny(l.quantidade))}`}
                    </option>
                  ))}
                </select>

                {estoqueLoteIdDevolucao && (
                  <div style={{ marginTop: 10 }}>
                    {(() => {
                      const loteSelecionado = lotesDevolucao.find(
                        (l) => String(l.id) === String(estoqueLoteIdDevolucao)
                      );

                      if (!loteSelecionado) return null;

                      const situacao = situacaoValidadeLabel(loteSelecionado.situacao_validade);

                      return (
                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            padding: 12,
                            background: "#f8fafc",
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          <div>
                            <b>Lote:</b> {loteSelecionado.lote}
                          </div>
                          <div>
                            <b>Validade:</b> {loteSelecionado.validade || "-"}
                          </div>
                          <div>
                            <b>Quantidade atual no lote:</b>{" "}
                            {formatQtyBR(toNumberAny(loteSelecionado.quantidade))}
                          </div>
                          <div>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 8px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 700,
                                color: situacao.color,
                                background: situacao.bg,
                              }}
                            >
                              {situacao.label}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                Quantidade para devolução
              </label>
              <input
                value={qtdDevolucao}
                onChange={(e) => setQtdDevolucao(normalizeDecimalString(e.target.value))}
                placeholder="0,000"
                inputMode="decimal"
                style={{
                  ...filterStyles.input,
                  width: "100%",
                  height: 40,
                  marginTop: 6,
                  padding: "0 12px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button style={buttonStyles.link} onClick={closeDevolucaoModal}>
                Cancelar
              </button>

              <button
                style={buttonStyles.primary}
                onClick={handleDevolverItem}
                disabled={devolvendoItemId === itemDevolucao.id || loadingLotesDevolucao}
              >
                {devolvendoItemId === itemDevolucao.id ? "Devolvendo..." : "Confirmar devolução"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}