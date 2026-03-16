import React, { useEffect, useState } from "react";
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
} from "react-icons/fi";

type FormaPagamentoRow = {
  id: number;
  descricao: string;
  ativo: boolean;
  permite_parcelamento: boolean;
  observacao?: string | null;
  created_at?: string;
  updated_at?: string;
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
  if (Array.isArray(resData)) {
    return {
      data: resData,
      total: resData.length,
    };
  }
  return { data: [], total: 0 };
}

export default function FormasPagamentoList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<FormaPagamentoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroSearch, setFiltroSearch] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const tdCompact: React.CSSProperties = {
    ...tableStyles.td,
    paddingTop: 8,
    paddingBottom: 8,
    lineHeight: 1.15,
    verticalAlign: "middle",
  };

  const tdCompactCenter: React.CSSProperties = {
    ...tdCompact,
    textAlign: "center",
  };

  const hasFilters = !!filtroSearch || !!filtroAtivo;

  async function carregar() {
    setLoading(true);

    try {
      const params: any = {
        page,
        limit,
        sort: "descricao",
        order: "ASC",
      };

      if (filtroSearch) params.search = filtroSearch;
      if (filtroAtivo !== "") params.ativo = filtroAtivo;

      const res = await api.get("/formas-pagamento", { params });
      const { data, total } = pickListResponse(res.data);

      setRows(data);
      setTotal(total);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar formas de pagamento");
    } finally {
      setLoading(false);
    }
  }

  async function excluir(row: FormaPagamentoRow) {
    const ok = window.confirm(
      `Excluir a forma de pagamento "${row.descricao}"?`
    );
    if (!ok) return;

    setDeletingId(row.id);
    try {
      await api.delete(`/formas-pagamento/${row.id}`);
      toast.success("Forma de pagamento excluída!");

      const willBeEmpty = rows.length === 1 && page > 1;
      if (willBeEmpty) setPage((p) => p - 1);
      else await carregar();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error || "Erro ao excluir forma de pagamento"
      );
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      carregar();
    }, 400);

    return () => clearTimeout(t);
  }, [filtroSearch, filtroAtivo]);

  useEffect(() => {
    carregar();
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Formas de Pagamento</h1>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          {total} registro(s) encontrado(s)
        </div>
      </div>

      <div style={layoutStyles.cardCompact}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minWidth: 320,
              flex: 1,
            }}
          >
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Buscar
            </label>
            <input
              value={filtroSearch}
              onChange={(e) => setFiltroSearch(e.target.value)}
              style={{
                ...filterStyles.input,
                height: 36,
                padding: "0 12px",
              }}
              placeholder="Descrição"
              disabled={loading || deletingId !== null}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              width: 220,
            }}
          >
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Situação
            </label>
            <select
              value={filtroAtivo}
              onChange={(e) => setFiltroAtivo(e.target.value)}
              style={{
                ...filterStyles.select,
                height: 36,
                padding: "0 12px",
              }}
              disabled={loading || deletingId !== null}
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>

          <div style={{ flex: 1 }} />

          {hasFilters && (
            <button
              style={{ ...buttonStyles.link, marginBottom: 2 }}
              onClick={() => {
                setFiltroSearch("");
                setFiltroAtivo("");
              }}
              disabled={loading || deletingId !== null}
            >
              Limpar
            </button>
          )}
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
          onClick={() => navigate("/formas-pagamento/novo")}
          disabled={loading || deletingId !== null}
        >
          + Nova Forma
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
                <th style={{ ...tableStyles.th, width: 90 }}>ID</th>
                <th style={{ ...tableStyles.th, width: "40%" }}>Descrição</th>
                <th style={{ ...tableStyles.th, width: 160, textAlign: "center" }}>
                  Parcelamento
                </th>
                <th style={{ ...tableStyles.th, width: 130, textAlign: "center" }}>
                  Situação
                </th>
                <th style={{ ...tableStyles.th, width: 170, textAlign: "center" }}>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                    Nenhuma forma de pagamento encontrada.
                  </td>
                </tr>
              )}

              {rows.map((r, index) => {
                const isDeleting = deletingId === Number(r.id);

                return (
                  <tr
                    key={r.id}
                    style={{
                      background: index % 2 === 0 ? "#fff" : "#f9fafb",
                      opacity: isDeleting ? 0.65 : 1,
                    }}
                  >
                    <td style={tdCompact}>{r.id}</td>

                    <td style={tdCompact}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 600, color: "#111827" }}>
                          {r.descricao}
                        </span>
                        {r.observacao ? (
                          <span style={{ fontSize: 12, color: "#64748b" }}>
                            {r.observacao}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td style={tdCompactCenter}>
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          display: "inline-block",
                          background: r.permite_parcelamento ? "#dcfce7" : "#fee2e2",
                          color: r.permite_parcelamento ? "#166534" : "#991b1b",
                        }}
                      >
                        {r.permite_parcelamento ? "Permite" : "Não permite"}
                      </span>
                    </td>

                    <td style={tdCompactCenter}>
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          display: "inline-block",
                          background: r.ativo ? "#dbeafe" : "#e5e7eb",
                          color: r.ativo ? "#1e40af" : "#374151",
                        }}
                      >
                        {r.ativo ? "Ativo" : "Inativo"}
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
                          onClick={() => navigate(`/formas-pagamento/${r.id}/editar`)}
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
                          <FiTrash2
                            size={18}
                            color={isDeleting ? "#94a3b8" : "#dc2626"}
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