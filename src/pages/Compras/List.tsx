import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiTrash2,
  FiPackage,
  FiXCircle,
} from "react-icons/fi";

type CompraStatus =
  | "ABERTA"
  | "PARCIALMENTE_RECEBIDA"
  | "RECEBIDA"
  | "CANCELADA";

type CompraRow = {
  id: number;
  fornecedor_id?: number | null;
  data_pedido?: string;
  status?: CompraStatus;
  observacao?: string | null;
  valor_total?: string | number | null;
  valor_frete?: string | number | null;
  valor_desconto?: string | number | null;

  fornecedor?: {
    id: number;
    nome?: string;
    razao_social?: string;
    nome_fantasia?: string;
  };
  Fornecedor?: {
    id: number;
    nome?: string;
    razao_social?: string;
    nome_fantasia?: string;
  };

  itens?: any[];
  CompraItems?: any[];
};

type FornecedorOption = {
  id: number;
  nome: string;
};

function parseDecimalApi(v: any): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  const s = String(v).trim().replace(/\s/g, "").replace("R$", "");

  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  if (/^-?\d{1,3}(\.\d{3})*,\d+$/.test(s)) {
    const n = Number(s.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  if (/^-?\d+,\d+$/.test(s)) {
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

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
  const s = String(value).trim();
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

function formatMoneyBR(v: any): string {
  const n = typeof v === "number" ? v : parseDecimalApi(v);
  if (!Number.isFinite(n)) return "-";

  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getTotalCompra(row: any): number | null {
  if (
    row?.valor_total !== undefined &&
    row?.valor_total !== null &&
    row?.valor_total !== ""
  ) {
    return parseDecimalApi(row.valor_total);
  }

  return null;
}

function getResumoRecebimento(row: any) {
  const itens = row?.itens ?? row?.CompraItems ?? [];
  if (!Array.isArray(itens) || itens.length === 0) {
    return {
      totalQtd: 0,
      totalRecebido: 0,
      percentual: 0,
    };
  }

  let totalQtd = 0;
  let totalRecebido = 0;

  for (const it of itens) {
    totalQtd += parseDecimalApi(it?.qtd);
    totalRecebido += parseDecimalApi(it?.recebido_qtd);
  }

  const percentual =
    totalQtd > 0 ? Math.min(100, (totalRecebido / totalQtd) * 100) : 0;

  return {
    totalQtd,
    totalRecebido,
    percentual,
  };
}

function formatQtyBR(v: any): string {
  const n = typeof v === "number" ? v : parseDecimalApi(v);
  if (!Number.isFinite(n)) return "0,000";

  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export default function ComprasList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<CompraRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroFornecedorId, setFiltroFornecedorId] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  const [orderBy, setOrderBy] = useState<
    "id" | "data_pedido" | "status" | "fornecedor_id"
  >("id");
  const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("DESC");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [fornecedoresOptions, setFornecedoresOptions] = useState<
    FornecedorOption[]
  >([]);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const hasFilters =
    !!filtroFornecedorId ||
    !!filtroStatus ||
    !!filtroDataInicio ||
    !!filtroDataFim;

  const tdCompact: React.CSSProperties = {
    ...tableStyles.td,
    paddingTop: 8,
    paddingBottom: 8,
    lineHeight: 1.15,
    verticalAlign: "middle",
  };

  const tdCompactRight: React.CSSProperties = {
    ...tdCompact,
    textAlign: "right",
    paddingRight: 8,
  };

  const tdCompactCenter: React.CSSProperties = {
    ...tdCompact,
    textAlign: "center",
  };

  const fornecedoresMap = useMemo(() => {
    const m = new Map<number, FornecedorOption>();
    for (const f of fornecedoresOptions) m.set(Number(f.id), f);
    return m;
  }, [fornecedoresOptions]);

  async function loadFornecedores() {
    try {
      const res = await api.get("/fornecedores", {
        params: { page: 1, limit: 1000 },
      });

      const arr = (
        res.data?.data ??
        res.data?.rows ??
        res.data?.items ??
        []
      ).map((f: any) => ({
        id: Number(f.id),
        nome:
          f.nome ?? f.razao_social ?? f.nome_fantasia ?? `Fornecedor #${f.id}`,
      }));

      setFornecedoresOptions(arr);
    } catch (err) {
      console.warn(
        "Sem /fornecedores? Ajuste loadFornecedores() para seu endpoint.",
        err
      );
    }
  }

  async function carregarCompras() {
    setLoading(true);

    const params: any = {
      page,
      limit,
      sort: orderBy,
      order: orderDir,
      orderBy,
      orderDir,
    };

    if (filtroFornecedorId) params.fornecedor_id = Number(filtroFornecedorId);
    if (filtroStatus) params.status = filtroStatus;
    if (filtroDataInicio) params.data_inicio = filtroDataInicio;
    if (filtroDataFim) params.data_fim = filtroDataFim;

    try {
      const res = await api.get("/compras", { params });
      const { data, total } = pickListResponse(res.data);
      setRows(data);
      setTotal(total);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar compras");
    } finally {
      setLoading(false);
    }
  }

  async function excluirCompra(row: any) {
    const id = Number(row?.id);
    if (!id) return;

    const fornecedorId = Number(row?.fornecedor_id);
    const fornecedorNome =
      row?.fornecedor?.nome ??
      row?.Fornecedor?.nome ??
      fornecedoresMap.get(fornecedorId)?.nome ??
      (fornecedorId ? `Fornecedor #${fornecedorId}` : "-");

    const ok = window.confirm(
      `Excluir a compra #${id}?\nFornecedor: ${fornecedorNome}\n\nEssa ação não pode ser desfeita.`
    );
    if (!ok) return;

    setDeletingId(id);
    try {
      await api.delete(`/compras/${id}`);
      toast.success("Compra excluída!");

      const willBeEmpty = rows.length === 1 && page > 1;
      if (willBeEmpty) setPage((p) => p - 1);
      else await carregarCompras();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao excluir compra");
    } finally {
      setDeletingId(null);
    }
  }

  async function cancelarCompra(row: any) {
    const id = Number(row?.id);
    if (!id) return;

    const fornecedorId = Number(row?.fornecedor_id);
    const fornecedorNome =
      row?.fornecedor?.nome ??
      row?.Fornecedor?.nome ??
      fornecedoresMap.get(fornecedorId)?.nome ??
      (fornecedorId ? `Fornecedor #${fornecedorId}` : "-");

    const ok = window.confirm(
      `Cancelar a compra #${id}?\nFornecedor: ${fornecedorNome}`
    );
    if (!ok) return;

    try {
      await api.post(`/compras/${id}/cancelar`, {});
      toast.success("Compra cancelada!");
      await carregarCompras();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao cancelar compra");
    }
  }

  useEffect(() => {
    loadFornecedores();
    carregarCompras();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      carregarCompras();
    }, 400);

    return () => clearTimeout(t);
  }, [
    filtroFornecedorId,
    filtroStatus,
    filtroDataInicio,
    filtroDataFim,
    orderBy,
    orderDir,
  ]);

  useEffect(() => {
    carregarCompras();
  }, [page]);

  function handleSort(
    coluna: "id" | "data_pedido" | "status" | "fornecedor_id"
  ) {
    if (orderBy === coluna) {
      setOrderDir((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setOrderBy(coluna);
      setOrderDir("ASC");
    }
  }

  function statusStyle(status: any) {
    const s = String(status || "").toUpperCase();

    if (s === "RECEBIDA") {
      return { background: "#dcfce7", color: "#166534" };
    }

    if (s === "PARCIALMENTE_RECEBIDA") {
      return { background: "#fef3c7", color: "#92400e" };
    }

    if (s === "CANCELADA") {
      return { background: "#fee2e2", color: "#991b1b" };
    }

    return { background: "#dbeafe", color: "#1e40af" };
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Compras</h1>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          {total} compra(s) encontrada(s)
        </div>
      </div>

      <div style={layoutStyles.cardCompact}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 320,
                flex: 1,
              }}
            >
              <label
                style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}
              >
                Fornecedor
              </label>
              <select
                value={filtroFornecedorId}
                onChange={(e) => setFiltroFornecedorId(e.target.value)}
                style={{
                  ...filterStyles.select,
                  height: 36,
                  padding: "0 12px",
                }}
                disabled={loading || deletingId !== null}
              >
                <option value="">Todos</option>
                {fornecedoresOptions.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                width: 220,
              }}
            >
              <label
                style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}
              >
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                style={{
                  ...filterStyles.select,
                  height: 36,
                  padding: "0 12px",
                }}
                disabled={loading || deletingId !== null}
              >
                <option value="">Todos</option>
                <option value="ABERTA">Aberta</option>
                <option value="PARCIALMENTE_RECEBIDA">
                  Parcialmente recebida
                </option>
                <option value="RECEBIDA">Recebida</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                width: 180,
              }}
            >
              <label
                style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}
              >
                De
              </label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                style={{
                  ...filterStyles.input,
                  height: 36,
                  padding: "0 12px",
                }}
                disabled={loading || deletingId !== null}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                width: 180,
              }}
            >
              <label
                style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}
              >
                Até
              </label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                style={{
                  ...filterStyles.input,
                  height: 36,
                  padding: "0 12px",
                }}
                disabled={loading || deletingId !== null}
              />
            </div>

            <div style={{ flex: 1 }} />

            {hasFilters && (
              <button
                style={{ ...buttonStyles.link, marginBottom: 2 }}
                onClick={() => {
                  setFiltroFornecedorId("");
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

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          margin: "12px 0 16px",
        }}
      >
        <button
          style={buttonStyles.link}
          onClick={() => navigate(-1)}
          disabled={loading || deletingId !== null}
        >
          Voltar
        </button>
        <button
          style={buttonStyles.primary}
          onClick={() => navigate("/compras/novo")}
          disabled={loading || deletingId !== null}
        >
          + Nova Compra
        </button>
      </div>

      <div style={layoutStyles.card}>
        <div style={{ paddingBottom: 12, fontSize: 13, color: "#64748b" }}>
          {loading
            ? "Atualizando lista..."
            : `Exibindo ${rows.length} de ${total} registro(s)`}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ ...tableStyles.table, tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th
                  style={{ ...tableStyles.th, width: 120, cursor: "pointer" }}
                  onClick={() => handleSort("data_pedido")}
                >
                  Data {orderBy === "data_pedido" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th
                  style={{ ...tableStyles.th, width: "42%", cursor: "pointer" }}
                  onClick={() => handleSort("fornecedor_id")}
                >
                  Fornecedor {orderBy === "fornecedor_id" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th style={{ ...tableStyles.th, width: 150, textAlign: "right" }}>
                  Total
                </th>

                <th style={{ ...tableStyles.th, width: 230, textAlign: "center" }}>
                  Recebimento
                </th>

                <th
                  style={{ ...tableStyles.th, width: 150, cursor: "pointer" }}
                  onClick={() => handleSort("status")}
                >
                  Status {orderBy === "status" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th
                  style={{ ...tableStyles.th, width: 170, textAlign: "center" }}
                >
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                    Nenhuma compra encontrada.
                  </td>
                </tr>
              )}

              {rows.map((r: any, index) => {
                const totalCalc = getTotalCompra(r);
                const resumoRecebimento = getResumoRecebimento(r);
                const isDeleting = deletingId === Number(r.id);

                const fornecedorIdNum = Number(r?.fornecedor_id);
                const fornecedorNome =
                  r?.fornecedor?.nome ??
                  r?.Fornecedor?.nome ??
                  fornecedoresMap.get(fornecedorIdNum)?.nome ??
                  (fornecedorIdNum ? `Fornecedor #${fornecedorIdNum}` : "-");

                const status = String(r.status || "").toUpperCase();
                const podeEditar = status === "ABERTA";
                const podeExcluir = status === "ABERTA";
                const podeReceber =
                  status === "ABERTA" || status === "PARCIALMENTE_RECEBIDA";
                const podeCancelar =
                  status === "ABERTA" || status === "PARCIALMENTE_RECEBIDA";

                return (
                  <tr
                    key={r.id}
                    style={{
                      background: index % 2 === 0 ? "#fff" : "#f9fafb",
                      opacity: isDeleting ? 0.65 : 1,
                    }}
                  >
                    <td style={tdCompact}>{formatDateBR(r.data_pedido)}</td>

                    <td
                      style={{
                        ...tdCompact,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        lineHeight: 1.25,
                      }}
                    >
                      {fornecedorNome}
                    </td>

                    <td style={tdCompactRight}>
                      {totalCalc === null ? (
                        <span style={{ color: "#94a3b8" }}>-</span>
                      ) : (
                        formatMoneyBR(totalCalc)
                      )}
                    </td>

                    <td style={{ ...tdCompact, textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                          {formatQtyBR(resumoRecebimento.totalRecebido)} / {formatQtyBR(resumoRecebimento.totalQtd)}
                        </div>

                        <div
                          style={{
                            width: 140,
                            height: 8,
                            background: "#e5e7eb",
                            borderRadius: 999,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${resumoRecebimento.percentual}%`,
                              height: "100%",
                              background:
                                resumoRecebimento.percentual >= 100
                                  ? "#22c55e"
                                  : resumoRecebimento.percentual > 0
                                    ? "#f59e0b"
                                    : "#93c5fd",
                              borderRadius: 999,
                              transition: "width 0.2s ease",
                            }}
                          />
                        </div>

                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                          {resumoRecebimento.percentual.toFixed(0)}%
                        </div>
                      </div>
                    </td>

                    <td style={tdCompact}>
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          display: "inline-block",
                          ...statusStyle(r.status),
                        }}
                      >
                        {String(r.status || "-").replaceAll("_", " ")}
                      </span>
                    </td>

                    <td style={tdCompactCenter}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        <button
                          style={buttonStyles.icon}
                          onClick={() =>
                            navigate(
                              podeEditar
                                ? `/compras/${r.id}/editar`
                                : `/compras/${r.id}`
                            )
                          }
                          disabled={loading || isDeleting}
                          title={podeEditar ? "Editar" : "Visualizar"}
                        >
                          <FiEdit size={18} color="#2563eb" />
                        </button>

                        <button
                          style={buttonStyles.icon}
                          onClick={() => navigate(`/compras/${r.id}/receber`)}
                          disabled={loading || isDeleting || !podeReceber}
                          title={
                            podeReceber
                              ? "Receber"
                              : "Compra não disponível para recebimento"
                          }
                        >
                          <FiPackage
                            size={18}
                            color={podeReceber ? "#16a34a" : "#94a3b8"}
                          />
                        </button>

                        <button
                          style={buttonStyles.icon}
                          onClick={() => cancelarCompra(r)}
                          disabled={loading || isDeleting || !podeCancelar}
                          title={
                            podeCancelar
                              ? "Cancelar"
                              : "Compra não pode ser cancelada"
                          }
                        >
                          <FiXCircle
                            size={18}
                            color={podeCancelar ? "#f59e0b" : "#94a3b8"}
                          />
                        </button>

                        <button
                          style={buttonStyles.icon}
                          onClick={() => excluirCompra(r)}
                          disabled={loading || isDeleting || !podeExcluir}
                          title={
                            podeExcluir
                              ? "Excluir"
                              : "Compra não pode ser excluída"
                          }
                        >
                          <FiTrash2
                            size={18}
                            color={podeExcluir ? "#dc2626" : "#94a3b8"}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: 20,
                      color: "#64748b",
                    }}
                  >
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
              disabled={loading || page === 1 || deletingId !== null}
              onClick={() => setPage((prev) => prev - 1)}
              style={buttonStyles.paginationButtonStyle(
                loading || page === 1 || deletingId !== null
              )}
            >
              <FiChevronLeft size={20} />
            </button>

            <span style={{ fontWeight: 600 }}>
              Página {page} de {totalPages}
            </span>

            <button
              disabled={loading || page >= totalPages || deletingId !== null}
              onClick={() => setPage((prev) => prev + 1)}
              style={buttonStyles.paginationButtonStyle(
                loading || page >= totalPages || deletingId !== null
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