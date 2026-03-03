import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import type { Fornecedor } from "../../types/Fornecedor";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import { FiChevronLeft, FiChevronRight, FiEdit, FiTrash2 } from "react-icons/fi";

function pickListResponse(resData: any) {
  if (Array.isArray(resData?.data)) return { data: resData.data, total: Number(resData.total ?? resData.count ?? 0) || 0 };
  if (Array.isArray(resData?.data?.data)) return { data: resData.data.data, total: Number(resData.data.total ?? resData.data.count ?? 0) || 0 };
  if (Array.isArray(resData?.data?.rows)) return { data: resData.data.rows, total: Number(resData.data.count ?? 0) || 0 };
  if (Array.isArray(resData?.rows)) return { data: resData.rows, total: Number(resData.count ?? 0) || 0 };
  if (Array.isArray(resData?.items)) return { data: resData.items, total: Number(resData.total ?? 0) || 0 };
  return { data: [], total: 0 };
}

function pickSort(sort: any, order: any, orderBy: any, orderDir: any, allowed: string[]) {
  const col = String(orderBy || sort || "");
  const dir = String(orderDir || order || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
  if (!allowed.includes(col)) return { col: "id", dir: "DESC" as const };
  return { col, dir: dir as "ASC" | "DESC" };
}

export default function FornecedoresList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroDocumento, setFiltroDocumento] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState<"" | "true" | "false">("");

  // ordenação
  const [orderBy, setOrderBy] = useState<"id" | "nome" | "documento">("id");
  const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("DESC");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const hasFilters = !!filtroNome || !!filtroDocumento || !!filtroAtivo;

  // compact
  const tdCompact: React.CSSProperties = {
    ...tableStyles.td,
    paddingTop: 8,
    paddingBottom: 8,
    lineHeight: 1.15,
    verticalAlign: "middle",
  };
  const tdCenter: React.CSSProperties = { ...tdCompact, textAlign: "center" };

  const totalPages = Math.ceil(total / limit);

  async function carregar() {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        sort: orderBy,
        order: orderDir,
        orderBy,
        orderDir,
      };
      if (filtroNome) params.nome = filtroNome.trim();
      if (filtroDocumento) params.documento = filtroDocumento.trim();
      if (filtroAtivo) params.ativo = filtroAtivo === "true";

      const res = await api.get("/fornecedores", { params });
      const { data, total } = pickListResponse(res.data);
      setRows(data);
      setTotal(total);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar fornecedores");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      carregar();
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroNome, filtroDocumento, filtroAtivo, orderBy, orderDir]);

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleSort(coluna: "id" | "nome" | "documento") {
    if (orderBy === coluna) setOrderDir((p) => (p === "ASC" ? "DESC" : "ASC"));
    else {
      setOrderBy(coluna);
      setOrderDir("ASC");
    }
  }

  async function excluir(row: Fornecedor) {
    const id = Number(row?.id);
    if (!id) return;

    const ok = window.confirm(`Excluir o fornecedor #${id}?\n\n${row.nome}\n\nEssa ação não pode ser desfeita.`);
    if (!ok) return;

    setDeletingId(id);
    try {
      await api.delete(`/fornecedores/${id}`);
      toast.success("Fornecedor excluído!");

      const willBeEmpty = rows.length === 1 && page > 1;
      if (willBeEmpty) setPage((p) => p - 1);
      else await carregar();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao excluir fornecedor");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Fornecedores</h1>
        <div style={{ fontSize: 13, color: "#64748b" }}>{total} fornecedor(es)</div>
      </div>

      {/* filtros */}
      <div style={layoutStyles.cardCompact}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 260 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Nome</label>
            <input
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              style={{ ...filterStyles.input, height: 36, padding: "0 12px" }}
              placeholder="Buscar por nome..."
              disabled={loading || deletingId !== null}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 240 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Documento (CPF/CNPJ)</label>
            <input
              value={filtroDocumento}
              onChange={(e) => setFiltroDocumento(e.target.value)}
              style={{ ...filterStyles.input, height: 36, padding: "0 12px" }}
              placeholder="Somente números ou texto..."
              disabled={loading || deletingId !== null}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 180 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Status</label>
            <select
              value={filtroAtivo}
              onChange={(e) => setFiltroAtivo(e.target.value as any)}
              style={{ ...filterStyles.select, height: 36, padding: "0 12px" }}
              disabled={loading || deletingId !== null}
            >
              <option value="">Todos</option>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

          <div style={{ flex: 1 }} />

          {hasFilters && (
            <button
              style={buttonStyles.link}
              onClick={() => {
                setFiltroNome("");
                setFiltroDocumento("");
                setFiltroAtivo("");
              }}
              disabled={loading || deletingId !== null}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* botões */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, margin: "12px 0 16px" }}>
        <button style={buttonStyles.link} onClick={() => navigate(-1)} disabled={loading || deletingId !== null}>
          Voltar
        </button>
        <button style={buttonStyles.primary} onClick={() => navigate("/fornecedores/novo")} disabled={loading || deletingId !== null}>
          + Novo Fornecedor
        </button>
      </div>

      {/* tabela */}
      <div style={layoutStyles.card}>
        <div style={{ paddingBottom: 12, fontSize: 13, color: "#64748b" }}>
          {loading ? "Atualizando lista..." : `Exibindo ${rows.length} de ${total} registro(s)`}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ ...tableStyles.table, tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ ...tableStyles.th, width: 90, cursor: "pointer" }} onClick={() => handleSort("id")}>
                  ID {orderBy === "id" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>
                <th style={{ ...tableStyles.th, width: "44%", cursor: "pointer" }} onClick={() => handleSort("nome")}>
                  Nome {orderBy === "nome" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>
                <th style={{ ...tableStyles.th, width: 220, cursor: "pointer" }} onClick={() => handleSort("documento")}>
                  Documento {orderBy === "documento" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>
                <th style={{ ...tableStyles.th, width: 120, textAlign: "center" }}>Status</th>
                <th style={{ ...tableStyles.th, width: 140, textAlign: "center" }}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                    Nenhum fornecedor encontrado.
                  </td>
                </tr>
              )}

              {rows.map((r, index) => {
                const isDeleting = deletingId === Number(r.id);
                const ativo = r.ativo !== false;

                return (
                  <tr
                    key={r.id}
                    style={{
                      background: index % 2 === 0 ? "#fff" : "#f9fafb",
                      opacity: isDeleting ? 0.65 : 1,
                    }}
                  >
                    <td style={tdCompact}>{r.id}</td>

                    <td style={{ ...tdCompact, whiteSpace: "normal", wordBreak: "break-word" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13 }}>{r.nome}</div>
                      {(r.telefone || r.email) && (
                        <div style={{ marginTop: 3, color: "#475569", fontSize: 12 }}>
                          {r.telefone ? `Tel: ${r.telefone}` : ""}
                          {r.telefone && r.email ? " • " : ""}
                          {r.email ? `Email: ${r.email}` : ""}
                        </div>
                      )}
                    </td>

                    <td style={tdCompact}>{r.documento || <span style={{ color: "#94a3b8" }}>-</span>}</td>

                    <td style={tdCenter}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 800,
                          display: "inline-block",
                          background: ativo ? "#dcfce7" : "#fee2e2",
                          color: ativo ? "#166534" : "#991b1b",
                        }}
                      >
                        {ativo ? "ATIVO" : "INATIVO"}
                      </span>
                    </td>

                    <td style={tdCenter}>
                      <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "nowrap" }}>
                        <button
                          style={buttonStyles.icon}
                          onClick={() => navigate(`/fornecedores/${r.id}/editar`)}
                          disabled={loading || isDeleting}
                          title="Editar"
                        >
                          <FiEdit size={18} color="#2563eb" />
                        </button>

                        <button
                          style={buttonStyles.icon}
                          onClick={() => excluir(r)}
                          disabled={loading || isDeleting}
                          title="Excluir"
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
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
            <button
              disabled={loading || page === 1 || deletingId !== null}
              onClick={() => setPage((p) => p - 1)}
              style={buttonStyles.paginationButtonStyle(loading || page === 1 || deletingId !== null)}
            >
              <FiChevronLeft size={20} />
            </button>

            <span style={{ fontWeight: 700 }}>
              Página {page} de {totalPages}
            </span>

            <button
              disabled={loading || page >= totalPages || deletingId !== null}
              onClick={() => setPage((p) => p + 1)}
              style={buttonStyles.paginationButtonStyle(loading || page >= totalPages || deletingId !== null)}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}