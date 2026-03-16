import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
    FiChevronLeft,
    FiChevronRight,
    FiXCircle,
    FiEye,
} from "react-icons/fi";

type ContaStatus =
    | "ABERTO"
    | "PARCIAL"
    | "PAGO"
    | "VENCIDO"
    | "CANCELADO";

type ContaRow = {
    id: number;
    compra_id: number;
    fornecedor_id: number;
    numero_documento?: string | null;
    descricao?: string | null;
    parcela: number;
    total_parcelas: number;
    data_emissao?: string | null;
    data_vencimento?: string | null;
    valor_original?: string | number | null;
    valor_pago?: string | number | null;
    saldo?: string | number | null;
    status?: ContaStatus;
    forma_pagamento?: string | null;
    observacao?: string | null;

    fornecedor?: {
        id: number;
        nome?: string;
        razao_social?: string;
        nome_fantasia?: string;
    };

    compra?: {
        id: number;
        data_pedido?: string | null;
        numero_nota_fiscal?: string | null;
        valor_total?: string | number | null;
    };
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
    if (Array.isArray(resData)) {
        return {
            data: resData,
            total: resData.length,
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

function isVencida(status: any, dataVencimento: any) {
    const s = String(status || "").toUpperCase();
    if (s === "PAGO" || s === "CANCELADO") return false;
    if (!dataVencimento) return false;

    const hoje = new Date();
    const venc = new Date(`${String(dataVencimento).slice(0, 10)}T00:00:00`);

    hoje.setHours(0, 0, 0, 0);
    venc.setHours(0, 0, 0, 0);

    return venc < hoje;
}

function diasEmAtraso(dataVencimento: any) {
    if (!dataVencimento) return 0;

    const hoje = new Date();
    const venc = new Date(`${String(dataVencimento).slice(0, 10)}T00:00:00`);

    hoje.setHours(0, 0, 0, 0);
    venc.setHours(0, 0, 0, 0);

    const diff = hoje.getTime() - venc.getTime();
    if (diff <= 0) return 0;

    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function rowAccent(status: any, dataVencimento: any): string {
    const s = String(status || "").toUpperCase();

    if (s === "PAGO") return "#22c55e";
    if (s === "PARCIAL") return "#f59e0b";
    if (s === "CANCELADO") return "#9ca3af";
    if (isVencida(status, dataVencimento) || s === "VENCIDO") return "#ef4444";
    return "#3b82f6";
}

function statusStyle(status: any, dataVencimento?: any) {
    const s = String(status || "").toUpperCase();

    if (s === "PAGO") {
        return { background: "#dcfce7", color: "#166534" };
    }

    if (s === "PARCIAL") {
        return { background: "#fef3c7", color: "#92400e" };
    }

    if (s === "CANCELADO") {
        return { background: "#e5e7eb", color: "#374151" };
    }

    if (s === "VENCIDO" || isVencida(status, dataVencimento)) {
        return { background: "#fee2e2", color: "#991b1b" };
    }

    return { background: "#dbeafe", color: "#1e40af" };
}

export default function ContasPagarList() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [rows, setRows] = useState<ContaRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [filtroFornecedorId, setFiltroFornecedorId] = useState("");
    const [filtroStatus, setFiltroStatus] = useState("");
    const [filtroCompraId, setFiltroCompraId] = useState(
        searchParams.get("compra_id") || ""
    );
    const [filtroDocumento, setFiltroDocumento] = useState("");

    const [filtroVencimentoInicio, setFiltroVencimentoInicio] = useState("");
    const [filtroVencimentoFim, setFiltroVencimentoFim] = useState("");
    const [somenteEmAberto, setSomenteEmAberto] = useState(false);
    const [somenteVencidas, setSomenteVencidas] = useState(false);

    const [orderBy, setOrderBy] = useState<
        "id" | "data_vencimento" | "status" | "fornecedor_id" | "compra_id"
    >("data_vencimento");
    const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("ASC");

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);

    const [fornecedoresOptions, setFornecedoresOptions] = useState<
        FornecedorOption[]
    >([]);

    const [cancelingId, setCancelingId] = useState<number | null>(null);

    const hasFilters =
        !!filtroFornecedorId ||
        !!filtroStatus ||
        !!filtroCompraId ||
        !!filtroDocumento ||
        !!filtroVencimentoInicio ||
        !!filtroVencimentoFim ||
        somenteEmAberto ||
        somenteVencidas;

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

    const resumoTotais = useMemo(() => {
        return rows.reduce(
            (acc, row) => {
                acc.valorOriginal += parseDecimalApi(row.valor_original);
                acc.valorPago += parseDecimalApi(row.valor_pago);
                acc.saldo += parseDecimalApi(row.saldo);
                return acc;
            },
            { valorOriginal: 0, valorPago: 0, saldo: 0 }
        );
    }, [rows]);

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
            console.warn("Erro ao carregar fornecedores", err);
        }
    }

    async function carregarContas() {
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
        if (filtroCompraId) params.compra_id = Number(filtroCompraId);
        if (filtroDocumento) params.numero_documento = filtroDocumento;
        if (filtroVencimentoInicio) params.vencimento_inicio = filtroVencimentoInicio;
        if (filtroVencimentoFim) params.vencimento_fim = filtroVencimentoFim;
        if (somenteEmAberto) params.somente_em_aberto = true;
        if (somenteVencidas) params.somente_vencidas = true;

        try {
            const res = await api.get("/contas-pagar", { params });
            const { data, total } = pickListResponse(res.data);
            setRows(data);
            setTotal(total);
        } catch (e) {
            console.error(e);
            toast.error("Erro ao carregar contas a pagar");
        } finally {
            setLoading(false);
        }
    }

    async function cancelarConta(row: ContaRow) {
        const id = Number(row?.id);
        if (!id) return;

        const fornecedorIdNum = Number(row?.fornecedor_id);
        const fornecedorNome =
            row?.fornecedor?.nome ??
            fornecedoresMap.get(fornecedorIdNum)?.nome ??
            (fornecedorIdNum ? `Fornecedor #${fornecedorIdNum}` : "-");

        const ok = window.confirm(
            `Cancelar a conta #${id}?\nFornecedor: ${fornecedorNome}\nParcela: ${row.parcela}/${row.total_parcelas}`
        );
        if (!ok) return;

        setCancelingId(id);
        try {
            await api.put(`/contas-pagar/${id}/cancelar`);
            toast.success("Conta cancelada!");
            await carregarContas();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Erro ao cancelar conta");
        } finally {
            setCancelingId(null);
        }
    }

    useEffect(() => {
        loadFornecedores();
        carregarContas();
    }, []);

    useEffect(() => {
        const compraIdFromUrl = searchParams.get("compra_id") || "";
        setFiltroCompraId(compraIdFromUrl);
    }, [searchParams]);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            carregarContas();
        }, 400);

        return () => clearTimeout(t);
    }, [
        filtroFornecedorId,
        filtroStatus,
        filtroCompraId,
        filtroDocumento,
        filtroVencimentoInicio,
        filtroVencimentoFim,
        somenteEmAberto,
        somenteVencidas,
        orderBy,
        orderDir,
    ]);

    useEffect(() => {
        carregarContas();
    }, [page]);

    function handleSort(
        coluna: "id" | "data_vencimento" | "status" | "fornecedor_id" | "compra_id"
    ) {
        if (orderBy === coluna) {
            setOrderDir((prev) => (prev === "ASC" ? "DESC" : "ASC"));
        } else {
            setOrderBy(coluna);
            setOrderDir("ASC");
        }
    }

    const totalPages = Math.ceil(total / limit);

    return (
        <div style={layoutStyles.page}>
            <div style={layoutStyles.header}>
                <h1 style={layoutStyles.title}>Contas a Pagar</h1>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                    {total} conta(s) encontrada(s)
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
                                disabled={loading || cancelingId !== null}
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
                                width: 180,
                            }}
                        >
                            <label
                                style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}
                            >
                                Compra ID
                            </label>
                            <input
                                value={filtroCompraId}
                                onChange={(e) => setFiltroCompraId(e.target.value)}
                                style={{
                                    ...filterStyles.input,
                                    height: 36,
                                    padding: "0 12px",
                                }}
                                placeholder="Ex.: 15"
                                disabled={loading || cancelingId !== null}
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
                            <label
                                style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}
                            >
                                Documento
                            </label>
                            <input
                                value={filtroDocumento}
                                onChange={(e) => setFiltroDocumento(e.target.value)}
                                style={{
                                    ...filterStyles.input,
                                    height: 36,
                                    padding: "0 12px",
                                }}
                                placeholder="Número documento"
                                disabled={loading || cancelingId !== null}
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
                                Vencimento de
                            </label>
                            <input
                                type="date"
                                value={filtroVencimentoInicio}
                                onChange={(e) => setFiltroVencimentoInicio(e.target.value)}
                                style={{
                                    ...filterStyles.input,
                                    height: 36,
                                    padding: "0 12px",
                                }}
                                disabled={loading || cancelingId !== null}
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
                                Vencimento até
                            </label>
                            <input
                                type="date"
                                value={filtroVencimentoFim}
                                onChange={(e) => setFiltroVencimentoFim(e.target.value)}
                                style={{
                                    ...filterStyles.input,
                                    height: 36,
                                    padding: "0 12px",
                                }}
                                disabled={loading || cancelingId !== null}
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
                                Situação rápida
                            </label>
                            <select
                                value={
                                    somenteVencidas
                                        ? "vencidas"
                                        : somenteEmAberto
                                            ? "aberto"
                                            : ""
                                }
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSomenteEmAberto(value === "aberto");
                                    setSomenteVencidas(value === "vencidas");
                                }}
                                style={{
                                    ...filterStyles.select,
                                    height: 36,
                                    padding: "0 12px",
                                }}
                                disabled={loading || cancelingId !== null}
                            >
                                <option value="">Todos</option>
                                <option value="aberto">Somente em aberto</option>
                                <option value="vencidas">Somente vencidas</option>
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
                                disabled={loading || cancelingId !== null}
                            >
                                <option value="">Todos</option>
                                <option value="ABERTO">Aberto</option>
                                <option value="PARCIAL">Parcial</option>
                                <option value="PAGO">Pago</option>
                                <option value="VENCIDO">Vencido</option>
                                <option value="CANCELADO">Cancelado</option>
                            </select>
                        </div>

                        <div style={{ flex: 1 }} />

                        {hasFilters && (
                            <button
                                style={{ ...buttonStyles.link, marginBottom: 2 }}
                                onClick={() => {
                                    setFiltroFornecedorId("");
                                    setFiltroStatus("");
                                    setFiltroCompraId("");
                                    setFiltroDocumento("");
                                    setFiltroVencimentoInicio("");
                                    setFiltroVencimentoFim("");
                                    setSomenteEmAberto(false);
                                    setSomenteVencidas(false);
                                    navigate("/contas-pagar");
                                }}
                                disabled={loading || cancelingId !== null}
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
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    margin: "12px 0 16px",
                    flexWrap: "wrap",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 18,
                        flexWrap: "wrap",
                        fontSize: 13,
                        color: "#475569",
                    }}
                >
                    <span>
                        <strong>Total:</strong> {formatMoneyBR(resumoTotais.valorOriginal)}
                    </span>
                    <span>
                        <strong>Pago:</strong> {formatMoneyBR(resumoTotais.valorPago)}
                    </span>
                    <span>
                        <strong>Saldo:</strong> {formatMoneyBR(resumoTotais.saldo)}
                    </span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button
                        style={buttonStyles.secondary}
                        onClick={() => {
                            const params = new URLSearchParams();

                            if (filtroFornecedorId) params.append("fornecedor_id", filtroFornecedorId);
                            if (filtroStatus) params.append("status", filtroStatus);
                            if (filtroCompraId) params.append("compra_id", filtroCompraId);
                            if (filtroDocumento) params.append("numero_documento", filtroDocumento);
                            if (filtroVencimentoInicio) params.append("vencimento_inicio", filtroVencimentoInicio);
                            if (filtroVencimentoFim) params.append("vencimento_fim", filtroVencimentoFim);
                            if (somenteEmAberto) params.append("somente_em_aberto", "true");
                            if (somenteVencidas) params.append("somente_vencidas", "true");

                            const token = localStorage.getItem("@contratos:token");
                            const urlBase = `${api.defaults.baseURL}/contas-pagar/relatorio/pdf?${params.toString()}`;

                            // abre passando token via query só se seu backend permitir;
                            // se não permitir, use fetch/blob abaixo
                            fetch(urlBase, {
                                headers: token ? { Authorization: `Bearer ${token}` } : {},
                            })
                                .then(async (response) => {
                                    if (!response.ok) throw new Error("Erro ao gerar relatório");
                                    const blob = await response.blob();
                                    const blobUrl = window.URL.createObjectURL(blob);
                                    window.open(blobUrl, "_blank");
                                })
                                .catch(() => {
                                    toast.error("Erro ao gerar relatório PDF");
                                });
                        }}
                        disabled={loading || cancelingId !== null}
                    >
                        Relatório PDF
                    </button>
                    <button
                        style={buttonStyles.link}
                        onClick={() => navigate(-1)}
                        disabled={loading || cancelingId !== null}
                    >
                        Voltar
                    </button>
                </div>
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
                                    style={{ ...tableStyles.th, width: 40, cursor: "pointer" }}
                                    onClick={() => handleSort("id")}
                                >
                                    ID {orderBy === "id" && (orderDir === "ASC" ? "▲" : "▼")}
                                </th>

                                <th
                                    style={{ ...tableStyles.th, width: 220, cursor: "pointer" }}
                                    onClick={() => handleSort("fornecedor_id")}
                                >
                                    Fornecedor{" "}
                                    {orderBy === "fornecedor_id" &&
                                        (orderDir === "ASC" ? "▲" : "▼")}
                                </th>

                                <th
                                    style={{
                                        ...tableStyles.th,
                                        width: 120,
                                        textAlign: "center",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => handleSort("compra_id")}
                                >
                                    {orderBy === "compra_id" && (orderDir === "ASC" ? "▲" : "▼")}
                                </th>

                                <th style={{ ...tableStyles.th, width: 70, textAlign: "center" }}>
                                    Parcela
                                </th>

                                <th
                                    style={{ ...tableStyles.th, width: 130, cursor: "pointer" }}
                                    onClick={() => handleSort("data_vencimento")}
                                >
                                    Vencimento{" "}
                                    {orderBy === "data_vencimento" &&
                                        (orderDir === "ASC" ? "▲" : "▼")}
                                </th>

                                <th style={{ ...tableStyles.th, width: 110, textAlign: "right" }}>
                                    Valor
                                </th>

                                <th style={{ ...tableStyles.th, width: 110, textAlign: "right" }}>
                                    Pago
                                </th>

                                <th style={{ ...tableStyles.th, width: 110, textAlign: "right" }}>
                                    Saldo
                                </th>

                                <th
                                    style={{ ...tableStyles.th, width: 130, cursor: "pointer" }}
                                    onClick={() => handleSort("status")}
                                >
                                    Status{" "}
                                    {orderBy === "status" && (orderDir === "ASC" ? "▲" : "▼")}
                                </th>

                                <th
                                    style={{ ...tableStyles.th, width: 120, textAlign: "center" }}
                                >
                                    Ações
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={10} style={{ textAlign: "center", padding: 20 }}>
                                        Nenhuma conta a pagar encontrada.
                                    </td>
                                </tr>
                            )}

                            {rows.map((r: ContaRow, index) => {
                                const isCanceling = cancelingId === Number(r.id);

                                const fornecedorIdNum = Number(r?.fornecedor_id);
                                const fornecedorNome =
                                    r?.fornecedor?.nome ??
                                    fornecedoresMap.get(fornecedorIdNum)?.nome ??
                                    (fornecedorIdNum ? `Fornecedor #${fornecedorIdNum}` : "-");

                                const status = String(r.status || "").toUpperCase();
                                const podeCancelar =
                                    status === "ABERTO" || status === "VENCIDO";

                                return (
                                    <tr
                                        key={r.id}
                                        style={{
                                            background: index % 2 === 0 ? "#fff" : "#f8fafc",
                                            opacity: isCanceling ? 0.65 : 1,
                                            boxShadow: `inset 3px 0 0 ${rowAccent(
                                                r.status,
                                                r.data_vencimento
                                            )}`,
                                        }}
                                    >
                                        <td style={tdCompact}>{r.id}</td>

                                        <td
                                            style={{
                                                ...tdCompact,
                                                whiteSpace: "normal",
                                                wordBreak: "break-word",
                                                lineHeight: 1.25,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 2,
                                                }}
                                            >
                                                <span style={{ fontWeight: 600, color: "#111827" }}>
                                                    {fornecedorNome}
                                                </span>

                                                {r.fornecedor_id ? (
                                                    <span style={{ fontSize: 12, color: "#64748b" }}>
                                                        ID fornecedor: #{r.fornecedor_id}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>

                                        <td
                                            style={{
                                                ...tdCompact,
                                                whiteSpace: "normal",
                                                wordBreak: "break-word",
                                                lineHeight: 1.15,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 2,
                                                }}
                                            >
                                                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                                                    {r.numero_documento || "-"}
                                                </span>

                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        color: "#94a3b8",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    compra #{r.compra_id}
                                                </span>
                                            </div>
                                        </td>

                                        <td style={tdCompactCenter}>
                                            {r.parcela}/{r.total_parcelas}
                                        </td>

                                        <td style={tdCompact}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 2,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: isVencida(r.status, r.data_vencimento)
                                                            ? 700
                                                            : 500,
                                                        color: isVencida(r.status, r.data_vencimento)
                                                            ? "#b91c1c"
                                                            : "#111827",
                                                    }}
                                                >
                                                    {formatDateBR(r.data_vencimento)}
                                                </span>

                                                {isVencida(r.status, r.data_vencimento) && (
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            color: "#b91c1c",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {diasEmAtraso(r.data_vencimento)} dia(s) em atraso
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td style={{ ...tdCompactRight, color: "#475569" }}>
                                            {formatMoneyBR(r.valor_original)}
                                        </td>

                                        <td
                                            style={{
                                                ...tdCompactRight,
                                                color: "#166534",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {formatMoneyBR(r.valor_pago)}
                                        </td>

                                        <td
                                            style={{
                                                ...tdCompactRight,
                                                fontWeight: 700,
                                                color:
                                                    parseDecimalApi(r.saldo) > 0
                                                        ? isVencida(r.status, r.data_vencimento)
                                                            ? "#b91c1c"
                                                            : "#0f172a"
                                                        : "#166534",
                                            }}
                                        >
                                            {formatMoneyBR(r.saldo)}
                                        </td>

                                        <td style={tdCompact}>
                                            <span
                                                style={{
                                                    padding: "3px 9px",
                                                    borderRadius: 999,
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    display: "inline-block",
                                                    ...statusStyle(r.status, r.data_vencimento),
                                                }}
                                            >
                                                {isVencida(r.status, r.data_vencimento)
                                                    ? "VENCIDO"
                                                    : String(r.status || "-").replaceAll("_", " ")}
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
                                                    onClick={() => navigate(`/contas-pagar/${r.id}`)}
                                                    disabled={loading || isCanceling}
                                                    title="Visualizar detalhes"
                                                >
                                                    <FiEye size={18} color="#2563eb" />
                                                </button>

                                                <button
                                                    style={buttonStyles.icon}
                                                    onClick={() => cancelarConta(r)}
                                                    disabled={loading || isCanceling || !podeCancelar}
                                                    title={
                                                        podeCancelar
                                                            ? "Cancelar conta"
                                                            : "Conta não pode ser cancelada"
                                                    }
                                                >
                                                    <FiXCircle
                                                        size={18}
                                                        color={podeCancelar ? "#f59e0b" : "#94a3b8"}
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
                                        colSpan={10}
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
                            disabled={loading || page === 1 || cancelingId !== null}
                            onClick={() => setPage((prev) => prev - 1)}
                            style={buttonStyles.paginationButtonStyle(
                                loading || page === 1 || cancelingId !== null
                            )}
                        >
                            <FiChevronLeft size={20} />
                        </button>

                        <span style={{ fontWeight: 600 }}>
                            Página {page} de {totalPages}
                        </span>

                        <button
                            disabled={loading || page >= totalPages || cancelingId !== null}
                            onClick={() => setPage((prev) => prev + 1)}
                            style={buttonStyles.paginationButtonStyle(
                                loading || page >= totalPages || cancelingId !== null
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