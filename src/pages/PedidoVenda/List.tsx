import { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import type { PedidoVenda, PedidoVendaStatus } from "../../types/PedidoVenda";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiRefreshCw,
  FiTrash2,
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
    return { data: resData.data, total: Number(resData.total ?? resData.count ?? 0) || 0 };
  }
  if (Array.isArray(resData?.data?.data)) {
    return { data: resData.data.data, total: Number(resData.data.total ?? resData.data.count ?? 0) || 0 };
  }
  if (Array.isArray(resData?.data?.rows)) {
    return { data: resData.data.rows, total: Number(resData.data.count ?? 0) || 0 };
  }
  if (Array.isArray(resData?.rows)) {
    return { data: resData.rows, total: Number(resData.count ?? 0) || 0 };
  }
  if (Array.isArray(resData?.items)) {
    return { data: resData.items, total: Number(resData.total ?? 0) || 0 };
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
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcTotalFromItens(row: any): number | null {
  if (row?.total !== undefined && row?.total !== null) return toNumberSafe(row.total);

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

export default function PedidoVendaList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<PedidoVenda[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [filtroContratoId, setFiltroContratoId] = useState("");
  const [filtroEmpresaId, setFiltroEmpresaId] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // ordenação
  const [orderBy, setOrderBy] = useState<"id" | "data" | "status" | "contrato_id">("id");
  const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("DESC");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [contratosOptions, setContratosOptions] = useState<ContratoOption[]>([]);
  const [empresasOptions, setEmpresasOptions] = useState<EmpresaOption[]>([]);

  // ===== Modal Status =====
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusPedidoId, setStatusPedidoId] = useState<number | null>(null);
  const [novoStatus, setNovoStatus] = useState<PedidoVendaStatus>("RASCUNHO");
  const [savingStatus, setSavingStatus] = useState(false);

  // ✅ exclusão
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const hasFilters =
    !!filtroContratoId ||
    !!filtroEmpresaId ||
    !!filtroStatus ||
    !!filtroDataInicio ||
    !!filtroDataFim;

  async function loadCombos() {
    try {
      const [resContratos, resEmpresas] = await Promise.all([
        api.get("/contratos", { params: { page: 1, limit: 500 } }),
        api.get("/empresas", { params: { page: 1, limit: 500 } }),
      ]);

      const contratos = (resContratos.data?.data ?? resContratos.data?.rows ?? []).map((c: any) => ({
        id: c.id,
        numero: c.numero,
        orgaoNome: c.orgao?.nome ?? "",
      }));
      setContratosOptions(contratos);

      const empresas = (resEmpresas.data?.data ?? resEmpresas.data?.rows ?? []).map((e: any) => ({
        id: e.id,
        nome: e.razao_social ?? e.nome_fantasia ?? `Empresa #${e.id}`,
      }));
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
  }, [filtroContratoId, filtroEmpresaId, filtroStatus, filtroDataInicio, filtroDataFim, orderBy, orderDir]);

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

  function statusStyle(status: PedidoVendaStatus) {
    if (status === "ATENDIDO") return { background: "#dcfce7", color: "#166534" };
    if (status === "APROVADO") return { background: "#dbeafe", color: "#1e40af" };
    if (status === "CANCELADO") return { background: "#fee2e2", color: "#991b1b" };
    return { background: "#fef9c3", color: "#854d0e" };
  }

  function abrirModalStatus(pedido: any) {
    setStatusPedidoId(pedido.id);
    setNovoStatus((pedido.status as PedidoVendaStatus) || "RASCUNHO");
    setStatusModalOpen(true);
  }

  async function salvarStatus() {
    if (!statusPedidoId) return;
    setSavingStatus(true);
    try {
      await api.put(`/pedidosvenda/${statusPedidoId}`, { status: novoStatus });
      toast.success("Status atualizado!");
      setStatusModalOpen(false);
      await carregarPedidos();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao atualizar status");
    } finally {
      setSavingStatus(false);
    }
  }

  // ✅ excluir pedido
  async function excluirPedido(pedido: any) {
    const id = Number(pedido?.id);
    if (!id) return;

    const numeroContrato = pedido?.contrato?.numero ? `Contrato ${pedido.contrato.numero}` : `Contrato #${pedido?.contrato_id ?? "-"}`;
    const dataStr = formatDateBR(pedido?.data);

    const ok = window.confirm(
      `Excluir o pedido #${id}?\n${numeroContrato}\nData: ${dataStr}\n\nEssa ação não pode ser desfeita.`
    );
    if (!ok) return;

    setDeletingId(id);
    try {
      await api.delete(`/pedidosvenda/${id}`);
      toast.success("Pedido excluído com sucesso!");

      // ✅ se era o último da página, volta 1 página
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

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Pedidos de Venda</h1>
        <div style={{ fontSize: 13, color: "#64748b" }}>{total} pedido(s) encontrado(s)</div>
      </div>

      {/* FILTROS (2 linhas) */}
      <div style={layoutStyles.cardCompact}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          {/* Linha 1 */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Contrato (Número - Órgão)</label>
              <select
                value={filtroContratoId}
                onChange={(e) => setFiltroContratoId(e.target.value)}
                style={{ ...filterStyles.select, height: 36, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
                disabled={loading || deletingId !== null}
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
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Empresa</label>
              <select
                value={filtroEmpresaId}
                onChange={(e) => setFiltroEmpresaId(e.target.value)}
                style={{ ...filterStyles.select, height: 36, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
                disabled={loading || deletingId !== null}
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

          {/* Linha 2 */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                style={{ ...filterStyles.select, height: 36, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
                disabled={loading || deletingId !== null}
              >
                <option value="">Todos</option>
                <option value="RASCUNHO">Rascunho</option>
                <option value="APROVADO">Aprovado</option>
                <option value="ATENDIDO">Atendido</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 180 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>De</label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                style={{ ...filterStyles.input, height: 36, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
                disabled={loading || deletingId !== null}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 180 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Até</label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                style={{ ...filterStyles.input, height: 36, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
                disabled={loading || deletingId !== null}
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
                disabled={loading || deletingId !== null}
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BOTÕES */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, margin: "12px 0 16px" }}>
        <button style={buttonStyles.link} onClick={() => navigate(-1)} disabled={loading || deletingId !== null}>
          Voltar
        </button>
        <button style={buttonStyles.primary} onClick={() => navigate("/pedidosvenda/novo")} disabled={loading || deletingId !== null}>
          + Novo Pedido
        </button>
      </div>

      {/* TABELA */}
      <div style={layoutStyles.card}>
        <div style={{ paddingBottom: 12, fontSize: 13, color: "#64748b" }}>
          {loading ? "Atualizando lista..." : `Exibindo ${rows.length} de ${total} registro(s)`}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ ...tableStyles.table, tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ ...tableStyles.th, width: 70, cursor: "pointer" }} onClick={() => handleSort("id")}>
                  ID {orderBy === "id" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th style={{ ...tableStyles.th, width: 130, cursor: "pointer" }} onClick={() => handleSort("data")}>
                  Data {orderBy === "data" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th style={{ ...tableStyles.th, width: "35%", cursor: "pointer" }} onClick={() => handleSort("contrato_id")}>
                  Contrato {orderBy === "contrato_id" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th style={{ ...tableStyles.th, width: 170, textAlign: "right" }}>Total</th>

                <th style={{ ...tableStyles.th, width: 150, cursor: "pointer" }} onClick={() => handleSort("status")}>
                  Status {orderBy === "status" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th style={{ ...tableStyles.th, width: 140, textAlign: "center" }}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}

              {rows.map((r: any, index) => {
                const totalCalc = calcTotalFromItens(r);
                const isDeleting = deletingId === Number(r.id);

                return (
                  <tr key={r.id} style={{ background: index % 2 === 0 ? "#fff" : "#f9fafb", opacity: isDeleting ? 0.6 : 1 }}>
                    <td style={tableStyles.td}>{r.id}</td>

                    <td style={tableStyles.td}>{formatDateBR(r.data)}</td>

                    <td style={{ ...tableStyles.td, whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.4 }}>
                      <div>
                        <span style={{ color: "#9ca3af", fontSize: 12 }}>Contrato: </span>
                        {r.contrato?.numero ? r.contrato.numero : `#${r.contrato_id}`}
                      </div>
                      {r.contrato?.orgao?.nome && (
                        <div style={{ marginTop: 2 }}>
                          <span style={{ color: "#9ca3af", fontSize: 12 }}>Órgão: </span>
                          {r.contrato.orgao.nome}
                        </div>
                      )}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                      {totalCalc === null ? <span style={{ color: "#94a3b8" }}>-</span> : formatMoneyBR(totalCalc)}
                    </td>

                    <td style={tableStyles.td}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          display: "inline-block",
                          ...statusStyle(r.status),
                        }}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                        <button
                          style={buttonStyles.icon}
                          onClick={() => navigate(`/pedidosvenda/${r.id}/editar`)}
                          disabled={loading || isDeleting || deletingId !== null}
                          title="Editar"
                        >
                          <FiEdit size={18} color="#2563eb" />
                        </button>

                        <button
                          style={buttonStyles.icon}
                          onClick={() => abrirModalStatus(r)}
                          disabled={loading || isDeleting || deletingId !== null}
                          title="Alterar status"
                        >
                          <FiRefreshCw size={18} color="#0f766e" />
                        </button>

                        {/* ✅ excluir */}
                        <button
                          style={buttonStyles.icon}
                          onClick={() => excluirPedido(r)}
                          disabled={loading || isDeleting || deletingId !== null}
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
                  <td colSpan={6} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Carregando registros...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
            <button
              disabled={loading || page === 1 || deletingId !== null}
              onClick={() => setPage((prev) => prev - 1)}
              style={buttonStyles.paginationButtonStyle(loading || page === 1 || deletingId !== null)}
            >
              <FiChevronLeft size={20} />
            </button>

            <span style={{ fontWeight: 600 }}>
              Página {page} de {totalPages}
            </span>

            <button
              disabled={loading || page >= totalPages || deletingId !== null}
              onClick={() => setPage((prev) => prev + 1)}
              style={buttonStyles.paginationButtonStyle(loading || page >= totalPages || deletingId !== null)}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* ===== MODAL STATUS ===== */}
      {statusModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
          onClick={() => !savingStatus && setStatusModalOpen(false)}
        >
          <div
            style={{
              width: 420,
              maxWidth: "100%",
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 20px 45px rgba(0,0,0,0.18)",
              padding: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
              Alterar status do pedido #{statusPedidoId}
            </div>

            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Status</label>
              <select
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value as PedidoVendaStatus)}
                style={{ ...filterStyles.select, height: 38, padding: "0 12px" }}
                disabled={savingStatus}
              >
                <option value="RASCUNHO">Rascunho</option>
                <option value="APROVADO">Aprovado</option>
                <option value="ATENDIDO">Atendido</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button style={buttonStyles.link} onClick={() => setStatusModalOpen(false)} disabled={savingStatus}>
                Cancelar
              </button>

              <button
                style={{ ...buttonStyles.primary, height: 38, padding: "0 14px" }}
                onClick={salvarStatus}
                disabled={savingStatus || !statusPedidoId}
              >
                {savingStatus ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}