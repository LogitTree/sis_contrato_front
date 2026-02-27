import { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import type { EmpresaContratada } from "../../types/EmpresaContratada";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { badgeStyles } from "../../styles/badges";
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

export default function EmpresasList() {
    const [empresas, setEmpresas] = useState<EmpresaContratada[]>([]);
    const [loading, setLoading] = useState(true);

    // filtros
    const [filtroTexto, setFiltroTexto] = useState("");
    const [debouncedFiltro, setDebouncedFiltro] = useState("");
    const [status, setStatus] = useState("");

    // ordenação
    const [sort, setSort] = useState<"id" | "razao_social" | "cnpj" | "status">("id");
    const [order, setOrder] = useState<"ASC" | "DESC">("ASC");

    // paginação
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(10);

    const navigate = useNavigate();

    const safeTotal = Number.isFinite(total) && total > 0 ? total : empresas.length;
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

    async function fetchEmpresas() {
        setLoading(true);

        const params: any = { page, limit, sort, order };

        if (debouncedFiltro) {
            if (/\d/.test(debouncedFiltro)) params.cnpj = debouncedFiltro;
            else params.razao_social = debouncedFiltro;
        }

        if (status) params.status = status;

        try {
            const response = await api.get("/empresas", { params });
            setEmpresas(response.data.data || []);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar empresas");
        } finally {
            setLoading(false);
        }
    }

    // debounce do texto
    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedFiltro(filtroTexto), 450);
        return () => clearTimeout(timeout);
    }, [filtroTexto]);

    // buscar ao mudar filtros/paginação/ordenação
    useEffect(() => {
        fetchEmpresas();
    }, [page, debouncedFiltro, status, sort, order]);

    // reset de página ao mudar filtros/ordenação
    useEffect(() => setPage(1), [filtroTexto, status, sort, order]);

    async function handleDelete(id: number) {
        if (!window.confirm("Tem certeza que deseja excluir esta empresa?")) return;

        try {
            await api.delete(`/empresas/${id}`);
            toast.success("Empresa excluída com sucesso");
            fetchEmpresas();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao excluir empresa");
        }
    }

    return (
        <div style={layoutStyles.page}>
            {/* HEADER */}
            <div style={layoutStyles.header}>
                <div>
                    <h1 style={layoutStyles.title}>Empresas</h1>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                        {loading ? "Carregando..." : `${safeTotal} empresa(s) encontrada(s)`}
                    </div>
                </div>
            </div>

            {/* FILTROS */}
            <div style={layoutStyles.cardCompact}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 16, width: "100%" }}>
                    {/* Busca ocupa tudo */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                            Razão Social / CNPJ
                        </label>
                        <div style={{ display: "flex", gap: 0, alignItems: "end" }}>
                            <div style={{ flex: 1 }}></div>
                            <input
                                type="text"
                                placeholder="Buscar por razão social ou CNPJ"
                                value={filtroTexto}
                                onChange={(e) => setFiltroTexto(e.target.value)}
                                style={{ ...filterStyles.input, width: "100%" }}
                                {...fieldFocusHandlers}
                            />
                        </div>
                    </div>

                    {/* Status fixo */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            style={{ ...filterStyles.select, width: "100%" }}
                            {...fieldFocusHandlers}
                        >
                            <option value="">Todos</option>
                            <option value="ATIVA">Ativa</option>
                            <option value="INATIVA">Inativa</option>
                        </select>
                    </div>

                    {(filtroTexto || status) && (
                        <button
                            style={{ ...buttonStyles.link, marginBottom: 2 }}
                            onClick={() => {
                                setFiltroTexto("");
                                setStatus("");
                            }}
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

                <button style={buttonStyles.primary} onClick={() => navigate("/empresas/nova")}>
                    + Nova Empresa
                </button>
            </div>

            {/* TABELA */}
            <div style={layoutStyles.card}>
                <div style={{ paddingBottom: 12, fontSize: 13, color: "#64748b" }}>
                    Exibindo {empresas.length} de {safeTotal} registro(s)
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
                                    style={{ ...tableStyles.th, width: "45%", cursor: "pointer" }}
                                    onClick={() => handleSort("razao_social")}
                                >
                                    Razão Social {renderSortIcon("razao_social")}
                                </th>

                                <th
                                    style={{ ...tableStyles.th, width: "25%", cursor: "pointer" }}
                                    onClick={() => handleSort("cnpj")}
                                >
                                    CNPJ {renderSortIcon("cnpj")}
                                </th>

                                <th
                                    style={{ ...tableStyles.th, width: 140, cursor: "pointer" }}
                                    onClick={() => handleSort("status")}
                                >
                                    Status {renderSortIcon("status")}
                                </th>

                                <th style={{ ...tableStyles.th, width: 120, textAlign: "center" }}>Ações</th>
                            </tr>
                        </thead>

                        <tbody>
                            {empresas.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                                        Nenhuma empresa encontrada.
                                    </td>
                                </tr>
                            )}

                            {empresas.map((e, index) => (
                                <tr key={e.id} style={tableStyles.row(index)}>
                                    <td style={tableStyles.td}>{e.id}</td>

                                    <td style={{ ...tableStyles.td, ...tableStyles.tdWrap }}>
                                        {e.razao_social}
                                    </td>

                                    <td style={tableStyles.td}>{e.cnpj}</td>

                                    <td style={tableStyles.td}>
                                        <span
                                            style={{
                                                ...badgeStyles.base,
                                                ...(e.status === "ATIVA" ? badgeStyles.success : badgeStyles.danger),
                                            }}
                                        >
                                            {e.status}
                                        </span>
                                    </td>

                                    <td style={{ ...tableStyles.td, textAlign: "center" }}>
                                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                                            <button
                                                title="Editar"
                                                style={buttonStyles.icon}
                                                onClick={() => navigate(`/empresas/${e.id}/editar`)}
                                                onMouseEnter={(ev) => (ev.currentTarget.style.background = "rgba(37,99,235,0.08)")}
                                                onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                                            >
                                                <FiEdit size={18} color="#2563eb" />
                                            </button>

                                            <button
                                                title="Excluir"
                                                style={buttonStyles.icon}
                                                onClick={() => handleDelete(e.id)}
                                                onMouseEnter={(ev) => (ev.currentTarget.style.background = "rgba(220,38,38,0.08)")}
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