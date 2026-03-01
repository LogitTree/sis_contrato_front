import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { badgeStyles } from "../../styles/badges";

import { toast } from "react-toastify";
import { FiTrash2 } from "react-icons/fi";
import { numeroBR } from "../../utils/format";

import ModalAdicionarItem from "./ModalAdicionarItem";

/* =========================
   TIPOS
========================= */
type Produto = {
  id: number;
  nome: string;
};

type ContratoItem = {
  id: number;
  unidade_contratada: string;
  fator_multiplicacao: number;
  preco_unitario_contratado: number;
  qtd_maxima_contratada: number;
  valor_maximo_contratado: number;

  qtd_utilizada?: number | string;
  qtde_utilizada?: number | string;
  saldo_contrato?: number | string;

  produto?: Produto;
};

type Contrato = {
  id: number;
  numero: string;
  status: string;
  orgao?: { nome: string };
  empresa?: { nome_fantasia?: string; razao_social?: string };
  itens: ContratoItem[];
};

/* =========================
   UTIL
========================= */
function moedaBR(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

/* =========================
   Component
========================= */
export default function ContratoItens() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function carregarItens() {
    try {
      const res = await api.get(`/contratos/${id}`);
      setContrato(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar itens do contrato");
    }
  }

  async function removerItem(itemId: number) {
    const confirmar = window.confirm("Tem certeza que deseja remover este item do contrato?");
    if (!confirmar) return;

    try {
      await api.delete(`/contratos/${id}/itens/${itemId}`);
      toast.success("Item removido com sucesso");
      carregarItens();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover item do contrato");
    }
  }

  useEffect(() => {
    async function load() {
      try {
        await carregarItens();
      } catch {
        navigate("/contratos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  const totalContrato = useMemo(() => {
    if (!contrato) return 0;
    return contrato.itens.reduce((acc, item) => {
      return acc + Number(item.preco_unitario_contratado) * Number(item.qtd_maxima_contratada);
    }, 0);
  }, [contrato]);

  if (loading) {
    return (
      <div style={layoutStyles.page}>
        <div style={layoutStyles.header}>
          <h1 style={layoutStyles.title}>Itens do Contrato</h1>
        </div>

        <div style={layoutStyles.card}>
          <p style={{ color: "#0f172a" }}>Carregando itens do contrato...</p>
        </div>
      </div>
    );
  }

  if (!contrato) return null;

  const empresaLabel = contrato.empresa?.nome_fantasia || contrato.empresa?.razao_social || "—";

  // estilos auxiliares para “linhas” dentro das células
  const cellTop: React.CSSProperties = { fontWeight: 800, color: "#0f172a" };
  const cellSub: React.CSSProperties = { marginTop: 4, fontSize: 12, color: "#64748b", lineHeight: 1.2 };
  const cellSub2: React.CSSProperties = { marginTop: 2, fontSize: 12, color: "#64748b", lineHeight: 1.2 };

  return (
    <div style={layoutStyles.page}>
      {/* ===== HEADER PADRÃO ===== */}
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Itens do Contrato</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>
            Contrato Nº <strong style={{ color: "#0f172a" }}>{contrato.numero}</strong> • Órgão:{" "}
            <strong style={{ color: "#0f172a" }}>{contrato.orgao?.nome ?? "—"}</strong> • Empresa:{" "}
            <strong style={{ color: "#0f172a" }}>{empresaLabel}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span
            style={{
              ...badgeStyles.base,
              ...(contrato.status === "ATIVO" ? badgeStyles.success : badgeStyles.warning),
            }}
          >
            {contrato.status}
          </span>

          <button style={buttonStyles.primary} onClick={() => setModalOpen(true)}>
            + Adicionar Item
          </button>

          <button style={buttonStyles.link} onClick={() => navigate("/contratos")}>
            Voltar
          </button>
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {modalOpen && (
        <ModalAdicionarItem
          contratoId={Number(id)}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            carregarItens();
          }}
        />
      )}

      {/* ===== TABELA ===== */}
      <div style={layoutStyles.card}>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              ...tableStyles.table,
              tableLayout: "auto",
              minWidth: 980, // ✅ evita “apertar” coluna de valores
            }}
          >
            <thead>
              <tr>
                <th style={{ ...tableStyles.th, width: "44%" }}>Produto</th>
                <th style={{ ...tableStyles.th, width: "14%" }}>Unid / Fator</th>
                <th style={{ ...tableStyles.th, width: "22%" }}>Quantidades</th>
                <th style={{ ...tableStyles.th, width: "16%" }}>Valores</th>
                <th style={{ ...tableStyles.th, width: "4%" }}></th>
              </tr>
            </thead>

            <tbody>
              {contrato.itens.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      ...tableStyles.td,
                      textAlign: "center",
                      padding: 20,
                      color: "#0f172a",
                    }}
                  >
                    Nenhum item cadastrado para este contrato.
                  </td>
                </tr>
              )}

              {contrato.itens.map((item, idx) => {
                const qtdContratada = toNumberAny(item.qtd_maxima_contratada);

                const qtdUtilizada =
                  item.qtd_utilizada !== undefined
                    ? toNumberAny(item.qtd_utilizada)
                    : toNumberAny(item.qtde_utilizada);

                const saldoContrato =
                  item.saldo_contrato !== undefined
                    ? toNumberAny(item.saldo_contrato)
                    : Math.max(0, qtdContratada - qtdUtilizada);

                const precoUnit = toNumberAny(item.preco_unitario_contratado);
                const totalItem = precoUnit * qtdContratada;

                const fator = toNumberAny(item.fator_multiplicacao);
                const totalEstoque = qtdContratada * fator;

                const saldoBadgeStyle: React.CSSProperties =
                  saldoContrato <= 0
                    ? { background: "#fee2e2", color: "#991b1b", fontWeight: 900 }
                    : { background: "#dcfce7", color: "#166534", fontWeight: 900 };

                const rowBg = idx % 2 === 0 ? "#fff" : "#f9fafb";

                return (
                  <tr key={item.id} style={{ background: rowBg }}>
                    {/* ✅ Produto com quebra garantida */}
                    <td
                      style={{
                        ...tableStyles.td,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        lineHeight: 1.35,
                      }}
                    >
                      <div style={cellTop}>{item.produto?.nome ?? "—"}</div>
                      <div style={cellSub}>
                        <span style={{ color: "#94a3b8" }}>Item contrato:</span> #{item.id}
                      </div>
                    </td>

                    {/* ✅ Unid / Fator (2 linhas) */}
                    <td style={tableStyles.td}>
                      <div style={cellTop}>{item.unidade_contratada || "—"}</div>
                      <div style={cellSub}>
                        <span style={{ color: "#94a3b8" }}>Fator:</span>{" "}
                        <strong style={{ color: "#0f172a" }}>{numeroBR(fator, 0)}</strong>
                      </div>
                      <div style={cellSub2}>
                        <span style={{ color: "#94a3b8" }}>Estoque:</span> {numeroBR(totalEstoque, 0)} UN
                      </div>
                    </td>

                    {/* ✅ Quantidades (3 “linhas”) */}
                    <td style={tableStyles.td}>
                      <div>
                        <span style={{ color: "#94a3b8", fontSize: 12 }}>Contratada:</span>{" "}
                        <strong style={{ color: "#0f172a" }}>
                          {numeroBR(qtdContratada, 3)} {item.unidade_contratada}
                        </strong>
                      </div>

                      <div style={cellSub}>
                        <span style={{ color: "#94a3b8" }}>Utilizada:</span>{" "}
                        {numeroBR(qtdUtilizada, 3)}
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            ...saldoBadgeStyle,
                          }}
                          title={`Contratada: ${numeroBR(qtdContratada, 3)} • Utilizada: ${numeroBR(qtdUtilizada, 3)}`}
                        >
                          Saldo: {numeroBR(saldoContrato, 3)}
                        </span>
                      </div>
                    </td>

                    {/* ✅ Valores (2 “linhas”) - aqui resolve o “Total apertado” */}
                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 10 }}>
                      <div style={{ ...cellTop, fontSize: 13 }}>
                        {moedaBR(precoUnit)}
                      </div>
                      <div style={cellSub}>
                        <span style={{ color: "#94a3b8" }}>Preço unitário</span>
                      </div>

                      <div style={{ marginTop: 10, fontWeight: 900, fontSize: 15, color: "#0f172a" }}>
                        {moedaBR(totalItem)}
                      </div>
                      <div style={cellSub}>
                        <span style={{ color: "#94a3b8" }}>Total do item</span>
                      </div>
                    </td>

                    {/* Ações */}
                    <td style={{ ...tableStyles.td, textAlign: "center" }}>
                      <button
                        style={{ ...buttonStyles.icon, color: "#dc2626" }}
                        title="Remover item do contrato"
                        onClick={() => removerItem(item.id)}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ===== TOTAL ===== */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid #e5e7eb",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 14, color: "#64748b", fontWeight: 700 }}>
            Total do Contrato
          </span>

          <span style={{ fontSize: 18, fontWeight: 900, color: "#16a34a" }}>
            {moedaBR(totalContrato)}
          </span>
        </div>
      </div>
    </div>
  );
}