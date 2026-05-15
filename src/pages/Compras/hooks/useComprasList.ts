// src/pages/Compras/hooks/useComprasList.ts

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
    buscarContasDaCompra,
    cancelarCompraService,
    excluirCompraService,
    gerarContasPagarCompra,
    listarCompras,
    listarFornecedoresCompra,
    listarFormasPagamentoCompra,
    cancelarFechamentoFinanceiroCompra,
    type CompraRow,
    type FormaPagamentoOption,
    type FornecedorOption,
    type ParcelaPreview,
} from "../../../services/compras/compraService";

export type ParcelaFinanceiraForm = ParcelaPreview & {
    numero_documento: string;
    anexo_nome: string;
    anexo_file?: File | null;
};

export function parseDecimalApi(v: any): number {
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

export function formatDateBR(value: any): string {
    if (!value) return "-";

    const s = String(value).trim();
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

export function formatMoneyBR(v: any): string {
    const n = typeof v === "number" ? v : parseDecimalApi(v);

    if (!Number.isFinite(n)) return "-";

    return n.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

export function formatQtyBR(v: any): string {
    const n = typeof v === "number" ? v : parseDecimalApi(v);

    if (!Number.isFinite(n)) return "0,000";

    return n.toLocaleString("pt-BR", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    });
}

export function getTotalCompra(row: any): number | null {
    if (
        row?.valor_total !== undefined &&
        row?.valor_total !== null &&
        row?.valor_total !== ""
    ) {
        return parseDecimalApi(row.valor_total);
    }

    return null;
}

export function getResumoRecebimento(row: any) {
    const itens = row?.itens ?? row?.CompraItems ?? [];

    if (!Array.isArray(itens) || itens.length === 0) {
        return {
            totalQtd: 0,
            totalRecebido: 0,
            percentual: 0,
        };
    }

    let totalQtd = 0;
    let totalRecebido = 0;

    for (const it of itens) {
        totalQtd += parseDecimalApi(it?.qtd);
        totalRecebido += parseDecimalApi(it?.recebido_qtd);
    }

    const percentual =
        totalQtd > 0 ? Math.min(100, (totalRecebido / totalQtd) * 100) : 0;

    return {
        totalQtd,
        totalRecebido,
        percentual,
    };
}

export function toIsoDate(value: any) {
    if (!value) return new Date().toISOString().slice(0, 10);

    const s = String(value).slice(0, 10);

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    return new Date().toISOString().slice(0, 10);
}

export function addDays(dateString: string, days: number) {
    const dt = new Date(`${dateString}T00:00:00`);
    dt.setDate(dt.getDate() + Number(days || 0));
    return dt.toISOString().slice(0, 10);
}

export function round2(value: number) {
    return Number(Number(value || 0).toFixed(2));
}

export function gerarPreviewParcelas(
    valorTotal: number,
    quantidadeParcelas: number,
    dataPrimeiroVencimento: string,
    intervaloDias: number
): ParcelaFinanceiraForm[] {
    const total = round2(valorTotal);
    const qtd = Math.max(1, Number(quantidadeParcelas || 1));
    const valorBase = Math.floor((total / qtd) * 100) / 100;

    const parcelas: ParcelaFinanceiraForm[] = [];
    let soma = 0;

    for (let i = 1; i <= qtd; i++) {
        let valorParcela = valorBase;

        if (i === qtd) {
            valorParcela = round2(total - soma);
        }

        soma = round2(soma + valorParcela);

        parcelas.push({
            parcela: i,
            total_parcelas: qtd,
            data_vencimento: addDays(
                dataPrimeiroVencimento,
                (i - 1) * Number(intervaloDias || 0)
            ),
            valor_original: valorParcela,
            numero_documento: "",
            anexo_nome: "",
            anexo_file: null,
        });
    }

    return parcelas;
}

export function statusStyle(status: any): React.CSSProperties {
    const s = String(status || "").toUpperCase();

    if (s === "RECEBIDA") {
        return { background: "#dcfce7", color: "#166534" };
    }

    if (s === "PARCIALMENTE_RECEBIDA") {
        return { background: "#fef3c7", color: "#92400e" };
    }

    if (s === "CANCELADA") {
        return { background: "#fee2e2", color: "#991b1b" };
    }

    return { background: "#dbeafe", color: "#1e40af" };
}

export function useComprasList() {
    const navigate = useNavigate();

    const [rows, setRows] = useState<CompraRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [filtroFornecedorId, setFiltroFornecedorId] = useState("");
    const [filtroStatus, setFiltroStatus] = useState("");
    const [filtroDataInicio, setFiltroDataInicio] = useState("");
    const [filtroDataFim, setFiltroDataFim] = useState("");

    const [orderBy, setOrderBy] = useState<
        "id" | "data_pedido" | "status" | "fornecedor_id"
    >("id");

    const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("DESC");

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const [fornecedoresOptions, setFornecedoresOptions] = useState<
        FornecedorOption[]
    >([]);

    const [formasPagamento, setFormasPagamento] = useState<
        FormaPagamentoOption[]
    >([]);

    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [financeiroLoadingId, setFinanceiroLoadingId] = useState<number | null>(
        null
    );

    const [financeiroModalOpen, setFinanceiroModalOpen] = useState(false);
    const [financeiroCompra, setFinanceiroCompra] =
        useState<CompraRow | null>(null);

    const [financeiroForm, setFinanceiroForm] = useState({
        forma_pagamento: "",
        quantidade_parcelas: 1,
        data_primeiro_vencimento: "",
        intervalo_dias: 30,
        observacao: "",
    });

    const [parcelasFinanceiras, setParcelasFinanceiras] = useState<
        ParcelaFinanceiraForm[]
    >([]);

    const [financeiroSaving, setFinanceiroSaving] = useState(false);

    const hasFilters =
        !!filtroFornecedorId ||
        !!filtroStatus ||
        !!filtroDataInicio ||
        !!filtroDataFim;

    const fornecedoresMap = useMemo(() => {
        const m = new Map<number, FornecedorOption>();

        for (const f of fornecedoresOptions) {
            m.set(Number(f.id), f);
        }

        return m;
    }, [fornecedoresOptions]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const resumo = useMemo(() => {
        return rows.reduce(
            (acc, row) => {
                acc.quantidade += 1;

                const totalCompra = getTotalCompra(row) || 0;
                acc.valorTotal += totalCompra;

                const status = String(row.status || "").toUpperCase();

                if (status === "ABERTA") acc.abertas += 1;
                if (status === "PARCIALMENTE_RECEBIDA") acc.parciais += 1;
                if (status === "RECEBIDA") acc.recebidas += 1;
                if (status === "CANCELADA") acc.canceladas += 1;

                return acc;
            },
            {
                quantidade: 0,
                valorTotal: 0,
                abertas: 0,
                parciais: 0,
                recebidas: 0,
                canceladas: 0,
            }
        );
    }, [rows]);

    const previewParcelas = parcelasFinanceiras;

    function recalcularParcelasFinanceiras(
        compraParam = financeiroCompra,
        formParam = financeiroForm
    ) {
        if (!compraParam) {
            setParcelasFinanceiras([]);
            return;
        }

        const valorTotal = getTotalCompra(compraParam) || 0;

        if (valorTotal <= 0) {
            setParcelasFinanceiras([]);
            return;
        }

        const novasParcelas = gerarPreviewParcelas(
            valorTotal,
            Number(formParam.quantidade_parcelas || 1),
            formParam.data_primeiro_vencimento ||
            toIsoDate(compraParam.data_pedido),
            Number(formParam.intervalo_dias || 30)
        );

        setParcelasFinanceiras((old) =>
            novasParcelas.map((nova) => {
                const antiga = old.find((p) => p.parcela === nova.parcela);

                return {
                    ...nova,
                    numero_documento: antiga?.numero_documento || "",
                    anexo_nome: antiga?.anexo_nome || "",
                    anexo_file: antiga?.anexo_file || null,
                };
            })
        );
    }

    function updateFinanceiroForm(
        field: keyof typeof financeiroForm,
        value: string | number
    ) {
        const nextForm = {
            ...financeiroForm,
            [field]: value,
        };

        setFinanceiroForm(nextForm);
        recalcularParcelasFinanceiras(financeiroCompra, nextForm);
    }

    function updateParcelaFinanceira(
        parcela: number,
        field: "numero_documento" | "anexo_nome" | "anexo_file",
        value: string | File | null
    ) {
        setParcelasFinanceiras((old) =>
            old.map((p) =>
                p.parcela === parcela
                    ? {
                        ...p,
                        [field]: value,
                        ...(field === "anexo_file" && value instanceof File
                            ? { anexo_nome: value.name }
                            : {}),
                    }
                    : p
            )
        );
    }

    async function loadFornecedores() {
        try {
            const data = await listarFornecedoresCompra();
            setFornecedoresOptions(data);
        } catch (err) {
            console.warn("Erro ao carregar fornecedores", err);
        }
    }

    async function loadFormasPagamento() {
        try {
            const data = await listarFormasPagamentoCompra();
            setFormasPagamento(data);
        } catch (err) {
            console.error(err);
            toast.error("Erro ao carregar formas de pagamento.");
        }
    }

    function buildParams(pageParam = page) {
        const params: any = {
            page: pageParam,
            limit,
            sort: orderBy,
            order: orderDir,
            orderBy,
            orderDir,
        };

        if (filtroFornecedorId) params.fornecedor_id = Number(filtroFornecedorId);
        if (filtroStatus) params.status = filtroStatus;
        if (filtroDataInicio) params.data_inicio = filtroDataInicio;
        if (filtroDataFim) params.data_fim = filtroDataFim;

        return params;
    }

    async function carregarCompras(pageParam = page) {
        setLoading(true);

        try {
            const { data, total } = await listarCompras(buildParams(pageParam));

            setRows(data);
            setTotal(total);
        } catch (e) {
            console.error(e);
            toast.error("Erro ao carregar compras.");
        } finally {
            setLoading(false);
        }
    }

    function buscar() {
        setPage(1);
        carregarCompras(1);
    }

    function limparFiltros() {
        setFiltroFornecedorId("");
        setFiltroStatus("");
        setFiltroDataInicio("");
        setFiltroDataFim("");
        setPage(1);

        setTimeout(() => carregarCompras(1), 0);
    }

    async function excluirCompra(row: CompraRow) {
        const id = Number(row?.id);
        if (!id) return;

        const fornecedorId = Number(row?.fornecedor_id);

        const fornecedorNome =
            row?.fornecedor?.nome ??
            row?.Fornecedor?.nome ??
            fornecedoresMap.get(fornecedorId)?.nome ??
            (fornecedorId ? `Fornecedor #${fornecedorId}` : "-");

        const ok = window.confirm(
            `Excluir a compra #${id}?\nFornecedor: ${fornecedorNome}\n\nEssa ação não pode ser desfeita.`
        );

        if (!ok) return;

        setDeletingId(id);

        try {
            await excluirCompraService(id);

            toast.success("Compra excluída.");

            const willBeEmpty = rows.length === 1 && page > 1;

            if (willBeEmpty) {
                setPage((p) => p - 1);
            } else {
                await carregarCompras();
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Erro ao excluir compra.");
        } finally {
            setDeletingId(null);
        }
    }

    async function cancelarCompra(row: CompraRow) {
        const id = Number(row?.id);
        if (!id) return;

        const fornecedorId = Number(row?.fornecedor_id);

        const fornecedorNome =
            row?.fornecedor?.nome ??
            row?.Fornecedor?.nome ??
            fornecedoresMap.get(fornecedorId)?.nome ??
            (fornecedorId ? `Fornecedor #${fornecedorId}` : "-");

        const ok = window.confirm(
            `Cancelar a compra #${id}?\nFornecedor: ${fornecedorNome}`
        );

        if (!ok) return;

        try {
            await cancelarCompraService(id);

            toast.success("Compra cancelada.");
            await carregarCompras();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Erro ao cancelar compra.");
        }
    }

    async function acaoFinanceiraCompra(row: CompraRow) {
        const compraId = Number(row?.id);
        if (!compraId) return;

        setFinanceiroLoadingId(compraId);

        try {
            const result = await buscarContasDaCompra(compraId);

            const contas = Array.isArray(result?.contas) ? result.contas : [];

            const contasAtivas = contas.filter(
                (conta: any) => String(conta.status || "").toUpperCase() !== "CANCELADO"
            );

            if (contasAtivas.length === 0) {
                abrirFinanceiroModal(row);
                return;
            }

            navigate(`/contas-pagar?compra_id=${compraId}`);
        } catch (err: any) {
            console.error(err);
            toast.error(
                err?.response?.data?.error || "Erro ao carregar financeiro da compra."
            );
        } finally {
            setFinanceiroLoadingId(null);
        }
    }

    function abrirFinanceiroModal(row: CompraRow) {
        const dataBase = toIsoDate(row.data_pedido);
        const formaPadrao = String((row as any)?.forma_pagamento || "").trim();

        const nextForm = {
            forma_pagamento: formaPadrao,
            quantidade_parcelas: 1,
            data_primeiro_vencimento: dataBase,
            intervalo_dias: 30,
            observacao: `Gerado a partir da compra #${row.id}`,
        };

        setFinanceiroCompra(row);
        setFinanceiroForm(nextForm);

        const valorTotal = getTotalCompra(row) || 0;

        setParcelasFinanceiras(
            gerarPreviewParcelas(
                valorTotal,
                Number(nextForm.quantidade_parcelas),
                nextForm.data_primeiro_vencimento,
                Number(nextForm.intervalo_dias)
            )
        );

        setFinanceiroModalOpen(true);
    }

    function fecharFinanceiroModal() {
        if (financeiroSaving) return;

        setFinanceiroModalOpen(false);
        setFinanceiroCompra(null);
        setParcelasFinanceiras([]);
    }

    async function confirmarGeracaoFinanceira() {
        if (!financeiroCompra) return;

        const compraId = Number(financeiroCompra.id);
        const valorTotal = getTotalCompra(financeiroCompra) || 0;

        if (valorTotal <= 0) {
            toast.warning("A compra precisa ter valor total válido.");
            return;
        }

        if (!financeiroForm.forma_pagamento) {
            toast.warning("Selecione a forma de pagamento.");
            return;
        }

        if (!financeiroForm.data_primeiro_vencimento) {
            toast.warning("Informe o primeiro vencimento.");
            return;
        }

        if (
            !Number.isInteger(Number(financeiroForm.quantidade_parcelas)) ||
            Number(financeiroForm.quantidade_parcelas) <= 0
        ) {
            toast.warning("Quantidade de parcelas inválida.");
            return;
        }

        if (
            !Number.isFinite(Number(financeiroForm.intervalo_dias)) ||
            Number(financeiroForm.intervalo_dias) < 0
        ) {
            toast.warning("Intervalo inválido.");
            return;
        }

        setFinanceiroSaving(true);
        setFinanceiroLoadingId(compraId);

        try {
            await gerarContasPagarCompra(compraId, {
                quantidade_parcelas: Number(financeiroForm.quantidade_parcelas),
                data_primeiro_vencimento: financeiroForm.data_primeiro_vencimento,
                intervalo_dias: Number(financeiroForm.intervalo_dias),
                forma_pagamento: financeiroForm.forma_pagamento,
                observacao: financeiroForm.observacao || undefined,

                // visual por enquanto; back pode ser adaptado depois
                parcelas: parcelasFinanceiras.map((p) => ({
                    parcela: p.parcela,
                    total_parcelas: p.total_parcelas,
                    data_vencimento: p.data_vencimento,
                    valor_original: p.valor_original,
                    numero_documento: p.numero_documento || null,
                    anexo_nome: p.anexo_nome || null,
                })),
            } as any);

            toast.success("Contas a pagar geradas com sucesso.");

            setRows((old) =>
                old.map((c) =>
                    c.id === compraId ? { ...c, tem_contas_pagar: true } : c
                )
            );

            fecharFinanceiroModal();
        } catch (err: any) {
            console.error(err);
            toast.error(
                err?.response?.data?.error || "Erro ao gerar contas a pagar."
            );
        } finally {
            setFinanceiroSaving(false);
            setFinanceiroLoadingId(null);
        }
    }

    async function cancelarFinanceiroCompra(row: CompraRow) {
        const compraId = Number(row?.id);

        if (!compraId) return;

        const ok = window.confirm(
            `Cancelar o fechamento financeiro da compra #${compraId}?\n\nAs parcelas serão canceladas caso não exista pagamento registrado.`
        );

        if (!ok) return;

        setFinanceiroLoadingId(compraId);

        try {
            await cancelarFechamentoFinanceiroCompra(compraId);

            toast.success("Fechamento financeiro cancelado.");

            setRows((old) =>
                old.map((c) =>
                    c.id === compraId
                        ? {
                            ...c,
                            tem_contas_pagar: false,
                        }
                        : c
                )
            );

            await carregarCompras();
        } catch (err: any) {
            console.error(err);

            toast.error(
                err?.response?.data?.error ||
                "Erro ao cancelar fechamento financeiro."
            );
        } finally {
            setFinanceiroLoadingId(null);
        }
    }

    function handleSort(
        coluna: "id" | "data_pedido" | "status" | "fornecedor_id"
    ) {
        if (orderBy === coluna) {
            setOrderDir((prev) => (prev === "ASC" ? "DESC" : "ASC"));
        } else {
            setOrderBy(coluna);
            setOrderDir("ASC");
        }
    }

    useEffect(() => {
        loadFornecedores();
        loadFormasPagamento();
        carregarCompras(1);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            carregarCompras(1);
        }, 400);

        return () => clearTimeout(t);
    }, [
        filtroFornecedorId,
        filtroStatus,
        filtroDataInicio,
        filtroDataFim,
        orderBy,
        orderDir,
    ]);

    useEffect(() => {
        carregarCompras(page);
    }, [page, limit]);

    return {
        navigate,

        rows,
        loading,
        total,
        totalPages,
        page,
        setPage,
        limit,
        setLimit,

        filtroFornecedorId,
        setFiltroFornecedorId,
        filtroStatus,
        setFiltroStatus,
        filtroDataInicio,
        setFiltroDataInicio,
        filtroDataFim,
        setFiltroDataFim,

        orderBy,
        orderDir,
        handleSort,

        fornecedoresOptions,
        fornecedoresMap,
        formasPagamento,

        deletingId,
        financeiroLoadingId,

        financeiroModalOpen,
        financeiroCompra,
        financeiroForm,
        setFinanceiroForm,
        updateFinanceiroForm,
        financeiroSaving,
        previewParcelas,
        parcelasFinanceiras,
        updateParcelaFinanceira,
        cancelarFinanceiroCompra,

        hasFilters,
        resumo,

        buscar,
        limparFiltros,
        excluirCompra,
        cancelarCompra,
        acaoFinanceiraCompra,
        fecharFinanceiroModal,
        confirmarGeracaoFinanceira,
    };
}

export const comprasListUtils = {
    parseDecimalApi,
    formatDateBR,
    formatMoneyBR,
    formatQtyBR,
    getTotalCompra,
    getResumoRecebimento,
    statusStyle,
};