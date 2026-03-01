import { useEffect, useState } from "react";
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
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";

/* =========================
   Types
========================= */
type Grupo = {
  id: number;
  nome: string;
};

/* =========================
   Component
========================= */
export default function GrupoList() {
  const navigate = useNavigate();

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [filtroNome, setFiltroNome] = useState("");
  const [debouncedFiltroNome, setDebouncedFiltroNome] = useState("");

  // ordenação
  const [sort, setSort] = useState<"id" | "nome">("id");
  const [order, setOrder] = useState<"ASC" | "DESC">("ASC");

  // paginação
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const safeTotal = Number.isFinite(total) && total > 0 ? total : grupos.length;
  const totalPages = Math.max(1, Math.ceil(safeTotal / limit));

  function handleSort(column: typeof sort) {
    if (sort === column) setOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    else {
      setSort(column);
      setOrder("ASC");
    }
  }

  function renderSortIcon(column: string) {
    if (sort !== column) return null;
    return order === "ASC" ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />;
  }

  async function carregarGrupos() {
    setLoading(true);

    try {
      const res = await api.get("/grupos", {
        params: {
          page,
          limit,
          orderBy: sort,
          orderDir: order,
          nome: debouncedFiltroNome || undefined,
        },
      });

      setGrupos(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar grupos");
    } finally {
      setLoading(false);
    }
  }

  // debounce do texto (padrão empresas)
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedFiltroNome(filtroNome), 450);
    return () => clearTimeout(timeout);
  }, [filtroNome]);

  // buscar ao mudar filtros/paginação/ordenação
  useEffect(() => {
    carregarGrupos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedFiltroNome, sort, order]);

  // reset de página ao mudar filtros/ordenação
  useEffect(() => setPage(1), [filtroNome, sort, order]);

  async function handleDelete(id: number) {
    if (!window.confirm("Deseja excluir este grupo?")) return;

    try {
      await api.delete(`/grupos/${id}`);
      toast.success("Grupo excluído");
      carregarGrupos();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir grupo");
    }
  }

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Grupos</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {loading ? "Carregando..." : `${safeTotal} registro(s) encontrado(s)`}
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div style={layoutStyles.cardCompact}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, width: "100%" }}>
          {/* Busca ocupa tudo */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Nome do Grupo
            </label>

            <input
              type="text"
              placeholder="Buscar por nome"
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              style={{ ...filterStyles.input, width: "100%" }}
              {...fieldFocusHandlers}
            />
          </div>

          {filtroNome && (
            <button
              style={{ ...buttonStyles.link, marginBottom: 2 }}
              onClick={() => setFiltroNome("")}
              title="Limpar filtros"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* BOTÕES ABAIXO DO FILTRO */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, margin: "12px 0 16px" }}>
        <button style={buttonStyles.link} onClick={() => navigate(-1)}>
          Voltar
        </button>

        <button style={buttonStyles.primary} onClick={() => navigate("/grupos/novo")}>
          + Novo Grupo
        </button>
      </div>

      {/* TABELA */}
      <div style={layoutStyles.card}>
        <div style={{ paddingBottom: 12, fontSize: 13, color: "#64748b" }}>
          Exibindo {grupos.length} de {safeTotal} registro(s)
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyles.table}>
            <thead style={tableStyles.thead}>
              <tr>
                <th
                  style={{ ...tableStyles.th, width: 90, cursor: "pointer" }}
                  onClick={() => handleSort("id")}
                >
                  ID {renderSortIcon("id")}
                </th>

                <th
                  style={{ ...tableStyles.th, cursor: "pointer" }}
                  onClick={() => handleSort("nome")}
                >
                  Nome {renderSortIcon("nome")}
                </th>

                <th style={{ ...tableStyles.th, width: 120, textAlign: "center" }}>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {grupos.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: 20 }}>
                    Nenhum grupo encontrado.
                  </td>
                </tr>
              )}

              {grupos.map((g, index) => (
                <tr key={g.id} style={tableStyles.row(index)}>
                  <td style={tableStyles.td}>{g.id}</td>
                  <td style={{ ...tableStyles.td, ...tableStyles.tdWrap }}>{g.nome}</td>

                  <td style={{ ...tableStyles.td, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button
                        title="Editar"
                        style={buttonStyles.icon}
                        onClick={() => navigate(`/grupos/${g.id}/editar`)}
                        onMouseEnter={(ev) =>
                          (ev.currentTarget.style.background = "rgba(37,99,235,0.08)")
                        }
                        onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                      >
                        <FiEdit size={18} color="#2563eb" />
                      </button>

                      <button
                        title="Excluir"
                        style={buttonStyles.icon}
                        onClick={() => handleDelete(g.id)}
                        onMouseEnter={(ev) =>
                          (ev.currentTarget.style.background = "rgba(220,38,38,0.08)")
                        }
                        onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                      >
                        <FiTrash2 size={18} color="#dc2626" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              style={buttonStyles.paginationButtonStyle(page === 1)}
            >
              <FiChevronLeft size={20} />
            </button>

            <span style={{ fontWeight: 600, minWidth: 90, textAlign: "center" }}>
              Página {page} de {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              style={buttonStyles.paginationButtonStyle(page >= totalPages)}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}