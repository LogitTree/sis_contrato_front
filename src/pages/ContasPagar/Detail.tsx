import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
    FiArrowLeft,
    FiDollarSign,
    FiTrash2,
    FiXCircle,
} from "react-icons/fi";

type PagamentoRow = {
    id: number;
    conta_pagar_id: number;
    data_pagamento: string;
    valor_pago: string | number;
    forma_pagamento?: string | null;
    observacao?: string | null;
    created_at?: string;
};

type ContaPagarDetail = {
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
    status?: string | null;
    forma_pagamento?: string | null;
    observacao?: string | null;

    fornecedor?: {
        id: number;
        nome?: string;
        cpf_cnpj?: string | null;
    };

    compra?: {
        id: number;
        data_pedido?: string | null;
        numero_nota_fiscal?: string | null;
        valor_total?: string | number | null;
    };

    pagamentos?: PagamentoRow[];
};

type FormaPagamentoOption = {
    id: number;
    descricao: string;
    ativo: boolean;
    permite_parcelamento: boolean;
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

function formatMoneyBR(v: any): string {
    const n = typeof v === "number" ? v : parseDecimalApi(v);
    if (!Number.isFinite(n)) return "-";

    return n.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
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

function statusStyle(status: any) {
    const s = String(status || "").toUpperCase();

    if (s === "PAGO") {
        return { background: "#dcfce7", color: "#166534" };
    }

    if (s === "PARCIAL") {
        return { background: "#fef3c7", color: "#92400e" };
    }

    if (s === "VENCIDO") {
        return { background: "#fee2e2", color: "#991b1b" };
    }

    if (s === "CANCELADO") {
        return { background: "#e5e7eb", color: "#374151" };
    }

    return { background: "#dbeafe", color: "#1e40af" };
}

export default function ContasPagarDetail() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [conta, setConta] = useState<ContaPagarDetail | null>(null);

    const [pagamentoForm, setPagamentoForm] = useState({
        data_pagamento: new Date().toISOString().slice(0, 10),
        valor_pago: "",
        forma_pagamento: "",
        observacao: "",
    });

    const [savingPagamento, setSavingPagamento] = useState(false);
    const [cancelandoConta, setCancelandoConta] = useState(false);
    const [excluindoPagamentoId, setExcluindoPagamentoId] = useState<number | null>(null);

    const podePagar = useMemo(() => {
        const status = String(conta?.status || "").toUpperCase();
        return ["ABERTO", "PARCIAL", "VENCIDO"].includes(status);
    }, [conta]);

    const podeCancelar = useMemo(() => {
        const status = String(conta?.status || "").toUpperCase();
        return ["ABERTO", "VENCIDO"].includes(status);
    }, [conta]);

    const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoOption[]>([]);

    async function carregarFormasPagamento() {
        try {
            const { data } = await api.get("/formas-pagamento", {
                params: {
                    ativo: true,
                    page: 1,
                    limit: 1000,
                    sort: "descricao",
                    order: "ASC",
                },
            });

            const rows =
                data?.data ??
                data?.rows ??
                data?.items ??
                [];

            setFormasPagamento(rows);
        } catch (err) {
            console.error(err);
            toast.error("Erro ao carregar formas de pagamento");
        }
    }

    async function carregar() {
        if (!id) return;

        setLoading(true);
        try {
            const { data } = await api.get(`/contas-pagar/${id}`);
            setConta(data);

            setPagamentoForm((old) => ({
                ...old,
                valor_pago: String(parseDecimalApi(data?.saldo || 0)),
                forma_pagamento: data?.forma_pagamento || "",
            }));
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Erro ao carregar conta a pagar");
            navigate("/contas-pagar");
        } finally {
            setLoading(false);
        }
    }

    async function registrarPagamento(e: React.FormEvent) {
        e.preventDefault();
        if (!id || !conta) return;

        const valorPago = parseDecimalApi(pagamentoForm.valor_pago);

        if (valorPago <= 0) {
            toast.warning("Informe um valor válido para pagamento.");
            return;
        }

        if (!pagamentoForm.data_pagamento) {
            toast.warning("Informe a data do pagamento.");
            return;
        }

        if (!pagamentoForm.forma_pagamento) {
            toast.warning("Selecione a forma de pagamento.");
            return;
        }
        
        setSavingPagamento(true);
        try {
            await api.post(`/contas-pagar/${id}/pagamentos`, {
                data_pagamento: pagamentoForm.data_pagamento,
                valor_pago: valorPago,
                forma_pagamento: pagamentoForm.forma_pagamento || undefined,
                observacao: pagamentoForm.observacao || undefined,
            });

            toast.success("Pagamento registrado com sucesso!");

            setPagamentoForm((old) => ({
                ...old,
                observacao: "",
            }));

            await carregar();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Erro ao registrar pagamento");
        } finally {
            setSavingPagamento(false);
        }
    }

    async function cancelarConta() {
        if (!id || !conta) return;

        const ok = window.confirm(`Cancelar a conta #${conta.id}?`);
        if (!ok) return;

        setCancelandoConta(true);
        try {
            await api.put(`/contas-pagar/${id}/cancelar`);
            toast.success("Conta cancelada com sucesso!");
            await carregar();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Erro ao cancelar conta");
        } finally {
            setCancelandoConta(false);
        }
    }

    async function excluirPagamento(pagamento: PagamentoRow) {
        const ok = window.confirm(
            `Excluir o pagamento #${pagamento.id} no valor de ${formatMoneyBR(
                pagamento.valor_pago
            )}?`
        );
        if (!ok) return;

        setExcluindoPagamentoId(pagamento.id);
        try {
            await api.delete(`/contas-pagar/pagamentos/${pagamento.id}`);
            toast.success("Pagamento excluído com sucesso!");
            await carregar();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Erro ao excluir pagamento");
        } finally {
            setExcluindoPagamentoId(null);
        }
    }

    useEffect(() => {
        carregar();
        carregarFormasPagamento();
    }, [id]);

    if (loading) {
        return (
            <div style={layoutStyles.page}>
                <div style={layoutStyles.card}>Carregando...</div>
            </div>
        );
    }

    if (!conta) {
        return (
            <div style={layoutStyles.page}>
                <div style={layoutStyles.card}>Conta não encontrada.</div>
            </div>
        );
    }

    return (
        <div style={layoutStyles.page}>
            <div style={layoutStyles.header}>
                <div>
                    <h1 style={layoutStyles.title}>Conta a Pagar #{conta.id}</h1>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                        Parcela {conta.parcela}/{conta.total_parcelas}
                    </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                    <button
                        style={buttonStyles.link}
                        onClick={() => navigate("/contas-pagar")}
                        disabled={savingPagamento || cancelandoConta}
                    >
                        <FiArrowLeft size={16} style={{ marginRight: 6 }} />
                        Voltar
                    </button>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                    marginBottom: 16,
                }}
            >
                <div style={layoutStyles.cardCompact}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                        Valor original
                    </div>
                    <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
                        {formatMoneyBR(conta.valor_original)}
                    </div>
                </div>

                <div style={layoutStyles.cardCompact}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                        Valor pago
                    </div>
                    <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700, color: "#166534" }}>
                        {formatMoneyBR(conta.valor_pago)}
                    </div>
                </div>

                <div style={layoutStyles.cardCompact}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                        Saldo
                    </div>
                    <div
                        style={{
                            marginTop: 8,
                            fontSize: 22,
                            fontWeight: 700,
                            color:
                                parseDecimalApi(conta.saldo) > 0 &&
                                    String(conta.status || "").toUpperCase() === "VENCIDO"
                                    ? "#b91c1c"
                                    : "#0f172a",
                        }}
                    >
                        {formatMoneyBR(conta.saldo)}
                    </div>
                </div>

                <div style={layoutStyles.cardCompact}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                        Status
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <span
                            style={{
                                padding: "4px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 700,
                                display: "inline-block",
                                ...statusStyle(conta.status),
                            }}
                        >
                            {String(conta.status || "-").replaceAll("_", " ")}
                        </span>
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr",
                    gap: 16,
                    alignItems: "start",
                }}
            >
                <div style={layoutStyles.card}>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                        Dados da Conta
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 16,
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                                Fornecedor
                            </div>
                            <div style={{ marginTop: 4, fontWeight: 600 }}>
                                {conta.fornecedor?.nome || "-"}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                                Compra
                            </div>
                            <div style={{ marginTop: 4, fontWeight: 600 }}>
                                #{conta.compra_id}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                                Documento
                            </div>
                            <div style={{ marginTop: 4, fontWeight: 600 }}>
                                {conta.numero_documento || "-"}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                                Parcela
                            </div>
                            <div style={{ marginTop: 4, fontWeight: 600 }}>
                                {conta.parcela}/{conta.total_parcelas}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                                Data emissão
                            </div>
                            <div style={{ marginTop: 4, fontWeight: 600 }}>
                                {formatDateBR(conta.data_emissao)}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                                Vencimento
                            </div>
                            <div style={{ marginTop: 4, fontWeight: 600 }}>
                                {formatDateBR(conta.data_vencimento)}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                                Forma de pagamento
                            </div>
                            <div style={{ marginTop: 4, fontWeight: 600 }}>
                                {conta.forma_pagamento || "-"}
                            </div>
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                                Observação
                            </div>
                            <div style={{ marginTop: 4, fontWeight: 500, color: "#334155" }}>
                                {conta.observacao || "-"}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={layoutStyles.card}>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                        Ações
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                        <form onSubmit={registrarPagamento}>
                            <div style={{ display: "grid", gap: 10 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                                        Data do pagamento
                                    </label>
                                    <input
                                        type="date"
                                        value={pagamentoForm.data_pagamento}
                                        onChange={(e) =>
                                            setPagamentoForm((old) => ({
                                                ...old,
                                                data_pagamento: e.target.value,
                                            }))
                                        }
                                        style={{
                                            ...filterStyles.input,
                                            height: 40,
                                            padding: "0 12px",
                                            marginTop: 6,
                                        }}
                                        disabled={!podePagar || savingPagamento}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                                        Valor pago
                                    </label>
                                    <input
                                        value={pagamentoForm.valor_pago}
                                        onChange={(e) =>
                                            setPagamentoForm((old) => ({
                                                ...old,
                                                valor_pago: e.target.value,
                                            }))
                                        }
                                        style={{
                                            ...filterStyles.input,
                                            height: 40,
                                            padding: "0 12px",
                                            marginTop: 6,
                                        }}
                                        disabled={!podePagar || savingPagamento}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                                        Forma de pagamento
                                    </label>
                                    <select
                                        value={pagamentoForm.forma_pagamento}
                                        onChange={(e) =>
                                            setPagamentoForm((old) => ({
                                                ...old,
                                                forma_pagamento: e.target.value,
                                            }))
                                        }
                                        style={{
                                            ...filterStyles.select,
                                            height: 40,
                                            padding: "0 12px",
                                            marginTop: 6,
                                        }}
                                        disabled={!podePagar || savingPagamento}
                                    >
                                        <option value="">Selecione</option>
                                        {formasPagamento.map((fp) => (
                                            <option key={fp.id} value={fp.descricao}>
                                                {fp.descricao}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                                        Observação
                                    </label>
                                    <textarea
                                        value={pagamentoForm.observacao}
                                        onChange={(e) =>
                                            setPagamentoForm((old) => ({
                                                ...old,
                                                observacao: e.target.value,
                                            }))
                                        }
                                        style={{
                                            ...filterStyles.input,
                                            minHeight: 80,
                                            padding: 12,
                                            marginTop: 6,
                                            resize: "vertical",
                                        }}
                                        disabled={!podePagar || savingPagamento}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    style={buttonStyles.primary}
                                    disabled={!podePagar || savingPagamento}
                                >
                                    <FiDollarSign size={16} style={{ marginRight: 6 }} />
                                    Registrar pagamento
                                </button>
                            </div>
                        </form>

                        <button
                            type="button"
                            style={{
                                ...buttonStyles.secondary,
                                background: podeCancelar ? "#fff7ed" : "#f8fafc",
                                color: podeCancelar ? "#b45309" : "#94a3b8",
                                border: "1px solid #fed7aa",
                            }}
                            onClick={cancelarConta}
                            disabled={!podeCancelar || cancelandoConta}
                        >
                            <FiXCircle size={16} style={{ marginRight: 6 }} />
                            Cancelar conta
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ ...layoutStyles.card, marginTop: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                    Histórico de Pagamentos
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ ...tableStyles.table, tableLayout: "fixed" }}>
                        <thead>
                            <tr>
                                <th style={{ ...tableStyles.th, width: 100 }}>ID</th>
                                <th style={{ ...tableStyles.th, width: 150 }}>Data</th>
                                <th style={{ ...tableStyles.th, width: 150, textAlign: "right" }}>
                                    Valor
                                </th>
                                <th style={{ ...tableStyles.th, width: 180 }}>
                                    Forma de pagamento
                                </th>
                                <th style={{ ...tableStyles.th, width: "40%" }}>
                                    Observação
                                </th>
                                <th style={{ ...tableStyles.th, width: 120, textAlign: "center" }}>
                                    Ações
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {!conta.pagamentos?.length && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                                        Nenhum pagamento registrado.
                                    </td>
                                </tr>
                            )}

                            {conta.pagamentos?.map((p, index) => {
                                const isDeleting = excluindoPagamentoId === Number(p.id);

                                return (
                                    <tr
                                        key={p.id}
                                        style={{
                                            background: index % 2 === 0 ? "#fff" : "#f9fafb",
                                            opacity: isDeleting ? 0.65 : 1,
                                        }}
                                    >
                                        <td style={tableStyles.td}>{p.id}</td>
                                        <td style={tableStyles.td}>{formatDateBR(p.data_pagamento)}</td>
                                        <td style={{ ...tableStyles.td, textAlign: "right" }}>
                                            {formatMoneyBR(p.valor_pago)}
                                        </td>
                                        <td style={tableStyles.td}>{p.forma_pagamento || "-"}</td>
                                        <td style={tableStyles.td}>{p.observacao || "-"}</td>
                                        <td style={{ ...tableStyles.td, textAlign: "center" }}>
                                            <button
                                                style={buttonStyles.icon}
                                                onClick={() => excluirPagamento(p)}
                                                disabled={isDeleting}
                                                title="Excluir pagamento"
                                            >
                                                <FiTrash2
                                                    size={18}
                                                    color={isDeleting ? "#94a3b8" : "#dc2626"}
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}