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

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    nome: "",
    esfera: "",
  });

  const [sort, setSort] = useState<"id" | "nome" | "cnpj" | "esfera">("nome");
  const [dir, setDir] = useState<"ASC" | "DESC">("ASC");

  const [showModal, setShowModal] = useState(false);
  const [orgaoSelecionado, setOrgaoSelecionado] = useState<number | null>(null);

  const navigate = useNavigate();

  async function loadData() {
    try {
      setLoading(true);

      const res = await api.get("/orgaocontratante", {
        params: {
          page,
          limit,
          sort,
          dir,
          nome: filters.nome,
          esfera: filters.esfera,
        },
      });

      setOrgaos(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar órgãos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [page, sort, dir, filters.nome, filters.esfera]);

  function handleSort(field: typeof sort) {
    if (sort === field) {
      setDir((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSort(field);
      setDir("ASC");
    }
    setPage(1);
  }

  function renderSortIcon(column: typeof sort) {
    if (sort !== column) return null;
    return dir === "ASC" ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />;
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Deseja inativar este órgão?")) return;

    try {
      await api.delete(`/orgaocontratante/${id}`);
      toast.success("Órgão inativado");
      loadData();
    } catch {
      toast.error("Erro ao excluir órgão");
    }
  }

  function openContratos(orgaoId: number) {
    setOrgaoSelecionado(orgaoId);
    setShowModal(true);
  }

  if (loading) return <p style={{ padding: 20 }}>Carregando...</p>;

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Órgãos Contratantes</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Gerencie os órgãos vinculados aos contratos.
          </div>
        </div>

        <button
          style={buttonStyles.primary}
          onClick={() => navigate("/orgaos/novo")}
        >
          + Novo Órgão
        </button>
      </div>

      <div style={layoutStyles.card}>
        {/* 🔎 Filtros modernos */}
        <div style={filterStyles.container}>
          <span style={filterStyles.title}>Filtro</span>

          <div style={filterStyles.row}>
            <input
              placeholder="Buscar por nome"
              style={filterStyles.input}
              {...fieldFocusHandlers}
              value={filters.nome}
              onChange={(e) =>
                setFilters({ ...filters, nome: e.target.value })
              }
            />

            <select
              style={filterStyles.select}
              {...fieldFocusHandlers}
              value={filters.esfera}
              onChange={(e) =>
                setFilters({ ...filters, esfera: e.target.value })
              }
            >
              <option value="">Todas as esferas</option>
              <option value="MUNICIPAL">Municipal</option>
              <option value="ESTADUAL">Estadual</option>
              <option value="FEDERAL">Federal</option>
            </select>
          </div>
        </div>

        {/* 📋 Tabela */}
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={{ ...tableStyles.th, width: "5%", cursor: "pointer" }} onClick={() => handleSort("id")}>
                ID {renderSortIcon("id")}
              </th>

              <th style={{ ...tableStyles.th, width: "40%", cursor: "pointer" }} onClick={() => handleSort("nome")}>
                Nome {renderSortIcon("nome")}
              </th>

              <th style={{ ...tableStyles.th, width: "20%", cursor: "pointer" }} onClick={() => handleSort("cnpj")}>
                CNPJ {renderSortIcon("cnpj")}
              </th>

              <th style={{ ...tableStyles.th, width: "15%", cursor: "pointer" }} onClick={() => handleSort("esfera")}>
                Esfera {renderSortIcon("esfera")}
              </th>

              <th style={{ ...tableStyles.th, width: "10%", textAlign: "center" }}>
                Contratos
              </th>

              <th style={{ ...tableStyles.th, width: "10%", textAlign: "center" }}>
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {orgaos.map((o) => (
              <tr key={o.id}>
                <td style={tableStyles.td}>{o.id}</td>
                <td style={tableStyles.td}>{o.nome}</td>
                <td style={tableStyles.td}>{o.cnpj}</td>

                <td style={tableStyles.td}>
                  <span style={badgeStyles.base}>{o.esfera}</span>
                </td>

                <td style={{ ...tableStyles.td, textAlign: "center" }}>
                  <button
                    style={buttonStyles.link}
                    onClick={() => openContratos(o.id)}
                  >
                    {o.total_contratos || 0}
                  </button>
                </td>

                <td style={tableStyles.td}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button
                      title="Editar"
                      style={{ ...buttonStyles.icon, color: "#2563eb" }}
                      onClick={() => navigate(`/orgaos/${o.id}/editar`)}
                    >
                      <FiEdit size={18} />
                    </button>

                    <button
                      title="Excluir"
                      style={{ ...buttonStyles.icon, color: "#dc2626" }}
                      onClick={() => handleDelete(o.id)}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 🔢 Paginação padrão */}
        {orgaos.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              marginTop: 20,
            }}
          >
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              style={buttonStyles.paginationButtonStyle(page === 1)}
            >
              <FiChevronLeft size={18} />
            </button>

            <span style={{ fontWeight: 600, color: "#0f172a" }}>
              Página {page} de {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={buttonStyles.paginationButtonStyle(page >= totalPages)}
            >
              <FiChevronRight size={18} />
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