import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiPlus,
} from "react-icons/fi";
import { toast } from "react-toastify";

import api from "../../api/api";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";
import { badgeStyles } from "../../styles/badges";
import { fieldFocusHandlers } from "../../styles/focus";

type Motivo = {
  id: number;
  descricao: string;
};

type Inventario = {
  id: number;
  data_inventario: string;
  observacao?: string | null;
  status: string;
  motivo_id?: number;
  motivo?: Motivo | null;
  created_at?: string;
};

type SortField = "id" | "data_inventario" | "status";

function formatDate(value?: string | null) {
  if (!value) return "-";

  const raw = String(value);
  const dateOnly = raw.slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const [year, month, day] = dateOnly.split("-");
    return `${day}/${month}/${year}`;
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleDateString("pt-BR");
}

function getStatusLabel(status?: string) {
  switch (String(status || "").toUpperCase()) {
    case "ABERTO":
      return "Aberto";
    case "EM_CONFERENCIA":
      return "Em Conferência";
    case "CONFIRMADO":
      return "Confirmado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return status || "-";
  }
}

function getBadgeStyle(status?: string): React.CSSProperties {
  const s = String(status || "").toUpperCase();

  if (s === "CONFIRMADO") {
    return { ...badgeStyles.base, ...badgeStyles.success };
  }

  if (s === "CANCELADO") {
    return { ...badgeStyles.base, ...badgeStyles.danger };
  }

  if (s === "EM_CONFERENCIA") {
    return { ...badgeStyles.base, ...badgeStyles.warning };
  }

  return {
    ...badgeStyles.base,
    background: "#dbeafe",
    color: "#1d4ed8",
  };
}

export default function InventarioList() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [motivos, setMotivos] = useState<Motivo[]>([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");

  const [filtros, setFiltros] = useState({
    status: "",
    motivo_id: "",
    data_inicial: "",
    data_final: "",
  });

  const safeTotal =
    Number.isFinite(total) && total > 0 ? total : inventarios.length;

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(safeTotal / limit));
  }, [safeTotal, limit]);

  useEffect(() => {
    loadMotivos();
  }, []);

  useEffect(() => {
    loadInventarios(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortField, sortDir]);

  async function loadMotivos() {
    try {
      const { data } = await api.get("/inventario-motivos", {
        params: {
          page: 1,
          limit: 500,
          ativo: true,
          orderBy: "descricao",
          orderDir: "ASC",
        },
      });

      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      setMotivos(rows);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadInventarios(customPage = page, customFiltros = filtros) {
    try {
      setLoading(true);

      const params: Record<string, unknown> = {
        page: customPage,
        limit,
        orderBy: sortField,
        orderDir: sortDir,
      };

      if (customFiltros.status) params.status = customFiltros.status;
      if (customFiltros.motivo_id) params.motivo_id = customFiltros.motivo_id;
      if (customFiltros.data_inicial) {
        params.data_inicial = customFiltros.data_inicial;
      }
      if (customFiltros.data_final) {
        params.data_final = customFiltros.data_final;
      }

      const { data } = await api.get("/inventario", { params });

      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      setInventarios(rows);
      setTotal(Number(data?.total || data?.meta?.total || rows.length || 0));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao carregar inventários");
      setInventarios([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  function updateFiltro(field: keyof typeof filtros, value: string) {
    setFiltros((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function buscar() {
    setPage(1);
    loadInventarios(1, filtros);
  }

  function limparFiltros() {
    const filtrosLimpos = {
      status: "",
      motivo_id: "",
      data_inicial: "",
      data_final: "",
    };

    setFiltros(filtrosLimpos);
    setPage(1);
    loadInventarios(1, filtrosLimpos);
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === "ASC" ? "DESC" : "ASC"));
      return;
    }

    setSortField(field);
    setSortDir(field === "id" ? "DESC" : "ASC");
  }

  function renderSortIcon(field: SortField) {
    if (sortField !== field) {
      return <FiChevronDown size={14} style={{ opacity: 0.35 }} />;
    }

    return sortDir === "ASC" ? (
      <FiChevronUp size={14} />
    ) : (
      <FiChevronDown size={14} />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Inventários"
        subtitle="Controle os inventários de estoque por status, motivo e período."
        action={
          <button
            type="button"
            style={buttonStyles.primary}
            onClick={() => navigate("/estoque/inventario/novo")}
          >
            <FiPlus size={15} /> Novo inventário
          </button>
        }
      />

      <DataCard
        title="Filtros"
        subtitle="Refine a busca por status, motivo e período."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr 150px 150px",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle}>Status</label>

            <select
              value={filtros.status}
              onChange={(e) => updateFiltro("status", e.target.value)}
              style={fieldStyle}
              onFocus={fieldFocusHandlers.onFocus}
              onBlur={fieldFocusHandlers.onBlur}
            >
              <option value="">Todos</option>
              <option value="ABERTO">Aberto</option>
              <option value="EM_CONFERENCIA">Em Conferência</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Motivo</label>

            <select
              value={filtros.motivo_id}
              onChange={(e) => updateFiltro("motivo_id", e.target.value)}
              style={fieldStyle}
              onFocus={fieldFocusHandlers.onFocus}
              onBlur={fieldFocusHandlers.onBlur}
            >
              <option value="">Todos</option>

              {motivos.map((motivo) => (
                <option key={motivo.id} value={motivo.id}>
                  {motivo.descricao}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Data inicial</label>

            <input
              type="date"
              value={filtros.data_inicial}
              onChange={(e) => updateFiltro("data_inicial", e.target.value)}
              style={fieldStyle}
              onFocus={fieldFocusHandlers.onFocus}
              onBlur={fieldFocusHandlers.onBlur}
            />
          </div>

          <div>
            <label style={labelStyle}>Data final</label>

            <input
              type="date"
              value={filtros.data_final}
              onChange={(e) => updateFiltro("data_final", e.target.value)}
              style={fieldStyle}
              onFocus={fieldFocusHandlers.onFocus}
              onBlur={fieldFocusHandlers.onBlur}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            style={{ ...buttonStyles.secondary, height: 40 }}
            onClick={limparFiltros}
            disabled={loading}
          >
            Limpar
          </button>

          <button
            type="button"
            style={{ ...buttonStyles.primary, height: 40 }}
            onClick={buscar}
            disabled={loading}
          >
            Buscar
          </button>
        </div>
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Lista de inventários"
        subtitle="Relação dos inventários cadastrados no sistema."
      >
        <div style={{ paddingBottom: 12, fontSize: 13, color: "#64748b" }}>
          {loading
            ? "Atualizando lista..."
            : `Exibindo ${inventarios.length} de ${safeTotal} registro(s)`}
        </div>

        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            minHeight: 470,
            maxHeight: 470,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <th
                  style={{ ...thStyle, width: 80, cursor: "pointer" }}
                  onClick={() => toggleSort("id")}
                >
                  <span style={sortHeaderStyle}>
                    ID {renderSortIcon("id")}
                  </span>
                </th>

                <th
                  style={{ ...thStyle, width: 130, cursor: "pointer" }}
                  onClick={() => toggleSort("data_inventario")}
                >
                  <span style={sortHeaderStyle}>
                    Data {renderSortIcon("data_inventario")}
                  </span>
                </th>

                <th style={{ ...thStyle, width: 220 }}>Motivo</th>

                <th
                  style={{ ...thStyle, width: 150, cursor: "pointer" }}
                  onClick={() => toggleSort("status")}
                >
                  <span style={sortHeaderStyle}>
                    Status {renderSortIcon("status")}
                  </span>
                </th>

                <th style={{ ...thStyle, width: "40%" }}>Observação</th>

                <th style={{ ...thStyle, width: 100, textAlign: "center" }}>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && inventarios.length === 0 ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Carregando inventários...
                  </td>
                </tr>
              ) : !loading && inventarios.length === 0 ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Nenhum inventário encontrado.
                  </td>
                </tr>
              ) : (
                inventarios.map((item, index) => (
                  <tr
                    key={item.id}
                    style={{ borderTop: "1px solid #e5e7eb", background: index % 2 === 0 ? "#fff" : "#f9fafb" }}
                  >
                    <td style={tdStyle}>
                      <strong>#{item.id}</strong>
                    </td>

                    <td style={tdStyle}>{formatDate(item.data_inventario)}</td>

                    <td style={tdStyle}>{item.motivo?.descricao || "-"}</td>

                    <td style={tdStyle}>
                      <span style={getBadgeStyle(item.status)}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        lineHeight: 1.35,
                      }}
                    >
                      {item.observacao || "-"}
                    </td>

                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <button
                        type="button"
                        style={iconButtonStyle}
                        title="Visualizar inventário"
                        onClick={() => navigate(`/estoque/inventario/${item.id}`)}
                      >
                        <FiEye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
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
                ...fieldStyle,
                width: 90,
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
      </DataCard>
    </PageShell>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 800,
  color: "#374151",
  marginBottom: 6,
};

const fieldStyle: React.CSSProperties = {
  ...filterStyles.input,
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  height: 40,
};

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "#64748b",
  whiteSpace: "nowrap",
  position: "sticky",
  top: 0,
  background: "#f8fafc",
  zIndex: 1,
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
  color: "#334155",
  verticalAlign: "middle",
};

const emptyStyle: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
};

const iconButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#334155",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const sortHeaderStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  userSelect: "none",
};