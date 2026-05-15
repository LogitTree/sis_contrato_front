// src/pages/ContasPagar/hooks/useContasPagarList.ts

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  cancelarContaPagar,
  gerarRelatorioContasPagarPdf,
  listarContasPagar,
  listarFornecedoresContaPagar,
  type ContaPagarRow,
  type FornecedorOption,
} from "../../../services/contasPagar/contaPagarService";

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

export function formatMoneyBR(v: any): string {
  const n = typeof v === "number" ? v : parseDecimalApi(v);

  if (!Number.isFinite(n)) return "-";

  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function isVencida(status: any, dataVencimento: any) {
  const s = String(status || "").toUpperCase();

  if (s === "PAGO" || s === "CANCELADO") return false;
  if (!dataVencimento) return false;

  const hoje = new Date();
  const venc = new Date(`${String(dataVencimento).slice(0, 10)}T00:00:00`);

  hoje.setHours(0, 0, 0, 0);
  venc.setHours(0, 0, 0, 0);

  return venc < hoje;
}

export function diasEmAtraso(dataVencimento: any) {
  if (!dataVencimento) return 0;

  const hoje = new Date();
  const venc = new Date(`${String(dataVencimento).slice(0, 10)}T00:00:00`);

  hoje.setHours(0, 0, 0, 0);
  venc.setHours(0, 0, 0, 0);

  const diff = hoje.getTime() - venc.getTime();

  if (diff <= 0) return 0;

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function statusStyle(status: any, dataVencimento?: any) {
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

export function rowAccent(status: any, dataVencimento: any): string {
  const s = String(status || "").toUpperCase();

  if (s === "PAGO") return "#22c55e";
  if (s === "PARCIAL") return "#f59e0b";
  if (s === "CANCELADO") return "#9ca3af";
  if (isVencida(status, dataVencimento) || s === "VENCIDO") return "#ef4444";

  return "#3b82f6";
}

export function useContasPagarList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [rows, setRows] = useState<ContaPagarRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroFornecedorId, setFiltroFornecedorId] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCompraId, setFiltroCompraId] = useState(
    searchParams.get("compra_id") || ""
  );
  const [filtroDocumento, setFiltroDocumento] = useState("");
  const [filtroVencimentoInicio, setFiltroVencimentoInicio] = useState("");
  const [filtroVencimentoFim, setFiltroVencimentoFim] = useState("");
  const [situacaoRapida, setSituacaoRapida] = useState("");

  const [orderBy, setOrderBy] = useState<
    "id" | "data_vencimento" | "status" | "fornecedor_id" | "compra_id"
  >("data_vencimento");

  const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("ASC");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [fornecedoresOptions, setFornecedoresOptions] = useState<
    FornecedorOption[]
  >([]);

  const [cancelingId, setCancelingId] = useState<number | null>(null);

  const somenteEmAberto = situacaoRapida === "aberto";
  const somenteVencidas = situacaoRapida === "vencidas";

  const hasFilters =
    !!filtroFornecedorId ||
    !!filtroStatus ||
    !!filtroCompraId ||
    !!filtroDocumento ||
    !!filtroVencimentoInicio ||
    !!filtroVencimentoFim ||
    !!situacaoRapida;

  const fornecedoresMap = useMemo(() => {
    const m = new Map<number, FornecedorOption>();

    for (const f of fornecedoresOptions) {
      m.set(Number(f.id), f);
    }

    return m;
  }, [fornecedoresOptions]);

  const resumoTotais = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.valorOriginal += parseDecimalApi(row.valor_original);
        acc.valorPago += parseDecimalApi(row.valor_pago);
        acc.saldo += parseDecimalApi(row.saldo);

        const status = String(row.status || "").toUpperCase();

        if (status === "PAGO") acc.pagas += 1;
        else if (status === "CANCELADO") acc.canceladas += 1;
        else if (isVencida(row.status, row.data_vencimento)) acc.vencidas += 1;
        else acc.abertas += 1;

        return acc;
      },
      {
        valorOriginal: 0,
        valorPago: 0,
        saldo: 0,
        abertas: 0,
        pagas: 0,
        vencidas: 0,
        canceladas: 0,
      }
    );
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function loadFornecedores() {
    try {
      const data = await listarFornecedoresContaPagar();
      setFornecedoresOptions(data);
    } catch (err) {
      console.warn("Erro ao carregar fornecedores", err);
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
    if (filtroCompraId) params.compra_id = Number(filtroCompraId);
    if (filtroDocumento) params.numero_documento = filtroDocumento;
    if (filtroVencimentoInicio) {
      params.vencimento_inicio = filtroVencimentoInicio;
    }
    if (filtroVencimentoFim) {
      params.vencimento_fim = filtroVencimentoFim;
    }
    if (somenteEmAberto) params.somente_em_aberto = true;
    if (somenteVencidas) params.somente_vencidas = true;

    return params;
  }

  async function carregarContas(pageParam = page) {
    setLoading(true);

    try {
      const { data, total } = await listarContasPagar(buildParams(pageParam));

      setRows(data);
      setTotal(total);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar contas a pagar.");
    } finally {
      setLoading(false);
    }
  }

  function buscar() {
    setPage(1);
    carregarContas(1);
  }

  function limparFiltros() {
    setFiltroFornecedorId("");
    setFiltroStatus("");
    setFiltroCompraId("");
    setFiltroDocumento("");
    setFiltroVencimentoInicio("");
    setFiltroVencimentoFim("");
    setSituacaoRapida("");
    setPage(1);
    navigate("/contas-pagar");

    setTimeout(() => carregarContas(1), 0);
  }

  async function cancelarConta(row: ContaPagarRow) {
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
      await cancelarContaPagar(id);
      toast.success("Conta cancelada.");
      await carregarContas();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao cancelar conta.");
    } finally {
      setCancelingId(null);
    }
  }

  async function abrirRelatorioPdf() {
    try {
      await gerarRelatorioContasPagarPdf(buildParams(1));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório PDF.");
    }
  }

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

  useEffect(() => {
    loadFornecedores();
    carregarContas(1);
  }, []);

  useEffect(() => {
    const compraIdFromUrl = searchParams.get("compra_id") || "";
    setFiltroCompraId(compraIdFromUrl);
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      carregarContas(1);
    }, 400);

    return () => clearTimeout(t);
  }, [
    filtroFornecedorId,
    filtroStatus,
    filtroCompraId,
    filtroDocumento,
    filtroVencimentoInicio,
    filtroVencimentoFim,
    situacaoRapida,
    orderBy,
    orderDir,
  ]);

  useEffect(() => {
    carregarContas(page);
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
    filtroCompraId,
    setFiltroCompraId,
    filtroDocumento,
    setFiltroDocumento,
    filtroVencimentoInicio,
    setFiltroVencimentoInicio,
    filtroVencimentoFim,
    setFiltroVencimentoFim,
    situacaoRapida,
    setSituacaoRapida,

    orderBy,
    orderDir,
    handleSort,

    fornecedoresOptions,
    fornecedoresMap,

    cancelingId,
    hasFilters,
    resumoTotais,

    buscar,
    limparFiltros,
    cancelarConta,
    abrirRelatorioPdf,
  };
}

export const contasPagarListUtils = {
  parseDecimalApi,
  formatDateBR,
  formatMoneyBR,
  isVencida,
  diasEmAtraso,
  statusStyle,
  rowAccent,
};