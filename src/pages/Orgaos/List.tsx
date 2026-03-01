import { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import type { OrgaoContratante } from "../../types/OrgaoContratante";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { badgeStyles } from "../../styles/badges";
import { filterStyles } from "../../styles/filters";
import { fieldFocusHandlers } from "../../styles/focus";

import ModalContratosOrgao from "./ModalContratosOrgao";

import { toast } from "react-toastify";
import {
  FiEdit,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";

export default function OrgaosList() {
  const [orgaos, setOrgaos] = useState<OrgaoContratante[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [filtroNome, setFiltroNome] = useState("");
  const [debouncedFiltroNome, setDebouncedFiltroNome] = useState("");
  const [esfera, setEsfera] = useState("");

  // ordenação
  const [sort, setSort] = useState<"id" | "nome" | "cnpj" | "esfera">("nome");
  const [dir, setDir] = useState<"ASC" | "DESC">("ASC");

  // paginação
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0); // se sua API não devolver total, fica 0
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [orgaoSelecionado, setOrgaoSelecionado] = useState<number | null>(null);

  const navigate = useNavigate();

  const safeTotal = Number.isFinite(total) && total > 0 ? total : orgaos.length;
  const safeTotalPages = Math.max(1, totalPages || 1);

  function handleSort(field: typeof sort) {
    if (sort === field) setDir((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    else {
      setSort(field);
      setDir("ASC");
    }
  }

  function renderSortIcon(column: typeof sort) {
    if (sort !== column) return null;
    return dir === "ASC" ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />;
  }

  async function loadData() {
    try {
      setLoading(true);

      const res = await api.get("/orgaocontratante", {
        params: {
          page,
          limit,
          sort,
          dir,
          nome: debouncedFiltroNome,
          esfera,
        },
      });

      setOrgaos(res.data.data ?? []);

      // se existir meta, usa. se não, cai num padrão seguro.
      setTotalPages(res.data.meta?.totalPages ?? 1);

      // se sua API tiver total, aproveita (opcional)
      setTotal(res.data.total ?? 0);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar órgãos");
    } finally {
      setLoading(false);
    }
  }

  // debounce do texto
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedFiltroNome(filtroNome), 450);
    return () => clearTimeout(timeout);
  }, [filtroNome]);

  // buscar ao mudar filtros/paginação/ordenação
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedFiltroNome, esfera, sort, dir]);

  // reset de página ao mudar filtros/ordenação
  useEffect(() => setPage(1), [filtroNome, esfera, sort, dir]);

  async function handleDelete(id: number) {
    if (!window.confirm("Deseja inativar este órgão?")) return;

    try {
      await api.delete(`/orgaocontratante/${id}`);
      toast.success("Órgão inativado");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir órgão");
    }
  }

  function openContratos(orgaoId: number) {
    setOrgaoSelecionado(orgaoId);
    setShowModal(true);
  }

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Órgãos Contratantes</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {loading ? "Carregando..." : `${safeTotal} registro(s) encontrado(s)`}
          </div>
        </div>
      </div>

      {/* FILTROS (card separado - igual empresas) */}
      <div style={layoutStyles.cardCompact}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, width: "100%" }}>
          {/* Busca ocupa tudo */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Nome do Órgão
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

          {/* Esfera fixa */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Esfera
            </label>

            <select
              value={esfera}
              onChange={(e) => setEsfera(e.target.value)}
              style={{ ...filterStyles.select, width: "100%" }}
              {...fieldFocusHandlers}
            >
              <option value="">Todas</option>
              <option value="MUNICIPAL">Municipal</option>
              <option value="ESTADUAL">Estadual</option>
              <option value="FEDERAL">Federal</option>
            </select>
          </div>

          {(filtroNome || esfera) && (
            <button
              style={{ ...buttonStyles.link, marginBottom: 2 }}
              onClick={() => {
                setFiltroNome("");
                setEsfera("");
              }}
              title="Limpar filtros"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* BOTÕES ABAIXO DO FILTRO (igual empresas) */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, margin: "12px 0 16px" }}>
        <button style={buttonStyles.link} onClick={() => navigate(-1)}>
          Voltar
        </button>

        <button style={buttonStyles.primary} onClick={() => navigate("/orgaos/novo")}>
          + Novo Órgão
        </button>
      </div>

      {/* TABELA (card separado - igual empresas) */}
      <div style={layoutStyles.card}>
        <div style={{ paddingBottom: 12, fontSize: 13, color: "#64748b" }}>
          Exibindo {orgaos.length} de {safeTotal} registro(s)
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyles.table}>
            <thead style={tableStyles.thead}>
              <tr>
                <th
                  style={{ ...tableStyles.th, width: 70, cursor: "pointer" }}
                  onClick={() => handleSort("id")}
                >
                  ID {renderSortIcon("id")}
                </th>

                <th
                  style={{ ...tableStyles.th, width: "40%", cursor: "pointer" }}
                  onClick={() => handleSort("nome")}
                >
                  Nome {renderSortIcon("nome")}
                </th>

                <th
                  style={{ ...tableStyles.th, width: "22%", cursor: "pointer" }}
                  onClick={() => handleSort("cnpj")}
                >
                  CNPJ {renderSortIcon("cnpj")}
                </th>

                <th
                  style={{ ...tableStyles.th, width: 150, cursor: "pointer" }}
                  onClick={() => handleSort("esfera")}
                >
                  Esfera {renderSortIcon("esfera")}
                </th>

                <th style={{ ...tableStyles.th, width: 120, textAlign: "center" }}>
                  Contratos
                </th>

                <th style={{ ...tableStyles.th, width: 120, textAlign: "center" }}>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                    Carregando...
                  </td>
                </tr>
              )}

              {!loading && orgaos.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                    Nenhum órgão encontrado.
                  </td>
                </tr>
              )}

              {!loading &&
                orgaos.map((o, index) => (
                  <tr key={o.id} style={tableStyles.row(index)}>
                    <td style={tableStyles.td}>{o.id}</td>
                    <td style={{ ...tableStyles.td, ...tableStyles.tdWrap }}>{o.nome}</td>
                    <td style={tableStyles.td}>{o.cnpj}</td>

                    <td style={tableStyles.td}>
                      <span style={badgeStyles.base}>{o.esfera}</span>
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "center" }}>
                      <button style={buttonStyles.link} onClick={() => openContratos(o.id)}>
                        {o.total_contratos || 0}
                      </button>
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button
                          title="Editar"
                          style={buttonStyles.icon}
                          onClick={() => navigate(`/orgaos/${o.id}/editar`)}
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
                          onClick={() => handleDelete(o.id)}
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

        {/* PAGINAÇÃO (igual empresas) */}
        {safeTotalPages > 1 && (
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
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              style={buttonStyles.paginationButtonStyle(page === 1)}
            >
              <FiChevronLeft size={20} />
            </button>

            <span style={{ fontWeight: 600, minWidth: 90, textAlign: "center" }}>
              Página {page} de {safeTotalPages}
            </span>

            <button
              disabled={page >= safeTotalPages}
              onClick={() => setPage((prev) => prev + 1)}
              style={buttonStyles.paginationButtonStyle(page >= safeTotalPages)}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && orgaoSelecionado && (
        <ModalContratosOrgao
          orgaoId={orgaoSelecionado}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}