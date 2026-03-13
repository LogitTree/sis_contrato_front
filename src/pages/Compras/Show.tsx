import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { tableStyles } from "../../styles/table";

import { FiEdit, FiPackage, FiRotateCcw } from "react-icons/fi";

type CompraStatus =
  | "ABERTA"
  | "PARCIALMENTE_RECEBIDA"
  | "RECEBIDA"
  | "CANCELADA";

type CompraItem = {
  id: number;
  produto_id: number;
  qtd: string;
  preco_unitario: string;
  recebido_qtd?: string;
  qtd_cancelada?: string;
  status?: string;
  previsao_entrega?: string | null;
  produto?: {
    nome?: string;
    descricao?: string;
  };
};

type CompraData = {
  id: number;
  fornecedor_id?: number | null;
  fornecedor?: {
    nome?: string;
    razao_social?: string;
    nome_fantasia?: string;
  };
  Fornecedor?: {
    nome?: string;
    razao_social?: string;
    nome_fantasia?: string;
  };
  data_pedido?: string;
  status?: CompraStatus;
  observacao?: string | null;

  numero_nota_fiscal?: string | null;
  serie_nota_fiscal?: string | null;
  data_emissao_nf?: string | null;
  chave_nfe?: string | null;

  valor_frete?: string | number | null;
  valor_desconto?: string | number | null;
  valor_total?: string | number | null;

  forma_pagamento?: string | null;
  condicao_pagamento?: string | null;
  data_vencimento?: string | null;

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

function formatMoneyBR(v: any) {
  const n = toNumberAny(v);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatQtyBR(v: any) {
  const n = toNumberAny(v);
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

function normalizeStatus(value: any): CompraStatus {
  const s = String(value || "ABERTA").toUpperCase();
  if (s === "PARCIALMENTE_RECEBIDA") return "PARCIALMENTE_RECEBIDA";
  if (s === "RECEBIDA") return "RECEBIDA";
  if (s === "CANCELADA") return "CANCELADA";
  return "ABERTA";
}

function getStatusStyle(status: any) {
  const s = String(status || "").toUpperCase();

  if (s === "RECEBIDA") return { background: "#dcfce7", color: "#166534" };
  if (s === "PARCIALMENTE_RECEBIDA") return { background: "#fef3c7", color: "#92400e" };
  if (s === "CANCELADA") return { background: "#fee2e2", color: "#991b1b" };
  return { background: "#dbeafe", color: "#1e40af" };
}

function getItemStatusStyle(status: any) {
  const s = String(status || "").toUpperCase();

  if (s === "RECEBIDO") return { background: "#dcfce7", color: "#166534" };
  if (s === "PARCIALMENTE_RECEBIDO") return { background: "#fef3c7", color: "#92400e" };
  if (s === "CANCELADO") return { background: "#fee2e2", color: "#991b1b" };
  return { background: "#dbeafe", color: "#1e40af" };
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
        {label}
      </div>
      <div
        style={{
          minHeight: 38,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          background: "#f8fafc",
          color: "#0f172a",
          fontWeight: 600,
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

export default function ComprasShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const compraId = Number(id);

  const [loading, setLoading] = useState(true);
  const [compra, setCompra] = useState<CompraData | null>(null);
  async function estornarRecebimento(item: any) {
    const recebido = toNumberAny(item?.recebido_qtd);

    if (recebido <= 0) {
      toast.error("Este item não possui recebimento para estornar.");
      return;
    }

    const valor = window.prompt(
      `Informe a quantidade para estornar do item "${item?.produto?.nome || item?.produto?.descricao || `Produto #${item?.produto_id}`}".\nRecebido atual: ${formatQtyBR(recebido)}`,
      String(recebido)
    );

    if (valor === null) return;

    const quantidade = toNumberAny(valor);

    if (quantidade <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }

    try {
      await api.post(`/compras/${compraId}/estornar-recebimento`, {
        item_id: item.id,
        quantidade,
      });

      toast.success("Estorno realizado com sucesso!");
      await loadCompra();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao estornar recebimento");
    }
  }
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
      status: normalizeStatus(c.status),
      itens,
    });
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

  const totais = useMemo(() => {
    const totalItens = itens.length;
    const totalQtd = itens.reduce((acc, it) => acc + toNumberAny(it.qtd), 0);
    const totalRecebido = itens.reduce((acc, it) => acc + toNumberAny(it.recebido_qtd), 0);
    const totalPendente = itens.reduce((acc, it) => {
      const qtd = toNumberAny(it.qtd);
      const recebido = toNumberAny(it.recebido_qtd);
      const cancelada = toNumberAny(it.qtd_cancelada);
      return acc + Math.max(0, qtd - recebido - cancelada);
    }, 0);

    return { totalItens, totalQtd, totalRecebido, totalPendente };
  }, [itens]);

  const fornecedorNome =
    compra?.fornecedor?.nome ??
    compra?.fornecedor?.razao_social ??
    compra?.fornecedor?.nome_fantasia ??
    compra?.Fornecedor?.nome ??
    compra?.Fornecedor?.razao_social ??
    compra?.Fornecedor?.nome_fantasia ??
    "-";

  const podeEditar = compra?.status === "ABERTA";
  const podeReceber =
    compra?.status === "ABERTA" || compra?.status === "PARCIALMENTE_RECEBIDA";

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Compra #{compraId}</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {loading ? "Carregando..." : "Visualização completa da compra"}
          </div>
        </div>

        {!loading && compra && (
          <div style={{ display: "flex", gap: 12 }}>
            <button
              style={buttonStyles.link}
              onClick={() => navigate("/compras")}
            >
              Voltar
            </button>

            {podeReceber && (
              <button
                style={buttonStyles.secondary ?? buttonStyles.primary}
                onClick={() => navigate(`/compras/${compraId}/receber`)}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <FiPackage />
                  Receber
                </span>
              </button>
            )}

            {podeEditar && (
              <button
                style={buttonStyles.primary}
                onClick={() => navigate(`/compras/${compraId}/editar`)}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <FiEdit />
                  Editar
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <div style={layoutStyles.card}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: 16 }}>
          <Field label="Fornecedor" value={fornecedorNome} />
          <Field label="Data do pedido" value={formatDateBR(compra?.data_pedido)} />
          <Field
            label="Status"
            value={
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  display: "inline-block",
                  ...getStatusStyle(compra?.status),
                }}
              >
                {String(compra?.status || "-").replaceAll("_", " ")}
              </span>
            }
          />
          <Field label="Valor total" value={formatMoneyBR(compra?.valor_total)} />

          <Field label="Número NF" value={compra?.numero_nota_fiscal || "-"} />
          <Field label="Série NF" value={compra?.serie_nota_fiscal || "-"} />
          <Field label="Emissão NF" value={formatDateBR(compra?.data_emissao_nf)} />
          <Field label="Chave NFe" value={compra?.chave_nfe || "-"} />

          <Field label="Frete" value={formatMoneyBR(compra?.valor_frete)} />
          <Field label="Desconto" value={formatMoneyBR(compra?.valor_desconto)} />
          <Field label="Forma de pagamento" value={compra?.forma_pagamento || "-"} />
          <Field label="Data de vencimento" value={formatDateBR(compra?.data_vencimento)} />
        </div>

        <div style={{ marginTop: 16 }}>
          <Field label="Condição de pagamento" value={compra?.condicao_pagamento || "-"} />
        </div>

        <div style={{ marginTop: 16 }}>
          <Field label="Observação" value={compra?.observacao || "-"} />
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div style={layoutStyles.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
            Itens da compra
          </div>

          <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>
            Itens: {totais.totalItens} · Qtd: {formatQtyBR(totais.totalQtd)} · Recebido: {formatQtyBR(totais.totalRecebido)} · Pendente: {formatQtyBR(totais.totalPendente)}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ ...tableStyles.table, tableLayout: "auto" }}>
            <thead>
              <tr>
                <th style={tableStyles.th}>Produto</th>
                <th style={{ ...tableStyles.th, textAlign: "right", width: 120 }}>Qtd</th>
                <th style={{ ...tableStyles.th, textAlign: "right", width: 140 }}>Recebido</th>
                <th style={{ ...tableStyles.th, textAlign: "right", width: 140 }}>Pendente</th>
                <th style={{ ...tableStyles.th, textAlign: "right", width: 160 }}>Preço unit.</th>
                <th style={{ ...tableStyles.th, textAlign: "right", width: 160 }}>Subtotal</th>
                <th style={{ ...tableStyles.th, width: 160, textAlign: "center" }}>Status</th>
                <th style={{ ...tableStyles.th, width: 140 }}>Prev. entrega</th>
                <th style={{ ...tableStyles.th, width: 110, textAlign: "center" }}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {!loading && itens.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Nenhum item encontrado.
                  </td>
                </tr>
              )}

              {itens.map((it, idx) => {
                const qtd = toNumberAny(it.qtd);
                const recebido = toNumberAny(it.recebido_qtd);
                const cancelada = toNumberAny(it.qtd_cancelada);
                const pendente = Math.max(0, qtd - recebido - cancelada);
                const preco = toNumberAny(it.preco_unitario);
                const subtotal = qtd * preco;

                const nome =
                  it.produto?.nome ||
                  it.produto?.descricao ||
                  `Produto #${it.produto_id}`;

                return (
                  <tr key={it.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={tableStyles.td}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{nome}</div>
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                      {formatQtyBR(qtd)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                      {formatQtyBR(recebido)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8, fontWeight: 800 }}>
                      {formatQtyBR(pendente)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                      {formatMoneyBR(preco)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8, fontWeight: 800 }}>
                      {formatMoneyBR(subtotal)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
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
                    <td style={{ ...tableStyles.td, textAlign: "center" }}>
                      {toNumberAny(it.recebido_qtd) > 0 && compra?.status !== "CANCELADA" ? (
                        <button
                          style={buttonStyles.icon}
                          onClick={() => estornarRecebimento(it)}
                          title="Estornar recebimento"
                        >
                          <FiRotateCcw size={16} color="#f59e0b" />
                        </button>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Carregando itens...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}