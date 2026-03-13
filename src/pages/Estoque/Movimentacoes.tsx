import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
    FiChevronLeft,
    FiChevronRight,
    FiRefreshCw,
    FiDownload,
} from "react-icons/fi";

type ProdutoInfo = {
    id: number;
    nome?: string;
    descricao?: string;
    sku?: string;
};

type MovimentacaoRow = {
    id: number;
    produto_id: number;
    tipo_movimentacao?: string;
    origem?: string | null;
    origem_id?: number | null;
    origem_item_id?: number | null;
    quantidade?: string | number | null;
    saldo_anterior?: string | number | null;
    saldo_atual?: string | number | null;
    custo_unitario?: string | number | null;
    custo_medio_anterior?: string | number | null;
    custo_medio_atual?: string | number | null;
    observacao?: string | null;
    createdAt?: string;
    created_at?: string;
    produto?: ProdutoInfo;
};

type ProdutoOption = {
    id: number;
    nome: string;
};

function pickListResponse(resData: any) {
    if (Array.isArray(resData?.data)) {
        return {
            data: resData.data,
            total: Number(resData.total ?? resData.count ?? 0) || 0,
        };
    }

    if (Array.isArray(resData?.rows)) {
        return {
            data: resData.rows,
            total: Number(resData.count ?? 0) || 0,
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

function toNumberAny(v: any): number {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;

    let s = String(v).trim();
    if (!s) return 0;

    s = s.replace(/\s/g, "").replace("R$", "");

    const hasComma = s.includes(",");
    const hasDot = s.includes(".");

    if (hasComma && hasDot && s.lastIndexOf(",") > s.lastIndexOf(".")) {
        s = s.replace(/\./g, "").replace(",", ".");
    } else if (hasComma && !hasDot) {
        s = s.replace(",", ".");
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
}

function formatQtyBR(v: any): string {
    const n = toNumberAny(v);
    return n.toLocaleString("pt-BR", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    });
}

function formatMoneyBR(v: any): string {
    const n = toNumberAny(v);
    return n.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function formatDateTimeBR(value: any): string {
    if (!value) return "-";

    const dt = new Date(value);
    if (isNaN(dt.getTime())) return "-";

    const d = String(dt.getDate()).padStart(2, "0");
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const y = dt.getFullYear();
    const h = String(dt.getHours()).padStart(2, "0");
    const min = String(dt.getMinutes()).padStart(2, "0");

    return `${d}/${m}/${y} ${h}:${min}`;
}

function getTipoStyle(tipo: any) {
    const t = String(tipo || "").toUpperCase();

    if (t === "ENTRADA" || t === "AJUSTE_ENTRADA") {
        return { background: "#dcfce7", color: "#166534" };
    }

    if (t === "SAIDA" || t === "AJUSTE_SAIDA") {
        return { background: "#fee2e2", color: "#991b1b" };
    }

    if (t === "RESERVA" || t === "ESTORNO_RESERVA") {
        return { background: "#dbeafe", color: "#1e40af" };
    }

    return { background: "#f3f4f6", color: "#374151" };
}

function formatOrigemDescricao(row: MovimentacaoRow) {
    const origem = String(row.origem || "").replaceAll("_", " ");
    if (!origem) return "-";

    if (row.origem_id) {
        return `${origem} #${row.origem_id}`;
    }

    return origem;
}

function getSaldoAtualStyle(value: any): React.CSSProperties {
    const n = toNumberAny(value);

    if (n < 0) {
        return { color: "#991b1b", fontWeight: 800 };
    }

    if (n === 0) {
        return { color: "#92400e", fontWeight: 800 };
    }

    if (n > 0 && n <= 5) {
        return { color: "#b45309", fontWeight: 800 };
    }

    return { color: "#0f172a", fontWeight: 800 };
}

function toISODateLocal(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function escapeCsv(value: any) {
    const text = String(value ?? "");
    if (text.includes('"') || text.includes(",") || text.includes("\n")) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

export default function EstoqueMovimentacoes() {
    const navigate = useNavigate();

    const [rows, setRows] = useState<MovimentacaoRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [produtoId, setProdutoId] = useState("");
    const [tipoMovimentacao, setTipoMovimentacao] = useState("");
    const [origem, setOrigem] = useState("");
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");

    const [produtos, setProdutos] = useState<ProdutoOption[]>([]);

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const hasFilters =
        !!produtoId ||
        !!tipoMovimentacao ||
        !!origem ||
        !!dataInicio ||
        !!dataFim;

    const tdCompact: React.CSSProperties = {
        ...tableStyles.td,
        paddingTop: 6,
        paddingBottom: 6,
        lineHeight: 1.05,
        verticalAlign: "middle",
        fontSize: 13,
    };

    const tdRight: React.CSSProperties = {
        ...tdCompact,
        textAlign: "right",
        paddingRight: 8,
    };

    async function loadProdutos() {
        try {
            const res = await api.get("/produtos", {
                params: { page: 1, limit: 2000 },
            });

            const lista =
                res.data?.data ?? res.data?.rows ?? res.data?.items ?? [];

            setProdutos(
                (Array.isArray(lista) ? lista : []).map((p: any) => ({
                    id: Number(p.id),
                    nome: p.nome ?? p.descricao ?? `Produto #${p.id}`,
                }))
            );
        } catch (err) {
            console.error(err);
        }
    }

    async function carregarMovimentacoes() {
        setLoading(true);

        try {
            const params: any = {
                page,
                limit,
                orderBy: "created_at",
                orderDir: "DESC",
            };

            if (produtoId) params.produto_id = Number(produtoId);
            if (tipoMovimentacao) params.tipo_movimentacao = tipoMovimentacao;
            if (origem) params.origem = origem;
            if (dataInicio) params.data_inicio = dataInicio;
            if (dataFim) params.data_fim = dataFim;

            const res = await api.get("/movimentacoes-estoque", { params });
            const { data, total } = pickListResponse(res.data);

            setRows(data);
            setTotal(total);
        } catch (err) {
            console.error(err);
            toast.error("Erro ao carregar movimentações de estoque");
        } finally {
            setLoading(false);
        }
    }

    function aplicarPeriodoRapido(tipo: "hoje" | "7dias" | "30dias") {
        const hoje = new Date();

        if (tipo === "hoje") {
            const data = toISODateLocal(hoje);
            setDataInicio(data);
            setDataFim(data);
            setPage(1);
            return;
        }

        const inicio = new Date();
        inicio.setDate(hoje.getDate() - (tipo === "7dias" ? 6 : 29));

        setDataInicio(toISODateLocal(inicio));
        setDataFim(toISODateLocal(hoje));
        setPage(1);
    }

    function abrirOrigem(row: MovimentacaoRow) {
        const origemNormalizada = String(row.origem || "").toUpperCase();
        const origemId = Number(row.origem_id);

        if (!origemId) return;

        if (origemNormalizada === "COMPRA" || origemNormalizada === "ESTORNO_COMPRA") {
            navigate(`/compras/${origemId}`);
            return;
        }

        if (origemNormalizada === "VENDA") {
            navigate(`/pedidosvenda/${origemId}`);
            return;
        }

        toast.info("Origem sem tela vinculada.");
    }

    function exportarCsv() {
        if (!rows.length) {
            toast.info("Não há dados para exportar.");
            return;
        }

        const headers = [
            "Data",
            "Tipo",
            "Origem",
            "Produto",
            "SKU",
            "Quantidade",
            "Saldo Anterior",
            "Saldo Atual",
            "Custo Unitário",
            "Observação",
        ];

        const linhas = rows.map((r) => {
            const produtoNome =
                r.produto?.nome ||
                r.produto?.descricao ||
                `Produto #${r.produto_id}`;

            const dataRef = r.created_at ?? r.createdAt;

            return [
                formatDateTimeBR(dataRef),
                String(r.tipo_movimentacao || "").replaceAll("_", " "),
                formatOrigemDescricao(r),
                produtoNome,
                r.produto?.sku || "",
                formatQtyBR(r.quantidade),
                formatQtyBR(r.saldo_anterior),
                formatQtyBR(r.saldo_atual),
                formatMoneyBR(r.custo_unitario),
                r.observacao || "",
            ]
                .map(escapeCsv)
                .join(",");
        });

        const csv = [headers.join(","), ...linhas].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "movimentacoes_estoque.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("CSV exportado com sucesso!");
    }

    async function abrirRelatorioPdf() {
        try {
            const params: any = {};

            if (produtoId) params.produto_id = produtoId;
            if (tipoMovimentacao) params.tipo_movimentacao = tipoMovimentacao;
            if (origem) params.origem = origem;
            if (dataInicio) params.data_inicio = dataInicio;
            if (dataFim) params.data_fim = dataFim;

            const response = await api.get("/movimentacoes-estoque/relatorio/pdf", {
                params,
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "application/pdf" });
            const blobUrl = window.URL.createObjectURL(blob);
            window.open(blobUrl, "_blank");
        } catch (error: any) {
            console.error("Erro PDF:", error);

            try {
                const blob = error?.response?.data;
                if (blob instanceof Blob) {
                    const text = await blob.text();
                    const json = JSON.parse(text);
                    toast.error(json?.error || "Erro ao abrir relatório PDF");
                    console.error("Erro backend PDF:", json);
                    return;
                }
            } catch { }

            toast.error(error?.response?.data?.error || error?.message || "Erro ao abrir relatório PDF");
        }
    }

    useEffect(() => {
        loadProdutos();
    }, []);

    useEffect(() => {
        carregarMovimentacoes();
    }, [page]);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            carregarMovimentacoes();
        }, 400);

        return () => clearTimeout(t);
    }, [produtoId, tipoMovimentacao, origem, dataInicio, dataFim]);

    const resumo = useMemo(() => {
        const totalRegistros = rows.length;
        const entradas = rows.filter((r) =>
            ["ENTRADA", "AJUSTE_ENTRADA"].includes(
                String(r.tipo_movimentacao || "").toUpperCase()
            )
        ).length;

        const saidas = rows.filter((r) =>
            ["SAIDA", "AJUSTE_SAIDA"].includes(
                String(r.tipo_movimentacao || "").toUpperCase()
            )
        ).length;

        return { totalRegistros, entradas, saidas };
    }, [rows]);

    return (
        <div style={layoutStyles.page}>
            <div style={layoutStyles.header}>
                <div>
                    <h1 style={layoutStyles.title}>Movimentações de Estoque</h1>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                        {total} registro(s) encontrado(s)
                    </div>
                </div>
            </div>

            <div style={layoutStyles.cardCompact}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                        gap: 16,
                        alignItems: "end",
                    }}
                >
                    <div
                        style={{
                            gridColumn: "span 4",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            minWidth: 0,
                        }}
                    >
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                            Produto
                        </label>
                        <select
                            value={produtoId}
                            onChange={(e) => setProdutoId(e.target.value)}
                            style={{ ...filterStyles.select, height: 36, padding: "0 12px" }}
                            disabled={loading}
                        >
                            <option value="">Todos</option>
                            {produtos.map((p) => (
                                <option key={p.id} value={String(p.id)}>
                                    {p.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div
                        style={{
                            gridColumn: "span 2",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            minWidth: 0,
                        }}
                    >
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                            Tipo
                        </label>
                        <select
                            value={tipoMovimentacao}
                            onChange={(e) => setTipoMovimentacao(e.target.value)}
                            style={{ ...filterStyles.select, height: 36, padding: "0 12px" }}
                            disabled={loading}
                        >
                            <option value="">Todos</option>
                            <option value="ENTRADA">Entrada</option>
                            <option value="SAIDA">Saída</option>
                            <option value="AJUSTE_ENTRADA">Ajuste entrada</option>
                            <option value="AJUSTE_SAIDA">Ajuste saída</option>
                            <option value="RESERVA">Reserva</option>
                            <option value="ESTORNO_RESERVA">Estorno reserva</option>
                        </select>
                    </div>

                    <div
                        style={{
                            gridColumn: "span 2",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            minWidth: 0,
                        }}
                    >
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                            Origem
                        </label>
                        <select
                            value={origem}
                            onChange={(e) => setOrigem(e.target.value)}
                            style={{ ...filterStyles.select, height: 36, padding: "0 12px" }}
                            disabled={loading}
                        >
                            <option value="">Todas</option>
                            <option value="COMPRA">Compra</option>
                            <option value="ESTORNO_COMPRA">Estorno compra</option>
                            <option value="VENDA">Venda</option>
                            <option value="AJUSTE">Ajuste</option>
                        </select>
                    </div>

                    <div
                        style={{
                            gridColumn: "span 2",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            minWidth: 0,
                        }}
                    >
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                            De
                        </label>
                        <input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            style={{ ...filterStyles.input, height: 36, padding: "0 12px" }}
                            disabled={loading}
                        />
                    </div>

                    <div
                        style={{
                            gridColumn: "span 2",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            minWidth: 0,
                        }}
                    >
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                            Até
                        </label>
                        <input
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            style={{ ...filterStyles.input, height: 36, padding: "0 12px" }}
                            disabled={loading}
                        />
                    </div>

                    <div
                        style={{
                            gridColumn: "1 / -1",
                            display: "flex",
                            gap: 8,
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            marginTop: 4,
                        }}
                    >
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                                type="button"
                                style={buttonStyles.link}
                                onClick={() => aplicarPeriodoRapido("hoje")}
                                disabled={loading}
                            >
                                Hoje
                            </button>

                            <button
                                type="button"
                                style={buttonStyles.link}
                                onClick={() => aplicarPeriodoRapido("7dias")}
                                disabled={loading}
                            >
                                7 dias
                            </button>

                            <button
                                type="button"
                                style={buttonStyles.link}
                                onClick={() => aplicarPeriodoRapido("30dias")}
                                disabled={loading}
                            >
                                30 dias
                            </button>
                        </div>

                        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            {hasFilters && (
                                <button
                                    style={buttonStyles.link}
                                    onClick={() => {
                                        setProdutoId("");
                                        setTipoMovimentacao("");
                                        setOrigem("");
                                        setDataInicio("");
                                        setDataFim("");
                                        setPage(1);
                                    }}
                                    disabled={loading}
                                >
                                    Limpar
                                </button>
                            )}

                            <button
                                style={buttonStyles.secondary ?? buttonStyles.primary}
                                onClick={abrirRelatorioPdf}
                                disabled={loading}
                            >
                                Relatório PDF
                            </button>

                            <button
                                style={buttonStyles.secondary ?? buttonStyles.primary}
                                onClick={exportarCsv}
                                disabled={loading || rows.length === 0}
                            >
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <FiDownload size={16} />
                                    Exportar CSV
                                </span>
                            </button>

                            <button
                                style={buttonStyles.secondary ?? buttonStyles.primary}
                                onClick={carregarMovimentacoes}
                                disabled={loading}
                            >
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <FiRefreshCw size={16} />
                                    Atualizar
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ height: 14 }} />

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
                    gap: 12,
                    marginBottom: 16,
                }}
            >
                <div style={layoutStyles.cardCompact}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                        Registros exibidos
                    </div>
                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 800,
                            color: "#0f172a",
                            marginTop: 4,
                        }}
                    >
                        {resumo.totalRegistros}
                    </div>
                </div>

                <div style={layoutStyles.cardCompact}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                        Entradas
                    </div>
                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 800,
                            color: "#166534",
                            marginTop: 4,
                        }}
                    >
                        {resumo.entradas}
                    </div>
                </div>

                <div style={layoutStyles.cardCompact}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                        Saídas
                    </div>
                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 800,
                            color: "#991b1b",
                            marginTop: 4,
                        }}
                    >
                        {resumo.saidas}
                    </div>
                </div>
            </div>

            <div style={layoutStyles.card}>
                <div style={{ paddingBottom: 12, fontSize: 13, color: "#64748b" }}>
                    {loading
                        ? "Atualizando movimentações..."
                        : `Exibindo ${rows.length} de ${total} registro(s)`}
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{ ...tableStyles.table, tableLayout: "fixed", fontSize: 13 }}
                    >
                        <thead>
                            <tr>
                                <th style={{ ...tableStyles.th, width: "22%" }}>Movimentação</th>
                                <th style={{ ...tableStyles.th, width: "24%" }}>Produto</th>
                                <th style={{ ...tableStyles.th, width: 120, textAlign: "right" }}>
                                    Quantidade
                                </th>
                                <th style={{ ...tableStyles.th, width: 120, textAlign: "right" }}>
                                    Saldo ant.
                                </th>
                                <th style={{ ...tableStyles.th, width: 120, textAlign: "right" }}>
                                    Saldo atual
                                </th>
                                <th style={{ ...tableStyles.th, width: 130, textAlign: "right" }}>
                                    Custo unit.
                                </th>
                                <th style={{ ...tableStyles.th, width: "22%" }}>Observação</th>
                            </tr>
                        </thead>

                        <tbody>
                            {!loading && rows.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: 20 }}>
                                        Nenhuma movimentação encontrada.
                                    </td>
                                </tr>
                            )}

                            {rows.map((r, index) => {
                                const produtoNome =
                                    r.produto?.nome ||
                                    r.produto?.descricao ||
                                    `Produto #${r.produto_id}`;

                                const dataRef = r.created_at ?? r.createdAt;
                                const origemDescricao = formatOrigemDescricao(r);
                                const origemClicavel =
                                    !!r.origem_id &&
                                    ["COMPRA", "ESTORNO_COMPRA", "VENDA"].includes(
                                        String(r.origem || "").toUpperCase()
                                    );

                                return (
                                    <tr
                                        key={r.id}
                                        style={{ background: index % 2 === 0 ? "#fff" : "#f9fafb" }}
                                    >
                                        <td
                                            style={{
                                                ...tdCompact,
                                                whiteSpace: "normal",
                                                wordBreak: "break-word",
                                                lineHeight: 1.1,
                                            }}
                                        >
                                            <div style={{ fontWeight: 700, color: "#0f172a" }}>
                                                {formatDateTimeBR(dataRef)}
                                            </div>

                                            <div style={{ marginTop: 4 }}>
                                                <span
                                                    style={{
                                                        padding: "3px 8px",
                                                        borderRadius: 7,
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        display: "inline-block",
                                                        lineHeight: 1,
                                                        ...getTipoStyle(r.tipo_movimentacao),
                                                    }}
                                                >
                                                    {String(r.tipo_movimentacao || "-").replaceAll("_", " ")}
                                                </span>
                                            </div>

                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: origemClicavel ? "#2563eb" : "#64748b",
                                                    marginTop: 4,
                                                    lineHeight: 1.15,
                                                    cursor: origemClicavel ? "pointer" : "default",
                                                    textDecoration: origemClicavel ? "underline" : "none",
                                                    fontWeight: origemClicavel ? 700 : 400,
                                                }}
                                                onClick={() => origemClicavel && abrirOrigem(r)}
                                                title={origemClicavel ? "Abrir origem" : undefined}
                                            >
                                                {origemDescricao}
                                            </div>
                                        </td>

                                        <td
                                            style={{
                                                ...tdCompact,
                                                whiteSpace: "normal",
                                                wordBreak: "break-word",
                                                lineHeight: 1.1,
                                            }}
                                        >
                                            <div style={{ fontWeight: 700, color: "#0f172a" }}>
                                                {produtoNome}
                                            </div>

                                            {r.produto?.sku && (
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: "#94a3b8",
                                                        marginTop: 1,
                                                    }}
                                                >
                                                    SKU: {r.produto.sku}
                                                </div>
                                            )}
                                        </td>

                                        <td style={{ ...tdRight, fontWeight: 800 }}>
                                            {formatQtyBR(r.quantidade)}
                                        </td>

                                        <td style={tdRight}>{formatQtyBR(r.saldo_anterior)}</td>

                                        <td style={{ ...tdRight, ...getSaldoAtualStyle(r.saldo_atual) }}>
                                            {formatQtyBR(r.saldo_atual)}
                                        </td>

                                        <td style={tdRight}>{formatMoneyBR(r.custo_unitario)}</td>

                                        <td
                                            style={{
                                                ...tdCompact,
                                                whiteSpace: "normal",
                                                wordBreak: "break-word",
                                                lineHeight: 1.1,
                                                color: "#475569",
                                                fontSize: 12,
                                            }}
                                        >
                                            {r.observacao || "-"}
                                        </td>
                                    </tr>
                                );
                            })}

                            {loading && (
                                <tr>
                                    <td
                                        colSpan={7}
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
                            disabled={loading || page === 1}
                            onClick={() => setPage((prev) => prev - 1)}
                            style={buttonStyles.paginationButtonStyle(
                                loading || page === 1
                            )}
                        >
                            <FiChevronLeft size={20} />
                        </button>

                        <span style={{ fontWeight: 600 }}>
                            Página {page} de {totalPages}
                        </span>

                        <button
                            disabled={loading || page >= totalPages}
                            onClick={() => setPage((prev) => prev + 1)}
                            style={buttonStyles.paginationButtonStyle(
                                loading || page >= totalPages
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