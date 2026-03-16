import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import type { PedidoVenda } from "../../types/PedidoVenda";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiSend,
  FiLock,
  FiXCircle,
  FiCornerUpLeft,
  FiFileText,
} from "react-icons/fi";

type ContratoOption = {
  id: number;
  numero: string;
  orgaoNome?: string;
};

type EmpresaOption = {
  id: number;
  nome: string;
};

function pickListResponse(resData: any) {
  if (Array.isArray(resData?.data)) {
    return {
      data: resData.data,
      total: Number(resData.total ?? resData.count ?? 0) || 0,
    };
  }
  if (Array.isArray(resData?.data?.data)) {
    return {
      data: resData.data.data,
      total: Number(resData.data.total ?? resData.data.count ?? 0) || 0,
    };
  }
  if (Array.isArray(resData?.data?.rows)) {
    return {
      data: resData.data.rows,
      total: Number(resData.data.count ?? 0) || 0,
    };
  }
  if (Array.isArray(resData?.rows)) {
    return {
      data: resData.rows,
      total: Number(resData.count ?? 0) || 0,
    };
  }
  if (Array.isArray(resData?.items)) {
    return {
      data: resData.items,
      total: Number(resData.total ?? 0) || 0,
    };
  }
  return { data: [], total: 0 };
}

function formatDateBR(value: any): string {
  if (!value) return "-";

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return "-";

    const ymd = s.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      const [y, m, d] = ymd.split("-");
      return `${d}/${m}/${y}`;
    }

    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
      const d = String(dt.getDate()).padStart(2, "0");
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const y = dt.getFullYear();
      return `${d}/${m}/${y}`;
    }

    return "-";
  }

  if (value instanceof Date && !isNaN(value.getTime())) {
    const d = String(value.getDate()).padStart(2, "0");
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const y = value.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return "-";
}

function toNumberSafe(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  if (typeof v === "string") {
    const n = Number(v.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  return 0;
}

function formatMoneyBR(v: any): string {
  const n = toNumberSafe(v);
  if (!Number.isFinite(n)) return "-";

  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function calcTotalFromItens(row: any): number | null {
  if (row?.total !== undefined && row?.total !== null) {
    return toNumberSafe(row.total);
  }

  const itens =
    row?.itens ??
    row?.PedidoVendaItems ??
    row?.pedidoItens ??
    row?.pedido_itens ??
    row?.items ??
    null;

  if (!Array.isArray(itens)) return null;

  let sum = 0;
  for (const it of itens) {
    const qtd = toNumberSafe(it?.qtd);
    const preco = toNumberSafe(it?.preco_unitario);
    sum += qtd * preco;
  }

  return sum;
}

function flowPerms(status?: string) {
  const s = (status || "").toUpperCase();

  return {
    canEditHeader: s === "RASCUNHO",
    canOpen:
      s === "RASCUNHO" ||
      s === "APROVADO" ||
      s === "PARCIALMENTE_ATENDIDO" ||
      s === "ATENDIDO" ||
      s === "CONCLUIDO" ||
      s === "CONCLUÍDO" ||
      s === "PARCIALMENTE_DEVOLVIDO" ||
      s === "DEVOLVIDO",

    canAprovar:
      s === "RASCUNHO" || s === "APROVADO" || s === "PARCIALMENTE_ATENDIDO",

    canBaixar: s === "APROVADO" || s === "PARCIALMENTE_ATENDIDO",

    canConcluir: s === "ATENDIDO",

    canCancelar:
      s === "RASCUNHO" ||
      s === "APROVADO" ||
      s === "PARCIALMENTE_ATENDIDO",

    canDevolver:
      s === "PARCIALMENTE_ATENDIDO" ||
      s === "ATENDIDO" ||
      s === "CONCLUIDO" ||
      s === "CONCLUÍDO" ||
      s === "PARCIALMENTE_DEVOLVIDO",
  };
}

function getStatusVisualPedido(row: any): string {
  const statusBase = String(row?.status || "").toUpperCase();

  const totalExpedido = toNumberSafe(row?.total_expedido);
  const totalDevolvido = toNumberSafe(row?.total_devolvido);

  if (totalExpedido > 0 && totalDevolvido >= totalExpedido) {
    return "DEVOLVIDO";
  }

  if (totalDevolvido > 0 && totalDevolvido < totalExpedido) {
    return "PARCIALMENTE_DEVOLVIDO";
  }

  return statusBase;
}

function statusStyle(status: any) {
  const s = String(status || "").toUpperCase();

  if (s === "DEVOLVIDO") {
    return { background: "#fef3c7", color: "#92400e" };
  }

  if (s === "PARCIALMENTE_DEVOLVIDO") {
    return { background: "#ffedd5", color: "#9a3412" };
  }

  if (s === "ATENDIDO" || s === "CONCLUIDO" || s === "CONCLUÍDO") {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (s === "PARCIALMENTE_ATENDIDO") {
    return { background: "#e0f2fe", color: "#075985" };
  }

  if (s === "APROVADO") {
    return { background: "#dbeafe", color: "#1e40af" };
  }

  if (s === "CANCELADO") {
    return { background: "#fee2e2", color: "#991b1b" };
  }

  return { background: "#fef9c3", color: "#854d0e" };
}

export default function PedidoVendaList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<PedidoVenda[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroContratoId, setFiltroContratoId] = useState("");
  const [filtroEmpresaId, setFiltroEmpresaId] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  const [orderBy, setOrderBy] = useState<"id" | "data" | "status" | "contrato_id">("id");
  const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("DESC");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [contratosOptions, setContratosOptions] = useState<ContratoOption[]>([]);
  const [empresasOptions, setEmpresasOptions] = useState<EmpresaOption[]>([]);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const hasFilters =
    !!filtroContratoId ||
    !!filtroEmpresaId ||
    !!filtroStatus ||
    !!filtroDataInicio ||
    !!filtroDataFim;

  const tdCompact: React.CSSProperties = {
    ...tableStyles.td,
    paddingTop: 10,
    paddingBottom: 10,
    lineHeight: 1.2,
    verticalAlign: "middle",
  };

  const tdCompactCenter: React.CSSProperties = {
    ...tdCompact,
    textAlign: "center",
  };

  const tdCompactRight: React.CSSProperties = {
    ...tdCompact,
    textAlign: "right",
    paddingRight: 10,
  };

  const contratoCellStyle: React.CSSProperties = {
    ...tdCompact,
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    lineHeight: 1.28,
  };

  const resumoCellStyle: React.CSSProperties = {
    ...tdCompact,
    whiteSpace: "normal",
    lineHeight: 1.3,
  };

  const resumoLabelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.35,
    marginBottom: 3,
  };

  const resumoValueStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
  };

  const fluxoWrapStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    flexWrap: "nowrap",
    alignItems: "center",
  };

  const actionsWrapStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    flexWrap: "nowrap",
    alignItems: "center",
  };

  const contratosMap = useMemo(() => {
    const m = new Map<number, ContratoOption>();
    for (const c of contratosOptions) m.set(Number(c.id), c);
    return m;
  }, [contratosOptions]);


  async function emitirRelatorioPedido(id: number) {
    try {
      const res = await api.get(`/pedidosvenda/${id}/relatorio-operacional`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // abre em nova aba
      window.open(url, "_blank", "noopener,noreferrer");

      // libera memória depois de um tempo
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    }
  }

  async function loadCombos() {
    try {
      const [resContratos, resEmpresas] = await Promise.all([
        api.get("/contratos", { params: { page: 1, limit: 500 } }),
        api.get("/empresas", { params: { page: 1, limit: 500 } }),
      ]);

      const contratos = (resContratos.data?.data ?? resContratos.data?.rows ?? []).map(
        (c: any) => ({
          id: c.id,
          numero: c.numero,
          orgaoNome: c.orgao?.nome ?? "",
        })
      );
      setContratosOptions(contratos);

      const empresas = (resEmpresas.data?.data ?? resEmpresas.data?.rows ?? []).map(
        (e: any) => ({
          id: e.id,
          nome: e.razao_social ?? e.nome_fantasia ?? `Empresa #${e.id}`,
        })
      );
      setEmpresasOptions(empresas);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar filtros (contratos/empresas)");
    }
  }

  async function carregarPedidos() {
    setLoading(true);

    const params: any = {
      page,
      limit,
      sort: orderBy,
      order: orderDir,
      orderBy,
      orderDir,
    };

    if (filtroContratoId) params.contrato_id = Number(filtroContratoId);
    if (filtroEmpresaId) params.empresa_contratada_id = Number(filtroEmpresaId);
    if (filtroStatus) params.status = filtroStatus;
    if (filtroDataInicio) params.data_inicio = filtroDataInicio;
    if (filtroDataFim) params.data_fim = filtroDataFim;

    try {
      const res = await api.get("/pedidosvenda", { params });

      const { data, total } = pickListResponse(res.data);
      setRows(data);
      setTotal(total);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar pedidos de venda");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCombos();
    carregarPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      carregarPedidos();
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filtroContratoId,
    filtroEmpresaId,
    filtroStatus,
    filtroDataInicio,
    filtroDataFim,
    orderBy,
    orderDir,
  ]);

  useEffect(() => {
    carregarPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleSort(coluna: "id" | "data" | "status" | "contrato_id") {
    if (orderBy === coluna) {
      setOrderDir((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setOrderBy(coluna);
      setOrderDir("ASC");
    }
  }

  function calcTotalLiquido(row: any): number | null {
    if (row?.total_liquido !== undefined && row?.total_liquido !== null) {
      return toNumberSafe(row.total_liquido);
    }
    return null;
  }

  async function excluirPedido(pedido: any) {
    const id = Number(pedido?.id);
    if (!id) return;

    const contratoIdNum = Number(pedido?.contrato_id);
    const cOpt = contratosMap.get(contratoIdNum);
    const numeroContrato = cOpt
      ? `${cOpt.numero}${cOpt.orgaoNome ? ` — ${cOpt.orgaoNome}` : ""}`
      : `Contrato #${contratoIdNum || "-"}`;
    const dataStr = formatDateBR(pedido?.data);

    const ok = window.confirm(
      `Excluir o pedido #${id}?\n${numeroContrato}\nData: ${dataStr}\n\nEssa ação não pode ser desfeita.`
    );
    if (!ok) return;

    setDeletingId(id);

    try {
      await api.delete(`/pedidosvenda/${id}`);
      toast.success("Pedido excluído com sucesso!");

      const willBeEmpty = rows.length === 1 && page > 1;
      if (willBeEmpty) setPage((p) => p - 1);
      else await carregarPedidos();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao excluir pedido");
    } finally {
      setDeletingId(null);
    }
  }

  async function aprovarPedido(id: number) {
    const ok = window.confirm(
      `Processar aprovação do pedido #${id}?\n\nO backend irá validar contrato, margem e reserva de estoque.`
    );
    if (!ok) return;

    setActingId(id);

    try {
      await api.post(`/pedidosvenda/${id}/aprovar`);
      toast.success("Pedido processado com sucesso!");
      await carregarPedidos();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao aprovar pedido");
    } finally {
      setActingId(null);
    }
  }

  async function concluirPedido(id: number) {
    const ok = window.confirm(
      `Concluir o pedido #${id}?\n\nEssa ação encerra o pedido após o atendimento total.`
    );
    if (!ok) return;

    setActingId(id);

    try {
      await api.post(`/pedidosvenda/${id}/concluir`);
      toast.success("Pedido concluído!");
      await carregarPedidos();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao concluir pedido");
    } finally {
      setActingId(null);
    }
  }

  async function cancelarPedido(id: number) {
    const motivo = (window.prompt("Motivo do cancelamento (opcional):") ?? "").trim();
    const ok = window.confirm(
      `Cancelar o pedido #${id}?\n\nO backend irá reverter reservas e saldos, quando aplicável.${motivo ? `\n\nMotivo: ${motivo}` : ""
      }`
    );
    if (!ok) return;

    setActingId(id);

    try {
      await api.post(`/pedidosvenda/${id}/cancelar`, motivo ? { motivo } : undefined);
      toast.success("Pedido cancelado!");
      await carregarPedidos();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao cancelar pedido");
    } finally {
      setActingId(null);
    }
  }

  async function devolverPedido(id: number) {
    const motivo = (window.prompt("Motivo da devolução (opcional):") ?? "").trim();
    const ok = window.confirm(
      `Registrar devolução do pedido #${id}?\n\nO backend irá tratar a devolução do estoque.${motivo ? `\n\nMotivo: ${motivo}` : ""
      }`
    );
    if (!ok) return;

    setActingId(id);

    try {
      await api.post(`/pedidosvenda/${id}/devolver`, motivo ? { motivo } : undefined);
      toast.success("Devolução registrada!");
      await carregarPedidos();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao registrar devolução");
    } finally {
      setActingId(null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Pedidos de Venda</h1>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          {total} pedido(s) encontrado(s)
        </div>
      </div>

      <div style={layoutStyles.cardCompact}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                Contrato (Número - Órgão)
              </label>
              <select
                value={filtroContratoId}
                onChange={(e) => setFiltroContratoId(e.target.value)}
                style={{
                  ...filterStyles.select,
                  height: 36,
                  padding: "0 12px",
                  boxSizing: "border-box",
                  width: "100%",
                }}
                disabled={loading || deletingId !== null || actingId !== null}
              >
                <option value="">Todos</option>
                {contratosOptions.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.numero} {c.orgaoNome ? `- ${c.orgaoNome}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 320 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                Empresa
              </label>
              <select
                value={filtroEmpresaId}
                onChange={(e) => setFiltroEmpresaId(e.target.value)}
                style={{
                  ...filterStyles.select,
                  height: 36,
                  padding: "0 12px",
                  boxSizing: "border-box",
                  width: "100%",
                }}
                disabled={loading || deletingId !== null || actingId !== null}
              >
                <option value="">Todas</option>
                {empresasOptions.map((e) => (
                  <option key={e.id} value={String(e.id)}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 240 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                style={{
                  ...filterStyles.select,
                  height: 36,
                  padding: "0 12px",
                  boxSizing: "border-box",
                  width: "100%",
                }}
                disabled={loading || deletingId !== null || actingId !== null}
              >
                <option value="">Todos</option>
                <option value="RASCUNHO">Rascunho</option>
                <option value="APROVADO">Aprovado</option>
                <option value="PARCIALMENTE_ATENDIDO">Parcialmente Atendido</option>
                <option value="ATENDIDO">Atendido</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="DEVOLVIDO">Devolvido</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 180 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>De</label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                style={{
                  ...filterStyles.input,
                  height: 36,
                  padding: "0 12px",
                  boxSizing: "border-box",
                  width: "100%",
                }}
                disabled={loading || deletingId !== null || actingId !== null}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 180 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Até</label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                style={{
                  ...filterStyles.input,
                  height: 36,
                  padding: "0 12px",
                  boxSizing: "border-box",
                  width: "100%",
                }}
                disabled={loading || deletingId !== null || actingId !== null}
              />
            </div>

            <div style={{ flex: 1 }} />

            {hasFilters && (
              <button
                style={{ ...buttonStyles.link, marginBottom: 2 }}
                onClick={() => {
                  setFiltroContratoId("");
                  setFiltroEmpresaId("");
                  setFiltroStatus("");
                  setFiltroDataInicio("");
                  setFiltroDataFim("");
                }}
                disabled={loading || deletingId !== null || actingId !== null}
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, margin: "12px 0 16px" }}>
        <button
          style={buttonStyles.link}
          onClick={() => navigate(-1)}
          disabled={loading || deletingId !== null || actingId !== null}
        >
          Voltar
        </button>

        <button
          style={buttonStyles.primary}
          onClick={() => navigate("/pedidosvenda/novo")}
          disabled={loading || deletingId !== null || actingId !== null}
        >
          + Novo Pedido
        </button>
      </div>

      <div style={layoutStyles.card}>
        <div
          style={{
            paddingBottom: 12,
            fontSize: 13,
            color: "#64748b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span>
            {loading ? "Atualizando lista..." : `Exibindo ${rows.length} de ${total} registro(s)`}
          </span>
          {!loading && (
            <span style={{ fontWeight: 600, color: "#475569" }}>
              Visual executivo dos pedidos
            </span>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ ...tableStyles.table, tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th
                  style={{ ...tableStyles.th, width: "48%", cursor: "pointer" }}
                  onClick={() => handleSort("contrato_id")}
                >
                  Contrato {orderBy === "contrato_id" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th
                  style={{ ...tableStyles.th, width: 220, cursor: "pointer" }}
                  onClick={() => handleSort("data")}
                >
                  Resumo {orderBy === "data" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th
                  style={{ ...tableStyles.th, width: 150, textAlign: "right" }}
                >
                  Total
                </th>

                <th style={{ ...tableStyles.th, width: 230, textAlign: "center" }}>Fluxo</th>

                <th style={{ ...tableStyles.th, width: 150, textAlign: "center" }}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}

              {rows.map((r: any, index) => {
                const totalCalc = calcTotalFromItens(r);
                const totalLiquidoCalc = calcTotalLiquido(r);
                const isDeleting = deletingId === Number(r.id);
                const isActing = actingId === Number(r.id);
                const statusVisual = getStatusVisualPedido(r);
                const perms = flowPerms(statusVisual);

                const contratoIdNum = Number(r?.contrato_id);
                const cOpt = contratosMap.get(contratoIdNum);

                const contratoNumero = cOpt?.numero ?? `#${contratoIdNum || "-"}`;
                const orgaoNome = cOpt?.orgaoNome ?? "-";

                return (
                  <tr
                    key={r.id}
                    style={{
                      background: index % 2 === 0 ? "#fff" : "#f8fafc",
                      opacity: isDeleting || isActing ? 0.65 : 1,
                      transition: "all .15s ease",
                    }}
                  >
                    <td style={contratoCellStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13 }}>
                          Nº do Contrato: {contratoNumero}
                        </div>

                        <div style={{ color: "#475569", fontSize: 12 }}>
                          Órgão: {orgaoNome}
                        </div>

                        <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700 }}>
                          Pedido #{r.id}
                        </div>
                      </div>
                    </td>

                    <td style={resumoCellStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>
                          <div style={resumoLabelStyle}>Data</div>
                          <div style={resumoValueStyle}>{formatDateBR(r.data)}</div>
                        </div>

                        <div>
                          <div style={resumoLabelStyle}>Status</div>
                          <div>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 800,
                                display: "inline-block",
                                ...statusStyle(statusVisual),
                              }}
                            >
                              {statusVisual || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tdCompactRight}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          alignItems: "flex-end",
                        }}
                      >
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: 0.35,
                              marginBottom: 2,
                            }}
                          >
                            Total do Pedido
                          </div>

                          <div
                            style={{
                              fontSize: 17,
                              fontWeight: 900,
                              color: "#0f172a",
                              lineHeight: 1.1,
                            }}
                          >
                            {totalCalc === null ? (
                              <span style={{ color: "#94a3b8", fontSize: 14 }}>-</span>
                            ) : (
                              formatMoneyBR(totalCalc)
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            textAlign: "right",
                            paddingTop: 6,
                            borderTop: "1px solid #e5e7eb",
                            width: "100%",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: 0.35,
                              marginBottom: 2,
                            }}
                          >
                            Total Líquido
                          </div>

                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 900,
                              color:
                                totalLiquidoCalc !== null &&
                                  totalCalc !== null &&
                                  totalLiquidoCalc < totalCalc
                                  ? "#9a3412"
                                  : "#166534",
                              lineHeight: 1.1,
                            }}
                          >
                            {totalLiquidoCalc === null ? (
                              <span style={{ color: "#94a3b8", fontSize: 14 }}>-</span>
                            ) : (
                              formatMoneyBR(totalLiquidoCalc)
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={tdCompactCenter}>
                      <div style={fluxoWrapStyle}>
                        <button
                          style={{ ...buttonStyles.icon, opacity: perms.canAprovar ? 1 : 0.35 }}
                          onClick={() => aprovarPedido(Number(r.id))}
                          disabled={
                            !perms.canAprovar ||
                            loading ||
                            isDeleting ||
                            isActing ||
                            deletingId !== null ||
                            actingId !== null
                          }
                          title={
                            perms.canAprovar
                              ? "Processar aprovação / reserva"
                              : "Disponível apenas em RASCUNHO / APROVADO / PARCIALMENTE_ATENDIDO"
                          }
                        >
                          <FiCheckCircle size={18} color="#1e40af" />
                        </button>

                        <button
                          style={{ ...buttonStyles.icon, opacity: perms.canBaixar ? 1 : 0.35 }}
                          onClick={() => navigate(`/pedidosvenda/${r.id}/editar`)}
                          disabled={
                            !perms.canBaixar ||
                            loading ||
                            isDeleting ||
                            isActing ||
                            deletingId !== null ||
                            actingId !== null
                          }
                          title={
                            perms.canBaixar
                              ? "Gerenciar baixas dos itens"
                              : "Disponível apenas em APROVADO / PARCIALMENTE_ATENDIDO"
                          }
                        >
                          <FiSend size={18} color="#075985" />
                        </button>

                        <button
                          style={{ ...buttonStyles.icon, opacity: perms.canConcluir ? 1 : 0.35 }}
                          onClick={() => concluirPedido(Number(r.id))}
                          disabled={
                            !perms.canConcluir ||
                            loading ||
                            isDeleting ||
                            isActing ||
                            deletingId !== null ||
                            actingId !== null
                          }
                          title={
                            perms.canConcluir
                              ? "Concluir pedido"
                              : "Disponível apenas em ATENDIDO"
                          }
                        >
                          <FiLock size={18} color="#166534" />
                        </button>

                        <button
                          style={{ ...buttonStyles.icon, opacity: perms.canCancelar ? 1 : 0.35 }}
                          onClick={() => cancelarPedido(Number(r.id))}
                          disabled={
                            !perms.canCancelar ||
                            loading ||
                            isDeleting ||
                            isActing ||
                            deletingId !== null ||
                            actingId !== null
                          }
                          title={
                            perms.canCancelar
                              ? "Cancelar pedido"
                              : "Não permitido nesse status"
                          }
                        >
                          <FiXCircle size={18} color="#991b1b" />
                        </button>

                        <button
                          style={{ ...buttonStyles.icon, opacity: perms.canDevolver ? 1 : 0.35 }}
                          onClick={() => devolverPedido(Number(r.id))}
                          disabled={
                            !perms.canDevolver ||
                            loading ||
                            isDeleting ||
                            isActing ||
                            deletingId !== null ||
                            actingId !== null
                          }
                          title={
                            perms.canDevolver
                              ? "Devolver pedido"
                              : "Disponível apenas após atendimento/conclusão"
                          }
                        >
                          <FiCornerUpLeft size={18} color="#854d0e" />
                        </button>
                      </div>
                    </td>

                    <td style={tdCompactCenter}>
                      <div style={actionsWrapStyle}>
                        <button
                          style={{ ...buttonStyles.icon, opacity: perms.canOpen ? 1 : 0.55 }}
                          onClick={() => navigate(`/pedidosvenda/${r.id}/editar`)}
                          disabled={
                            !perms.canOpen ||
                            loading ||
                            isDeleting ||
                            isActing ||
                            deletingId !== null ||
                            actingId !== null
                          }
                          title={perms.canOpen ? "Abrir pedido" : "Pedido indisponível para abertura"}
                        >
                          <FiEdit size={18} color="#2563eb" />
                        </button>

                        <button
                          style={buttonStyles.icon}
                          //onClick={() => emitirRelatorioPedido(Number(r.id))}
                          onClick={() => emitirRelatorioPedido(r.id)}
                          disabled={
                            loading ||
                            isDeleting ||
                            isActing ||
                            deletingId !== null ||
                            actingId !== null
                          }
                          title="Emitir relatório do pedido"
                        >
                          <FiFileText size={18} color="#7c3aed" />
                        </button>

                        <button
                          style={buttonStyles.icon}
                          onClick={() => excluirPedido(r)}
                          disabled={
                            loading ||
                            isDeleting ||
                            isActing ||
                            deletingId !== null ||
                            actingId !== null
                          }
                          title="Excluir pedido"
                        >
                          <FiTrash2 size={18} color="#dc2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Carregando registros...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              marginTop: 16,
            }}
          >
            <button
              disabled={loading || page === 1 || deletingId !== null || actingId !== null}
              onClick={() => setPage((prev) => prev - 1)}
              style={buttonStyles.paginationButtonStyle(
                loading || page === 1 || deletingId !== null || actingId !== null
              )}
            >
              <FiChevronLeft size={20} />
            </button>

            <span style={{ fontWeight: 700, color: "#334155" }}>
              Página {page} de {totalPages}
            </span>

            <button
              disabled={
                loading ||
                page >= totalPages ||
                deletingId !== null ||
                actingId !== null
              }
              onClick={() => setPage((prev) => prev + 1)}
              style={buttonStyles.paginationButtonStyle(
                loading || page >= totalPages || deletingId !== null || actingId !== null
              )}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}