import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiChevronDown,
    FiChevronLeft,
    FiChevronRight,
    FiChevronUp,
    FiEye,
    FiPlus,
    FiSearch,
    FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api/api";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { tableStyles } from "../../styles/table";
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
    const limit = 10;
    const [total, setTotal] = useState(0);

    const [sortField, setSortField] = useState<SortField>("id");
    const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");

    const [filtros, setFiltros] = useState({
        status: "",
        motivo_id: "",
        data_inicial: "",
        data_final: "",
    });

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(total / limit));
    }, [total]);

    const resumo = useMemo(() => {
        const totalInventarios = inventarios.length;
        const abertos = inventarios.filter(
            (i) => String(i.status).toUpperCase() === "ABERTO"
        ).length;
        const emConferencia = inventarios.filter(
            (i) => String(i.status).toUpperCase() === "EM_CONFERENCIA"
        ).length;
        const confirmados = inventarios.filter(
            (i) => String(i.status).toUpperCase() === "CONFIRMADO"
        ).length;

        return {
            totalInventarios,
            abertos,
            emConferencia,
            confirmados,
        };
    }, [inventarios]);

    useEffect(() => {
        loadMotivos();
    }, []);

    useEffect(() => {
        loadInventarios(page);
    }, [page, sortField, sortDir]);

    async function loadMotivos() {
        try {
            const { data } = await api.get("/inventario-motivos", {
                params: {
                    page: 1,
                    limit: 200,
                    ativo: true,
                    orderBy: "descricao",
                    orderDir: "ASC",
                },
            });

            setMotivos(Array.isArray(data?.data) ? data.data : []);
        } catch (err) {
            console.error(err);
        }
    }

    async function loadInventarios(
        customPage = 1,
        customFiltros = filtros,
        customSortField = sortField,
        customSortDir = sortDir
    ) {
        try {
            setLoading(true);

            const params: Record<string, unknown> = {
                page: customPage,
                limit,
                orderBy: customSortField,
                orderDir: customSortDir,
            };

            if (customFiltros.status) params.status = customFiltros.status;
            if (customFiltros.motivo_id) params.motivo_id = customFiltros.motivo_id;
            if (customFiltros.data_inicial) params.data_inicial = customFiltros.data_inicial;
            if (customFiltros.data_final) params.data_final = customFiltros.data_final;

            const { data } = await api.get("/inventario", { params });

            setInventarios(Array.isArray(data?.data) ? data.data : []);
            setTotal(Number(data?.total || 0));
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Erro ao carregar inventários");
        } finally {
            setLoading(false);
        }
    }

    function updateFiltro(field: string, value: string) {
        setFiltros((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    function handlePesquisar() {
        setPage(1);
        loadInventarios(1, filtros);
    }

    function handleLimpar() {
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

    function handleQuickStatus(status: string) {
        const novosFiltros = {
            ...filtros,
            status,
        };

        setFiltros(novosFiltros);
        setPage(1);
        loadInventarios(1, novosFiltros);
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

    function isQuickStatusActive(status: string) {
        return String(filtros.status || "") === status;
    }

    return (
        <div style={layoutStyles.page}>
            <div style={styles.headerTop}>
                <div>
                    <h1 style={styles.title}>Inventários</h1>
                    <p style={styles.subtitle}>
                        Acompanhe inventários abertos, em conferência, confirmados e cancelados.
                    </p>
                </div>

                <div style={styles.headerActions}>
                    <button
                        type="button"
                        style={buttonStyles.primary}
                        onClick={() => navigate("/estoque/inventario/novo")}
                    >
                        <FiPlus size={16} style={{ marginRight: 8 }} />
                        Novo inventário
                    </button>
                </div>
            </div>

            <div style={styles.quickFilterRow}>
                <button
                    type="button"
                    style={{
                        ...styles.quickFilterButton,
                        ...(filtros.status === "" ? styles.quickFilterButtonActive : {}),
                    }}
                    onClick={() => handleQuickStatus("")}
                >
                    Todos
                </button>

                <button
                    type="button"
                    style={{
                        ...styles.quickFilterButton,
                        ...(isQuickStatusActive("ABERTO") ? styles.quickFilterButtonActiveBlue : {}),
                    }}
                    onClick={() => handleQuickStatus("ABERTO")}
                >
                    Abertos
                </button>

                <button
                    type="button"
                    style={{
                        ...styles.quickFilterButton,
                        ...(isQuickStatusActive("EM_CONFERENCIA")
                            ? styles.quickFilterButtonActiveYellow
                            : {}),
                    }}
                    onClick={() => handleQuickStatus("EM_CONFERENCIA")}
                >
                    Em conferência
                </button>

                <button
                    type="button"
                    style={{
                        ...styles.quickFilterButton,
                        ...(isQuickStatusActive("CONFIRMADO")
                            ? styles.quickFilterButtonActiveGreen
                            : {}),
                    }}
                    onClick={() => handleQuickStatus("CONFIRMADO")}
                >
                    Confirmados
                </button>

                <button
                    type="button"
                    style={{
                        ...styles.quickFilterButton,
                        ...(isQuickStatusActive("CANCELADO")
                            ? styles.quickFilterButtonActiveRed
                            : {}),
                    }}
                    onClick={() => handleQuickStatus("CANCELADO")}
                >
                    Cancelados
                </button>
            </div>

            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <span style={styles.statLabel}>Exibidos</span>
                    <span style={styles.statValue}>{resumo.totalInventarios}</span>
                </div>

                <div style={styles.statCard}>
                    <span style={styles.statLabel}>Abertos</span>
                    <span style={{ ...styles.statValue, color: "#1d4ed8" }}>
                        {resumo.abertos}
                    </span>
                </div>

                <div style={styles.statCard}>
                    <span style={styles.statLabel}>Em conferência</span>
                    <span style={{ ...styles.statValue, color: "#b45309" }}>
                        {resumo.emConferencia}
                    </span>
                </div>

                <div style={styles.statCard}>
                    <span style={styles.statLabel}>Confirmados</span>
                    <span style={{ ...styles.statValue, color: "#15803d" }}>
                        {resumo.confirmados}
                    </span>
                </div>
            </div>

            <div style={layoutStyles.card}>
                <div style={styles.sectionTitleRow}>
                    <div style={styles.sectionTitle}>Filtros</div>
                    <div style={styles.sectionHint}>Refine a busca por status, motivo e período.</div>
                </div>

                <div style={layoutStyles.cardCompact}>
                    <div style={styles.filtersGrid}>
                        <div style={styles.fieldWrap}>
                            <label style={styles.label}>Status</label>
                            <select
                                value={filtros.status}
                                onChange={(e) => updateFiltro("status", e.target.value)}
                                style={{ ...filterStyles.select, height: 38, padding: "0 12px" }}
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

                        <div style={styles.fieldWrap}>
                            <label style={styles.label}>Motivo</label>
                            <select
                                value={filtros.motivo_id}
                                onChange={(e) => updateFiltro("motivo_id", e.target.value)}
                                style={{ ...filterStyles.select, height: 38, padding: "0 12px" }}
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

                        <div style={styles.fieldWrap}>
                            <label style={styles.label}>Data inicial</label>
                            <input
                                type="date"
                                value={filtros.data_inicial}
                                onChange={(e) => updateFiltro("data_inicial", e.target.value)}
                                style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                                onFocus={fieldFocusHandlers.onFocus}
                                onBlur={fieldFocusHandlers.onBlur}
                            />
                        </div>

                        <div style={styles.fieldWrap}>
                            <label style={styles.label}>Data final</label>
                            <input
                                type="date"
                                value={filtros.data_final}
                                onChange={(e) => updateFiltro("data_final", e.target.value)}
                                style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                                onFocus={fieldFocusHandlers.onFocus}
                                onBlur={fieldFocusHandlers.onBlur}
                            />
                        </div>
                    </div>

                    <div style={styles.filterActions}>
                        <button
                            type="button"
                            style={buttonStyles.secondary}
                            onClick={handleLimpar}
                        >
                            <FiX size={16} style={{ marginRight: 8 }} />
                            Limpar
                        </button>

                        <button
                            type="button"
                            style={buttonStyles.primary}
                            onClick={handlePesquisar}
                        >
                            <FiSearch size={16} style={{ marginRight: 8 }} />
                            Pesquisar
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ height: 22 }} />

            <div style={layoutStyles.card}>
                <div style={styles.sectionTitleRow}>
                    <div style={styles.sectionTitle}>Lista de Inventários</div>
                    <div style={styles.sectionHint}>
                        {loading ? "Carregando..." : `${total} registro(s) encontrado(s)`}
                    </div>
                </div>

                <div style={{ overflowX: "auto", marginTop: 12 }}>
                    <table style={{ ...tableStyles.table, tableLayout: "auto" }}>
                        <thead>
                            <tr>
                                <th
                                    style={{ ...tableStyles.th, width: 80, cursor: "pointer" }}
                                    onClick={() => toggleSort("id")}
                                >
                                    <div style={styles.sortHeader}>
                                        ID
                                        {renderSortIcon("id")}
                                    </div>
                                </th>

                                <th
                                    style={{ ...tableStyles.th, width: 140, cursor: "pointer" }}
                                    onClick={() => toggleSort("data_inventario")}
                                >
                                    <div style={styles.sortHeader}>
                                        Data
                                        {renderSortIcon("data_inventario")}
                                    </div>
                                </th>

                                <th style={{ ...tableStyles.th, width: 220 }}>Motivo</th>

                                <th
                                    style={{ ...tableStyles.th, width: 160, cursor: "pointer" }}
                                    onClick={() => toggleSort("status")}
                                >
                                    <div style={styles.sortHeader}>
                                        Status
                                        {renderSortIcon("status")}
                                    </div>
                                </th>

                                <th style={{ ...tableStyles.th, width: "42%" }}>Observação</th>

                                <th style={{ ...tableStyles.th, width: 100, textAlign: "center" }}>
                                    Ações
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={6} style={styles.emptyState}>
                                        Carregando inventários...
                                    </td>
                                </tr>
                            )}

                            {!loading && inventarios.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={styles.emptyState}>
                                        Nenhum inventário encontrado.
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                inventarios.map((item, idx) => (
                                    <tr
                                        key={item.id}
                                        style={{ background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}
                                    >
                                        <td style={tableStyles.td}>
                                            <strong style={{ color: "#0f172a" }}>#{item.id}</strong>
                                        </td>

                                        <td style={tableStyles.td}>{formatDate(item.data_inventario)}</td>

                                        <td style={tableStyles.td}>
                                            {item.motivo?.descricao || "-"}
                                        </td>

                                        <td style={tableStyles.td}>
                                            <span style={getBadgeStyle(item.status)}>
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </td>

                                        <td
                                            style={{
                                                ...tableStyles.td,
                                                whiteSpace: "normal",
                                                wordBreak: "break-word",
                                                lineHeight: 1.35,
                                            }}
                                        >
                                            {item.observacao || "-"}
                                        </td>

                                        <td style={{ ...tableStyles.td, textAlign: "center" }}>
                                            <button
                                                type="button"
                                                style={styles.iconButton}
                                                title="Visualizar inventário"
                                                onClick={() => navigate(`/estoque/inventario/${item.id}`)}
                                            >
                                                <FiEye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <div style={styles.pagination}>
                    <button
                        type="button"
                        style={buttonStyles.secondary}
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                        <FiChevronLeft size={16} style={{ marginRight: 6 }} />
                        Anterior
                    </button>

                    <div style={styles.paginationInfo}>
                        Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                    </div>

                    <button
                        type="button"
                        style={buttonStyles.secondary}
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                        Próxima
                        <FiChevronRight size={16} style={{ marginLeft: 6 }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    headerTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        marginBottom: 16,
        flexWrap: "wrap",
    },
    title: {
        fontSize: 28,
        fontWeight: 700,
        marginBottom: 4,
        color: "#0f172a",
    },
    subtitle: {
        color: "#64748b",
        fontSize: 14,
        lineHeight: 1.45,
        maxWidth: 580,
        margin: 0,
    },
    headerActions: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "flex-end",
    },
    quickFilterRow: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 20,
    },
    quickFilterButton: {
        border: "1px solid #dbe2ea",
        background: "#fff",
        color: "#334155",
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
    },
    quickFilterButtonActive: {
        background: "#0f172a",
        color: "#fff",
        borderColor: "#0f172a",
    },
    quickFilterButtonActiveBlue: {
        background: "#dbeafe",
        color: "#1d4ed8",
        borderColor: "#bfdbfe",
    },
    quickFilterButtonActiveYellow: {
        background: "#fef3c7",
        color: "#92400e",
        borderColor: "#fcd34d",
    },
    quickFilterButtonActiveGreen: {
        background: "#dcfce7",
        color: "#166534",
        borderColor: "#86efac",
    },
    quickFilterButtonActiveRed: {
        background: "#fee2e2",
        color: "#991b1b",
        borderColor: "#fca5a5",
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16,
        marginBottom: 20,
    },
    statCard: {
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        border: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    statLabel: {
        fontSize: 13,
        color: "#64748b",
    },
    statValue: {
        fontSize: 22,
        fontWeight: 700,
        marginTop: 4,
        color: "#0f172a",
    },
    sectionTitleRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        paddingBottom: 12,
        marginBottom: 14,
        borderBottom: "1px solid #eef2f7",
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 800,
        color: "#0f172a",
    },
    sectionHint: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: 600,
    },
    filtersGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
    },
    fieldWrap: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
    },
    label: {
        fontSize: 12,
        fontWeight: 700,
        color: "#374151",
    },
    filterActions: {
        marginTop: 16,
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        flexWrap: "wrap",
    },
    iconButton: {
        width: 34,
        height: 34,
        borderRadius: 8,
        border: "1px solid #dbe2ea",
        background: "#fff",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
    },
    sortHeader: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        userSelect: "none",
    },
    pagination: {
        marginTop: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
    },
    paginationInfo: {
        fontSize: 14,
        color: "#475569",
    },
    emptyState: {
        textAlign: "center",
        color: "#64748b",
        padding: 24,
    },
};