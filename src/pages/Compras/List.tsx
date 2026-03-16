import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiTrash2,
  FiPackage,
  FiXCircle,
  FiCreditCard,
  FiX,
} from "react-icons/fi";

type CompraStatus =
  | "ABERTA"
  | "PARCIALMENTE_RECEBIDA"
  | "RECEBIDA"
  | "CANCELADA";

type CompraRow = {
  id: number;
  fornecedor_id?: number | null;
  data_pedido?: string;
  status?: CompraStatus;
  observacao?: string | null;
  valor_total?: string | number | null;
  valor_frete?: string | number | null;
  valor_desconto?: string | number | null;

  fornecedor?: {
    id: number;
    nome?: string;
    razao_social?: string;
    nome_fantasia?: string;
  };
  Fornecedor?: {
    id: number;
    nome?: string;
    razao_social?: string;
    nome_fantasia?: string;
  };

  itens?: any[];
  CompraItems?: any[];
};

type FornecedorOption = {
  id: number;
  nome: string;
};

type FormaPagamentoOption = {
  id: number;
  descricao: string;
  ativo: boolean;
  permite_parcelamento: boolean;
};

type ParcelaPreview = {
  parcela: number;
  total_parcelas: number;
  data_vencimento: string;
  valor_original: number;
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

function getTotalCompra(row: any): number | null {
  if (
    row?.valor_total !== undefined &&
    row?.valor_total !== null &&
    row?.valor_total !== ""
  ) {
    return parseDecimalApi(row.valor_total);
  }

  return null;
}

function getResumoRecebimento(row: any) {
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

function formatQtyBR(v: any): string {
  const n = typeof v === "number" ? v : parseDecimalApi(v);
  if (!Number.isFinite(n)) return "0,000";

  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function toIsoDate(value: any) {
  if (!value) return new Date().toISOString().slice(0, 10);

  const s = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  return new Date().toISOString().slice(0, 10);
}

function addDays(dateString: string, days: number) {
  const dt = new Date(`${dateString}T00:00:00`);
  dt.setDate(dt.getDate() + Number(days || 0));
  return dt.toISOString().slice(0, 10);
}

function round2(value: number) {
  return Number(Number(value || 0).toFixed(2));
}

function gerarPreviewParcelas(
  valorTotal: number,
  quantidadeParcelas: number,
  dataPrimeiroVencimento: string,
  intervaloDias: number
): ParcelaPreview[] {
  const total = round2(valorTotal);
  const qtd = Math.max(1, Number(quantidadeParcelas || 1));
  const valorBase = Math.floor((total / qtd) * 100) / 100;

  const parcelas: ParcelaPreview[] = [];
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
    });
  }

  return parcelas;
}

export default function ComprasList() {
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
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [fornecedoresOptions, setFornecedoresOptions] = useState<
    FornecedorOption[]
  >([]);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [financeiroLoadingId, setFinanceiroLoadingId] = useState<number | null>(null);

  const hasFilters =
    !!filtroFornecedorId ||
    !!filtroStatus ||
    !!filtroDataInicio ||
    !!filtroDataFim;

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

  const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoOption[]>([]);

  const [financeiroModalOpen, setFinanceiroModalOpen] = useState(false);
  const [financeiroCompra, setFinanceiroCompra] = useState<CompraRow | null>(null);

  const [financeiroForm, setFinanceiroForm] = useState({
    forma_pagamento: "",
    quantidade_parcelas: 1,
    data_primeiro_vencimento: "",
    intervalo_dias: 30,
    observacao: "",
  });

  const [financeiroSaving, setFinanceiroSaving] = useState(false);

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
      console.warn(
        "Sem /fornecedores? Ajuste loadFornecedores() para seu endpoint.",
        err
      );
    }
  }

  async function carregarCompras() {
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
    if (filtroDataInicio) params.data_inicio = filtroDataInicio;
    if (filtroDataFim) params.data_fim = filtroDataFim;

    try {
      const res = await api.get("/compras", { params });
      const { data, total } = pickListResponse(res.data);
      setRows(data);
      setTotal(total);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar compras");
    } finally {
      setLoading(false);
    }
  }

  async function loadFormasPagamento() {
    try {
      const res = await api.get("/formas-pagamento", {
        params: { ativo: true, page: 1, limit: 1000, sort: "descricao", order: "ASC" },
      });

      const arr =
        res.data?.data ??
        res.data?.rows ??
        res.data?.items ??
        [];

      setFormasPagamento(arr);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar formas de pagamento");
    }
  }

  async function excluirCompra(row: any) {
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
      await api.delete(`/compras/${id}`);
      toast.success("Compra excluída!");

      const willBeEmpty = rows.length === 1 && page > 1;
      if (willBeEmpty) setPage((p) => p - 1);
      else await carregarCompras();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao excluir compra");
    } finally {
      setDeletingId(null);
    }
  }

  async function cancelarCompra(row: any) {
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
      await api.post(`/compras/${id}/cancelar`, {});
      toast.success("Compra cancelada!");
      await carregarCompras();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao cancelar compra");
    }
  }

  async function buscarContasDaCompra(compraId: number) {
    const res = await api.get(`/contas-pagar/compra/${compraId}`);
    return res.data;
  }

  async function acaoFinanceiraCompra(row: any) {
    const compraId = Number(row?.id);
    if (!compraId) return;

    setFinanceiroLoadingId(compraId);

    try {
      const result = await buscarContasDaCompra(compraId);
      const quantidade = Number(result?.quantidade || 0);
      const contas = Array.isArray(result?.contas) ? result.contas : [];

      if (quantidade <= 0 || contas.length === 0) {
        abrirFinanceiroModal(row);
        return;
      }

      navigate(`/contas-pagar?compra_id=${compraId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao carregar financeiro da compra.");
    } finally {
      setFinanceiroLoadingId(null);
    }
  }

  function abrirFinanceiroModal(row: CompraRow) {
    const dataBase = toIsoDate(row.data_pedido);
    const formaPadrao = String((row as any)?.forma_pagamento || "").trim();

    setFinanceiroCompra(row);
    setFinanceiroForm({
      forma_pagamento: formaPadrao,
      quantidade_parcelas: 1,
      data_primeiro_vencimento: dataBase,
      intervalo_dias: 30,
      observacao: `Gerado a partir da compra #${row.id}`,
    });
    setFinanceiroModalOpen(true);
  }

  function fecharFinanceiroModal() {
    if (financeiroSaving) return;
    setFinanceiroModalOpen(false);
    setFinanceiroCompra(null);
  }

  useEffect(() => {
    loadFornecedores();
    loadFormasPagamento();
    carregarCompras();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      carregarCompras();
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
    carregarCompras();
  }, [page]);

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

  function statusStyle(status: any) {
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

  const totalPages = Math.ceil(total / limit);

  const previewParcelas = useMemo(() => {
    if (!financeiroCompra) return [];

    const valorTotal = getTotalCompra(financeiroCompra) || 0;
    if (valorTotal <= 0) return [];

    return gerarPreviewParcelas(
      valorTotal,
      Number(financeiroForm.quantidade_parcelas || 1),
      financeiroForm.data_primeiro_vencimento || toIsoDate(financeiroCompra.data_pedido),
      Number(financeiroForm.intervalo_dias || 30)
    );
  }, [financeiroCompra, financeiroForm]);

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

    if (!Number.isInteger(Number(financeiroForm.quantidade_parcelas)) || Number(financeiroForm.quantidade_parcelas) <= 0) {
      toast.warning("Quantidade de parcelas inválida.");
      return;
    }

    if (!Number.isFinite(Number(financeiroForm.intervalo_dias)) || Number(financeiroForm.intervalo_dias) < 0) {
      toast.warning("Intervalo inválido.");
      return;
    }

    setFinanceiroSaving(true);
    setFinanceiroLoadingId(compraId);

    try {
      await api.post(`/contas-pagar/gerar/${compraId}`, {
        quantidade_parcelas: Number(financeiroForm.quantidade_parcelas),
        data_primeiro_vencimento: financeiroForm.data_primeiro_vencimento,
        intervalo_dias: Number(financeiroForm.intervalo_dias),
        forma_pagamento: financeiroForm.forma_pagamento,
        observacao: financeiroForm.observacao || undefined,
      });

      toast.success("Contas a pagar geradas com sucesso.");

      // ✅ ATUALIZA A LINHA DA COMPRA NA LISTA
      setRows((old) =>
        old.map((c) =>
          c.id === compraId ? { ...c, tem_contas_pagar: true } : c
        )
      );


      fecharFinanceiroModal();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao gerar contas a pagar.");
    } finally {
      setFinanceiroSaving(false);
      setFinanceiroLoadingId(null);
    }
  }

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Compras</h1>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          {total} compra(s) encontrada(s)
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
                disabled={loading || deletingId !== null || financeiroLoadingId !== null}
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
                disabled={loading || deletingId !== null}
              >
                <option value="">Todos</option>
                <option value="ABERTA">Aberta</option>
                <option value="PARCIALMENTE_RECEBIDA">
                  Parcialmente recebida
                </option>
                <option value="RECEBIDA">Recebida</option>
                <option value="CANCELADA">Cancelada</option>
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
                De
              </label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                style={{
                  ...filterStyles.input,
                  height: 36,
                  padding: "0 12px",
                }}
                disabled={loading || deletingId !== null}
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
                Até
              </label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                style={{
                  ...filterStyles.input,
                  height: 36,
                  padding: "0 12px",
                }}
                disabled={loading || deletingId !== null}
              />
            </div>

            <div style={{ flex: 1 }} />

            {hasFilters && (
              <button
                style={{ ...buttonStyles.link, marginBottom: 2 }}
                onClick={() => {
                  setFiltroFornecedorId("");
                  setFiltroStatus("");
                  setFiltroDataInicio("");
                  setFiltroDataFim("");
                }}
                disabled={loading || deletingId !== null}
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
          justifyContent: "flex-end",
          gap: 12,
          margin: "12px 0 16px",
        }}
      >
        <button
          style={buttonStyles.link}
          onClick={() => navigate(-1)}
          disabled={loading || deletingId !== null}
        >
          Voltar
        </button>
        <button
          style={buttonStyles.primary}
          onClick={() => navigate("/compras/novo")}
          disabled={loading || deletingId !== null}
        >
          + Nova Compra
        </button>
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
                  style={{ ...tableStyles.th, width: 120, cursor: "pointer" }}
                  onClick={() => handleSort("data_pedido")}
                >
                  Data {orderBy === "data_pedido" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th
                  style={{ ...tableStyles.th, width: "42%", cursor: "pointer" }}
                  onClick={() => handleSort("fornecedor_id")}
                >
                  Fornecedor {orderBy === "fornecedor_id" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th style={{ ...tableStyles.th, width: 150, textAlign: "right" }}>
                  Total
                </th>

                <th style={{ ...tableStyles.th, width: 230, textAlign: "center" }}>
                  Recebimento
                </th>

                <th
                  style={{ ...tableStyles.th, width: 150, cursor: "pointer" }}
                  onClick={() => handleSort("status")}
                >
                  Status {orderBy === "status" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th
                  style={{ ...tableStyles.th, width: 210, textAlign: "center" }}
                >
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                    Nenhuma compra encontrada.
                  </td>
                </tr>
              )}

              {rows.map((r: any, index) => {
                const totalCalc = getTotalCompra(r);
                const resumoRecebimento = getResumoRecebimento(r);
                const isDeleting = deletingId === Number(r.id);

                const fornecedorIdNum = Number(r?.fornecedor_id);
                const fornecedorNome =
                  r?.fornecedor?.nome ??
                  r?.Fornecedor?.nome ??
                  fornecedoresMap.get(fornecedorIdNum)?.nome ??
                  (fornecedorIdNum ? `Fornecedor #${fornecedorIdNum}` : "-");

                const status = String(r.status || "").toUpperCase();
                const podeEditar = status === "ABERTA";
                const podeExcluir = status === "ABERTA";
                const podeReceber =
                  status === "ABERTA" || status === "PARCIALMENTE_RECEBIDA";
                const podeCancelar =
                  status === "ABERTA" || status === "PARCIALMENTE_RECEBIDA";

                return (
                  <tr
                    key={r.id}
                    style={{
                      background: index % 2 === 0 ? "#fff" : "#f9fafb",
                      opacity: isDeleting ? 0.65 : 1,
                    }}
                  >
                    <td style={tdCompact}>{formatDateBR(r.data_pedido)}</td>

                    <td
                      style={{
                        ...tdCompact,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        lineHeight: 1.25,
                      }}
                    >
                      {fornecedorNome}
                    </td>

                    <td style={tdCompactRight}>
                      {totalCalc === null ? (
                        <span style={{ color: "#94a3b8" }}>-</span>
                      ) : (
                        formatMoneyBR(totalCalc)
                      )}
                    </td>

                    <td style={{ ...tdCompact, textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                          {formatQtyBR(resumoRecebimento.totalRecebido)} / {formatQtyBR(resumoRecebimento.totalQtd)}
                        </div>

                        <div
                          style={{
                            width: 140,
                            height: 8,
                            background: "#e5e7eb",
                            borderRadius: 999,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${resumoRecebimento.percentual}%`,
                              height: "100%",
                              background:
                                resumoRecebimento.percentual >= 100
                                  ? "#22c55e"
                                  : resumoRecebimento.percentual > 0
                                    ? "#f59e0b"
                                    : "#93c5fd",
                              borderRadius: 999,
                              transition: "width 0.2s ease",
                            }}
                          />
                        </div>

                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                          {resumoRecebimento.percentual.toFixed(0)}%
                        </div>
                      </div>
                    </td>

                    <td style={tdCompact}>
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          display: "inline-block",
                          ...statusStyle(r.status),
                        }}
                      >
                        {String(r.status || "-").replaceAll("_", " ")}
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
                          onClick={() =>
                            navigate(
                              podeEditar
                                ? `/compras/${r.id}/editar`
                                : `/compras/${r.id}`
                            )
                          }
                          disabled={loading || isDeleting || financeiroLoadingId !== null}
                          title={podeEditar ? "Editar" : "Visualizar"}
                        >
                          <FiEdit size={18} color="#2563eb" />
                        </button>

                        <button
                          style={buttonStyles.icon}
                          onClick={() => navigate(`/compras/${r.id}/receber`)}
                          disabled={loading || isDeleting || financeiroLoadingId !== null || !podeReceber}
                          title={
                            podeReceber
                              ? "Receber"
                              : "Compra não disponível para recebimento"
                          }
                        >
                          <FiPackage
                            size={18}
                            color={podeReceber ? "#16a34a" : "#94a3b8"}
                          />
                        </button>

                        <button
                          style={buttonStyles.icon}
                          onClick={() => acaoFinanceiraCompra(r)}
                          disabled={loading || isDeleting || financeiroLoadingId === Number(r.id)}
                          title="Financeiro / Contas a pagar"
                        >
                          <FiCreditCard
                            size={18}
                            color={r.tem_contas_pagar ? "#16a34a" : "#64748b"}
                          />
                        </button>

                        <button
                          style={buttonStyles.icon}
                          onClick={() => cancelarCompra(r)}
                          disabled={loading || isDeleting || financeiroLoadingId !== null || !podeCancelar}
                          title={
                            podeCancelar
                              ? "Cancelar"
                              : "Compra não pode ser cancelada"
                          }
                        >
                          <FiXCircle
                            size={18}
                            color={podeCancelar ? "#f59e0b" : "#94a3b8"}
                          />
                        </button>

                        <button
                          style={buttonStyles.icon}
                          onClick={() => excluirCompra(r)}
                          disabled={loading || isDeleting || financeiroLoadingId !== null || !podeExcluir}
                          title={
                            podeExcluir
                              ? "Excluir"
                              : "Compra não pode ser excluída"
                          }
                        >
                          <FiTrash2
                            size={18}
                            color={podeExcluir ? "#dc2626" : "#94a3b8"}
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
                    colSpan={5}
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
              disabled={loading || page === 1 || deletingId !== null}
              onClick={() => setPage((prev) => prev - 1)}
              style={buttonStyles.paginationButtonStyle(
                loading || page === 1 || deletingId !== null
              )}
            >
              <FiChevronLeft size={20} />
            </button>

            <span style={{ fontWeight: 600 }}>
              Página {page} de {totalPages}
            </span>

            <button
              disabled={loading || page >= totalPages || deletingId !== null}
              onClick={() => setPage((prev) => prev + 1)}
              style={buttonStyles.paginationButtonStyle(
                loading || page >= totalPages || deletingId !== null
              )}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
      {financeiroModalOpen && financeiroCompra && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 980,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
                  Gerar Contas a Pagar
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  Compra #{financeiroCompra.id}
                </div>
              </div>

              <button
                type="button"
                onClick={fecharFinanceiroModal}
                disabled={financeiroSaving}
                style={{
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  padding: 6,
                }}
              >
                <FiX size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ padding: 20, display: "grid", gap: 20 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Compra
                  </div>
                  <div style={{ marginTop: 4, fontWeight: 600 }}>
                    #{financeiroCompra.id}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Fornecedor
                  </div>
                  <div style={{ marginTop: 4, fontWeight: 600 }}>
                    {financeiroCompra?.fornecedor?.nome ??
                      fornecedoresMap.get(Number(financeiroCompra.fornecedor_id || 0))?.nome ??
                      "-"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Data do pedido
                  </div>
                  <div style={{ marginTop: 4, fontWeight: 600 }}>
                    {formatDateBR(financeiroCompra.data_pedido)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Valor total
                  </div>
                  <div style={{ marginTop: 4, fontWeight: 700, color: "#0f172a" }}>
                    {formatMoneyBR(getTotalCompra(financeiroCompra))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                    Forma de pagamento
                  </label>
                  <select
                    value={financeiroForm.forma_pagamento}
                    onChange={(e) =>
                      setFinanceiroForm((old) => ({
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
                    disabled={financeiroSaving}
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
                    Quantidade de parcelas
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={financeiroForm.quantidade_parcelas}
                    onChange={(e) =>
                      setFinanceiroForm((old) => ({
                        ...old,
                        quantidade_parcelas: Number(e.target.value || 1),
                      }))
                    }
                    style={{
                      ...filterStyles.input,
                      height: 40,
                      padding: "0 12px",
                      marginTop: 6,
                    }}
                    disabled={financeiroSaving}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                    Primeiro vencimento
                  </label>
                  <input
                    type="date"
                    value={financeiroForm.data_primeiro_vencimento}
                    onChange={(e) =>
                      setFinanceiroForm((old) => ({
                        ...old,
                        data_primeiro_vencimento: e.target.value,
                      }))
                    }
                    style={{
                      ...filterStyles.input,
                      height: 40,
                      padding: "0 12px",
                      marginTop: 6,
                    }}
                    disabled={financeiroSaving}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                    Intervalo entre parcelas (dias)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={financeiroForm.intervalo_dias}
                    onChange={(e) =>
                      setFinanceiroForm((old) => ({
                        ...old,
                        intervalo_dias: Number(e.target.value || 0),
                      }))
                    }
                    style={{
                      ...filterStyles.input,
                      height: 40,
                      padding: "0 12px",
                      marginTop: 6,
                    }}
                    disabled={financeiroSaving}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                    Observação
                  </label>
                  <textarea
                    value={financeiroForm.observacao}
                    onChange={(e) =>
                      setFinanceiroForm((old) => ({
                        ...old,
                        observacao: e.target.value,
                      }))
                    }
                    style={{
                      ...filterStyles.input,
                      minHeight: 90,
                      padding: 12,
                      marginTop: 6,
                      resize: "vertical",
                    }}
                    disabled={financeiroSaving}
                  />
                </div>
              </div>

              <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  Prévia das parcelas
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ ...tableStyles.table, tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ ...tableStyles.th, width: 120 }}>Parcela</th>
                        <th style={{ ...tableStyles.th, width: 180 }}>Vencimento</th>
                        <th style={{ ...tableStyles.th, width: 180, textAlign: "right" }}>
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewParcelas.map((p) => (
                        <tr key={p.parcela}>
                          <td style={tdCompactCenter}>
                            {p.parcela}/{p.total_parcelas}
                          </td>
                          <td style={tdCompact}>{formatDateBR(p.data_vencimento)}</td>
                          <td style={tdCompactRight}>{formatMoneyBR(p.valor_original)}</td>
                        </tr>
                      ))}

                      {previewParcelas.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "center", padding: 20 }}>
                            Nenhuma parcela para exibir.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 20,
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <button
                type="button"
                style={buttonStyles.link}
                onClick={fecharFinanceiroModal}
                disabled={financeiroSaving}
              >
                Fechar
              </button>

              <button
                type="button"
                style={buttonStyles.primary}
                onClick={confirmarGeracaoFinanceira}
                disabled={financeiroSaving}
              >
                Gerar contas a pagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}