import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { tableStyles } from "../../styles/table";
import { filterStyles } from "../../styles/filters";

type CompraStatus =
    | "ABERTA"
    | "PARCIALMENTE_RECEBIDA"
    | "RECEBIDA"
    | "CANCELADA";

type CompraItem = {
    id: number;
    produto_id: number;
    qtd: string;
    recebido_qtd?: string;
    qtd_cancelada?: string;
    preco_unitario?: string;
    status?: string;
    previsao_entrega?: string | null;
    produto?: {
        nome?: string;
        descricao?: string;
    };
};

type CompraData = {
    id: number;
    status: CompraStatus;
    fornecedor_id?: number | null;
    data_pedido?: string;
    valor_total?: string | number | null;
    itens?: CompraItem[];
};

function toNumberAny(v: any): number {
    if (v === null || v === undefined) return 0;
    const s = String(v).trim();
    if (!s) return 0;

    const hasComma = s.includes(",");
    const hasDot = s.includes(".");

    if (hasComma && hasDot) {
        const normalized = s.replace(/\./g, "").replace(",", ".");
        const n = Number(normalized);
        return Number.isFinite(n) ? n : 0;
    }

    if (hasComma) {
        const n = Number(s.replace(",", "."));
        return Number.isFinite(n) ? n : 0;
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
}

function formatQtyBR(n: number) {
    return n.toLocaleString("pt-BR", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    });
}

function formatDateBR(value: any): string {
    if (!value) return "-";
    const s = String(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d] = s.split("-");
        return `${d}/${m}/${y}`;
    }
    return "-";
}

function normalizeDecimalString(v: string) {
    const clean = (v || "").replace(/[^\d.,]/g, "");
    const hasComma = clean.includes(",");
    const hasDot = clean.includes(".");
    if (hasComma && hasDot) return clean.replace(/\./g, "").replace(",", ".");
    if (hasComma) return clean.replace(",", ".");
    return clean;
}

function getItemStatusStyle(status: any) {
    const s = String(status || "").toUpperCase();

    if (s === "RECEBIDO") {
        return { background: "#dcfce7", color: "#166534" };
    }

    if (s === "PARCIALMENTE_RECEBIDO") {
        return { background: "#fef3c7", color: "#92400e" };
    }

    if (s === "CANCELADO") {
        return { background: "#fee2e2", color: "#991b1b" };
    }

    return { background: "#dbeafe", color: "#1e40af" };
}

export default function ComprasReceber() {
    const navigate = useNavigate();
    const { id } = useParams();
    const compraId = Number(id);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [compra, setCompra] = useState<CompraData | null>(null);
    const [receberTudo, setReceberTudo] = useState(true);

    const [receberMap, setReceberMap] = useState<Record<number, string>>({});

    async function loadCompra() {
        const res = await api.get(`/compras/${compraId}`);
        const c = res.data?.data ?? res.data ?? null;
        if (!c?.id) throw new Error("Compra não encontrada");

        const itens = Array.isArray(c.itens)
            ? c.itens
            : Array.isArray(c.CompraItems)
                ? c.CompraItems
                : [];

        setCompra({
            ...c,
            itens,
        });

        const map: Record<number, string> = {};
        for (const it of itens) {
            const qtd = toNumberAny(it.qtd);
            const recebido = toNumberAny(it.recebido_qtd);
            const cancelada = toNumberAny(it.qtd_cancelada);
            const pendente = Math.max(0, qtd - recebido - cancelada);
            map[it.id] = pendente > 0 ? String(pendente) : "";
        }
        setReceberMap(map);
    }

    useEffect(() => {
        (async () => {
            if (!compraId) {
                toast.error("Compra inválida");
                navigate("/compras");
                return;
            }

            setLoading(true);
            try {
                await loadCompra();
            } catch (err: any) {
                console.error(err);
                toast.error(err?.response?.data?.error || err?.message || "Erro ao carregar compra");
                navigate("/compras");
            } finally {
                setLoading(false);
            }
        })();
    }, [compraId, navigate]);

    const itens = compra?.itens ?? [];

    const resumo = useMemo(() => {
        let totalItens = 0;
        let totalPendente = 0;
        let totalReceberAgora = 0;

        for (const it of itens) {
            const qtd = toNumberAny(it.qtd);
            const recebido = toNumberAny(it.recebido_qtd);
            const cancelada = toNumberAny(it.qtd_cancelada);
            const pendente = Math.max(0, qtd - recebido - cancelada);
            const agora = receberTudo ? pendente : toNumberAny(receberMap[it.id]);

            totalItens += 1;
            totalPendente += pendente;
            totalReceberAgora += Math.min(agora, pendente);
        }

        return {
            totalItens,
            totalPendente,
            totalReceberAgora,
        };
    }, [itens, receberTudo, receberMap]);

    function handleChangeReceber(itemId: number, value: string) {
        setReceberMap((prev) => ({
            ...prev,
            [itemId]: normalizeDecimalString(value),
        }));
    }

    async function handleReceber() {
        if (!compra) return;

        const status = String(compra.status || "").toUpperCase();
        if (!["ABERTA", "PARCIALMENTE_RECEBIDA"].includes(status)) {
            toast.error("Esta compra não pode mais ser recebida.");
            return;
        }

        const itensPayload = itens
            .map((it) => {
                const qtd = toNumberAny(it.qtd);
                const recebido = toNumberAny(it.recebido_qtd);
                const cancelada = toNumberAny(it.qtd_cancelada);
                const pendente = Math.max(0, qtd - recebido - cancelada);

                const receberQtd = receberTudo ? pendente : toNumberAny(receberMap[it.id]);

                return {
                    compra_item_id: it.id,
                    receber_qtd: receberQtd > pendente ? pendente : receberQtd,
                };
            })
            .filter((it) => it.receber_qtd > 0);

        if (!itensPayload.length) {
            toast.error("Informe ao menos uma quantidade para receber.");
            return;
        }

        setSaving(true);
        try {
            await api.post(`/compras/${compraId}/receber`, {
                itens: itensPayload,
            });

            toast.success("Recebimento registrado com sucesso!");
            await loadCompra();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Erro ao registrar recebimento");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div style={layoutStyles.page}>
            <div style={layoutStyles.header}>
                <div>
                    <h1 style={layoutStyles.title}>Receber Compra #{compraId}</h1>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                        {compra ? `Status atual: ${String(compra.status).replaceAll("_", " ")}` : "Carregando..."}
                    </div>
                </div>
            </div>

            <div style={layoutStyles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Recebimento por item</div>

                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
                            <input
                                type="checkbox"
                                checked={receberTudo}
                                onChange={(e) => setReceberTudo(e.target.checked)}
                                disabled={loading || saving}
                            />
                            Receber tudo que está pendente
                        </label>

                        <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>
                            Itens: {resumo.totalItens} · Pendente: {formatQtyBR(resumo.totalPendente)} · Receber agora: {formatQtyBR(resumo.totalReceberAgora)}
                        </div>
                    </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ ...tableStyles.table, tableLayout: "auto" }}>
                        <thead>
                            <tr>
                                <th style={tableStyles.th}>Produto</th>
                                <th style={{ ...tableStyles.th, textAlign: "right", width: 130 }}>Pedida</th>
                                <th style={{ ...tableStyles.th, textAlign: "right", width: 130 }}>Recebida</th>
                                <th style={{ ...tableStyles.th, textAlign: "right", width: 130 }}>Pendente</th>
                                <th style={{ ...tableStyles.th, width: 220 }}>Receber agora</th>
                                <th style={{ ...tableStyles.th, width: 170 }}>Status</th>
                                <th style={{ ...tableStyles.th, width: 140 }}>Prev. Entrega</th>
                            </tr>
                        </thead>

                        <tbody>
                            {!loading && itens.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                                        Nenhum item encontrado.
                                    </td>
                                </tr>
                            )}

                            {itens.map((it, idx) => {
                                const qtd = toNumberAny(it.qtd);
                                const recebido = toNumberAny(it.recebido_qtd);
                                const cancelada = toNumberAny(it.qtd_cancelada);
                                const pendente = Math.max(0, qtd - recebido - cancelada);

                                const nome =
                                    it.produto?.nome ||
                                    it.produto?.descricao ||
                                    `Produto #${it.produto_id}`;

                                return (
                                    <tr key={it.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}>
                                        <td style={tableStyles.td}>
                                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{nome}</div>
                                        </td>

                                        <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                                            {formatQtyBR(qtd)}
                                        </td>

                                        <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                                            {formatQtyBR(recebido)}
                                        </td>

                                        <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8, fontWeight: 700 }}>
                                            {formatQtyBR(pendente)}
                                        </td>

                                        <td style={{ ...tableStyles.td, textAlign: "center" }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    width: "100%",
                                                }}
                                            >
                                                <input
                                                    value={receberMap[it.id] ?? ""}
                                                    onChange={(e) => handleChangeReceber(it.id, e.target.value)}
                                                    disabled={loading || saving || pendente <= 0}
                                                    inputMode="decimal"
                                                    placeholder="0,000"
                                                    style={{
                                                        ...filterStyles.input,
                                                        height: 34,
                                                        width: "100%",
                                                        maxWidth: 140,
                                                        minWidth: 100,
                                                        padding: "0 10px",
                                                        boxSizing: "border-box",
                                                        textAlign: "right",
                                                        fontSize: 14,
                                                        lineHeight: "34px",
                                                        background: pendente <= 0 ? "#f8fafc" : "#fff",
                                                    }}
                                                />
                                            </div>
                                        </td>

                                        <td style={tableStyles.td}>
                                            <span
                                                style={{
                                                    padding: "3px 9px",
                                                    borderRadius: 6,
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    display: "inline-block",
                                                    ...getItemStatusStyle(it.status),
                                                }}
                                            >
                                                {String(it.status || "PENDENTE").replaceAll("_", " ")}
                                            </span>
                                        </td>

                                        <td style={tableStyles.td}>
                                            {formatDateBR(it.previsao_entrega)}
                                        </td>
                                    </tr>
                                );
                            })}

                            {loading && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                                        Carregando itens...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                    <button
                        type="button"
                        style={buttonStyles.link}
                        onClick={() => navigate("/compras")}
                        disabled={saving}
                    >
                        Voltar
                    </button>

                    <button
                        type="button"
                        style={buttonStyles.primary}
                        onClick={handleReceber}
                        disabled={loading || saving || !itens.length}
                    >
                        {saving ? "Registrando..." : "Confirmar Recebimento"}
                    </button>
                </div>
            </div>
        </div>
    );
}