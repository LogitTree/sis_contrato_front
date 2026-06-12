import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";
import { fieldFocusHandlers } from "../../styles/focus";

import { toast } from "react-toastify";
import {
  FiEdit,
  FiTrash2,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";

type Subgrupo = {
  id: number;
  nome: string;
  grupo_id: number;
  grupo?: {
    id: number;
    nome: string;
  };
};

export default function SubgrupoList() {
  const navigate = useNavigate();

  const [subgrupos, setSubgrupos] = useState<Subgrupo[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroNome, setFiltroNome] = useState("");
  const [debouncedFiltroNome, setDebouncedFiltroNome] = useState("");

  const [sort, setSort] = useState<"id" | "nome">("id");
  const [order, setOrder] = useState<"ASC" | "DESC">("ASC");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const safeTotal =
    Number.isFinite(total) && total > 0 ? total : subgrupos.length;

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(safeTotal / limit));
  }, [safeTotal, limit]);

  function handleSort(column: "id" | "nome") {
    if (sort === column) {
      setOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSort(column);
      setOrder("ASC");
    }
  }

  function renderSortIcon(column: "id" | "nome") {
    if (sort !== column) return null;

    return order === "ASC" ? (
      <FiChevronUp size={14} />
    ) : (
      <FiChevronDown size={14} />
    );
  }

  async function carregarSubgrupos() {
    setLoading(true);

    try {
      const res = await api.get("/subgrupos", {
        params: {
          page,
          limit,
          orderBy: sort,
          orderDir: order,
          nome: debouncedFiltroNome || undefined,
        },
      });

      const rows = res.data?.data || [];
      const totalApi = res.data?.total ?? res.data?.meta?.total ?? 0;

      setSubgrupos(Array.isArray(rows) ? rows : []);
      setTotal(Number(totalApi) || 0);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar subgrupos");
      setSubgrupos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFiltroNome(filtroNome.trim());
    }, 450);

    return () => clearTimeout(timeout);
  }, [filtroNome]);

  useEffect(() => {
    setPage(1);
  }, [debouncedFiltroNome, sort, order]);

  useEffect(() => {
    carregarSubgrupos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedFiltroNome, sort, order]);

  async function handleDelete(id: number) {
    if (!window.confirm("Deseja excluir este subgrupo?")) return;

    try {
      await api.delete(`/subgrupos/${id}`);
      toast.success("Subgrupo excluído");
      carregarSubgrupos();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir subgrupo");
    }
  }

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Subgrupos</h1>

          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {loading ? "Carregando..." : `${safeTotal} registro(s) encontrado(s)`}
          </div>
        </div>
      </div>

      <div style={layoutStyles.cardCompact}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 16,
            width: "100%",
            flexWrap: "wrap",
            rowGap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              flex: 1,
              minWidth: 260,
            }}
          >
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Nome do Subgrupo
            </label>

            <input
              type="text"
              placeholder="Buscar por nome"
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              style={{
                ...filterStyles.input,
                width: "100%",
                boxSizing: "border-box",
              }}
              {...fieldFocusHandlers}
            />
          </div>

          {filtroNome && (
            <button
              style={{ ...buttonStyles.link, marginBottom: 2 }}
              onClick={() => {
                setFiltroNome("");
                setDebouncedFiltroNome("");
                setPage(1);
              }}
              disabled={loading}
              title="Limpar filtros"
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
        <button style={buttonStyles.link} onClick={() => navigate(-1)} disabled={loading}>
          Voltar
        </button>

        <button
          style={buttonStyles.primary}
          onClick={() => navigate("/subgrupos/novo")}
          disabled={loading}
        >
          + Novo Subgrupo
        </button>
      </div>

      <div style={layoutStyles.card}>
        <div style={{ paddingBottom: 12, fontSize: 13, color: "#64748b" }}>
          {loading
            ? "Atualizando lista..."
            : `Exibindo ${subgrupos.length} de ${safeTotal} registro(s)`}
        </div>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            minHeight: 470,
          }}
        >
          <table style={{ ...tableStyles.table, tableLayout: "fixed" }}>
            <thead style={tableStyles.thead}>
              <tr>
                <th
                  style={{ ...tableStyles.th, width: 90, cursor: "pointer" }}
                  onClick={() => handleSort("id")}
                >
                  <span style={thSortContentStyle}>
                    ID {renderSortIcon("id")}
                  </span>
                </th>

                <th
                  style={{ ...tableStyles.th, cursor: "pointer" }}
                  onClick={() => handleSort("nome")}
                >
                  <span style={thSortContentStyle}>
                    Nome {renderSortIcon("nome")}
                  </span>
                </th>

                <th style={{ ...tableStyles.th, width: "35%" }}>
                  Grupo
                </th>

                <th
                  style={{
                    ...tableStyles.th,
                    width: 130,
                    textAlign: "center",
                  }}
                >
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {!loading && subgrupos.length === 0 && (
                <tr>
                  <td colSpan={4} style={emptyStyle}>
                    Nenhum subgrupo encontrado.
                  </td>
                </tr>
              )}

              {subgrupos.map((sg, index) => (
                <tr key={sg.id} style={tableStyles.row(index)}>
                  <td style={tableStyles.td}>{sg.id}</td>

                  <td
                    style={{
                      ...tableStyles.td,
                      ...tableStyles.tdWrap,
                      lineHeight: 1.35,
                    }}
                    title={sg.nome}
                  >
                    {sg.nome}
                  </td>

                  <td
                    style={{
                      ...tableStyles.td,
                      ...tableStyles.tdWrap,
                      lineHeight: 1.35,
                    }}
                    title={sg.grupo?.nome}
                  >
                    {sg.grupo?.nome || "—"}
                  </td>

                  <td style={{ ...tableStyles.td, textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "center",
                      }}
                    >
                      <button
                        title="Editar"
                        style={buttonStyles.icon}
                        onClick={() => navigate(`/subgrupos/${sg.id}/editar`)}
                        onMouseEnter={(ev) =>
                        (ev.currentTarget.style.background =
                          "rgba(37,99,235,0.08)")
                        }
                        onMouseLeave={(ev) =>
                          (ev.currentTarget.style.background = "transparent")
                        }
                      >
                        <FiEdit size={18} color="#2563eb" />
                      </button>

                      <button
                        title="Excluir"
                        style={buttonStyles.icon}
                        onClick={() => handleDelete(sg.id)}
                        onMouseEnter={(ev) =>
                        (ev.currentTarget.style.background =
                          "rgba(220,38,38,0.08)")
                        }
                        onMouseLeave={(ev) =>
                          (ev.currentTarget.style.background = "transparent")
                        }
                      >
                        <FiTrash2 size={18} color="#dc2626" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {loading && subgrupos.length === 0 && (
                <tr>
                  <td colSpan={4} style={emptyStyle}>
                    Carregando registros...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>
            Total: {safeTotal} registro(s) • Página {page} de {totalPages}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
              style={{
                ...filterStyles.input,
                width: 90,
                height: 38,
              }}
              disabled={loading}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <button
              type="button"
              style={buttonStyles.secondary}
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </button>

            <button
              type="button"
              style={buttonStyles.secondary}
              disabled={page >= totalPages || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const thSortContentStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};
const emptyStyle: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
};