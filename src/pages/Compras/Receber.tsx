import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { toast } from "react-toastify";

import api from "../../api/api";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
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
    id?: number;
    nome?: string;
    descricao?: string;
    controla_lote?: boolean;
    controla_validade?: boolean;
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

type RecebimentoItemForm = {
  compra_item_id: number;
  receber_qtd: string;
  lote: string;
  validade: string;
};

function toNumberAny(v: any): number {
  if (v === null || v === undefined) return 0;

  const s = String(v).trim();
  if (!s) return 0;

  if (s.includes(",") && s.includes(".")) {
    const n = Number(s.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  if (s.includes(",")) {
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function formatQtyBR(v: any) {
  return toNumberAny(v).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function formatMoneyBR(v: any) {
  return toNumberAny(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
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

function statusStyle(status?: string): React.CSSProperties {
  const s = String(status || "").toUpperCase();

  if (s === "RECEBIDA" || s === "RECEBIDO") {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (s === "PARCIALMENTE_RECEBIDA" || s === "PARCIALMENTE_RECEBIDO") {
    return { background: "#fef3c7", color: "#92400e" };
  }

  if (s === "CANCELADA" || s === "CANCELADO") {
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
  const [recebimentoItens, setRecebimentoItens] = useState<
    RecebimentoItemForm[]
  >([]);

  const itens = compra?.itens ?? [];

  async function loadCompra() {
    const res = await api.get(`/compras/${compraId}`);
    const c = res.data?.data ?? res.data ?? null;

    if (!c?.id) throw new Error("Compra não encontrada");

    const listaItens = Array.isArray(c.itens)
      ? c.itens
      : Array.isArray(c.CompraItems)
        ? c.CompraItems
        : [];

    setCompra({
      ...c,
      itens: listaItens,
    });

    setRecebimentoItens(
      listaItens.map((it: CompraItem) => {
        const qtd = toNumberAny(it.qtd);
        const recebido = toNumberAny(it.recebido_qtd);
        const cancelada = toNumberAny(it.qtd_cancelada);
        const pendente = Math.max(0, qtd - recebido - cancelada);

        return {
          compra_item_id: it.id,
          receber_qtd: pendente > 0 ? String(pendente) : "",
          lote: "",
          validade: "",
        };
      })
    );
  }

  useEffect(() => {
    async function init() {
      if (!compraId) {
        toast.error("Compra inválida.");
        navigate("/compras");
        return;
      }

      setLoading(true);

      try {
        await loadCompra();
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.response?.data?.error ||
            err?.message ||
            "Erro ao carregar compra."
        );
        navigate("/compras");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [compraId, navigate]);

  function getRecebimentoItem(compraItemId: number): RecebimentoItemForm {
    return (
      recebimentoItens.find((item) => item.compra_item_id === compraItemId) || {
        compra_item_id: compraItemId,
        receber_qtd: "",
        lote: "",
        validade: "",
      }
    );
  }

  function updateRecebimentoItem(
    compraItemId: number,
    field: "receber_qtd" | "lote" | "validade",
    value: string
  ) {
    setRecebimentoItens((prev) =>
      prev.map((item) =>
        item.compra_item_id === compraItemId
          ? { ...item, [field]: value }
          : item
      )
    );
  }

  const resumo = useMemo(() => {
    let totalItens = 0;
    let totalPedido = 0;
    let totalRecebido = 0;
    let totalPendente = 0;
    let totalReceberAgora = 0;
    let totalValorReceberAgora = 0;

    for (const it of itens) {
      const qtd = toNumberAny(it.qtd);
      const recebido = toNumberAny(it.recebido_qtd);
      const cancelada = toNumberAny(it.qtd_cancelada);
      const preco = toNumberAny(it.preco_unitario);
      const pendente = Math.max(0, qtd - recebido - cancelada);

      const formItem = getRecebimentoItem(it.id);
      const agora = receberTudo ? pendente : toNumberAny(formItem.receber_qtd);
      const qtdAgora = Math.min(agora, pendente);

      totalItens += 1;
      totalPedido += qtd;
      totalRecebido += recebido;
      totalPendente += pendente;
      totalReceberAgora += qtdAgora;
      totalValorReceberAgora += qtdAgora * preco;
    }

    return {
      totalItens,
      totalPedido,
      totalRecebido,
      totalPendente,
      totalReceberAgora,
      totalValorReceberAgora,
    };
  }, [itens, receberTudo, recebimentoItens]);

  async function handleReceber() {
    if (!compra) return;

    const status = String(compra.status || "").toUpperCase();

    if (!["ABERTA", "PARCIALMENTE_RECEBIDA"].includes(status)) {
      toast.error("Esta compra não pode mais ser recebida.");
      return;
    }

    try {
      const itensPayload = itens
        .map((it) => {
          const qtd = toNumberAny(it.qtd);
          const recebido = toNumberAny(it.recebido_qtd);
          const cancelada = toNumberAny(it.qtd_cancelada);
          const pendente = Math.max(0, qtd - recebido - cancelada);

          const formItem = getRecebimentoItem(it.id);
          const receberQtd = receberTudo
            ? pendente
            : toNumberAny(formItem.receber_qtd);

          if (receberQtd <= 0) return null;

          const qtdFinal = receberQtd > pendente ? pendente : receberQtd;

          const controlaLote = !!it.produto?.controla_lote;
          const controlaValidade = !!it.produto?.controla_validade;
          const nomeProduto =
            it.produto?.nome ||
            it.produto?.descricao ||
            `Produto #${it.produto_id}`;

          if (controlaLote && !String(formItem.lote || "").trim()) {
            throw new Error(`Informe o lote para o produto ${nomeProduto}.`);
          }

          if (controlaValidade && !String(formItem.validade || "").trim()) {
            throw new Error(
              `Informe a validade para o produto ${nomeProduto}.`
            );
          }

          return {
            compra_item_id: it.id,
            receber_qtd: qtdFinal,
            lote: controlaLote ? String(formItem.lote || "").trim() : undefined,
            validade: controlaValidade
              ? String(formItem.validade || "").trim()
              : undefined,
          };
        })
        .filter(Boolean);

      if (!itensPayload.length) {
        toast.error("Informe ao menos uma quantidade para receber.");
        return;
      }

      setSaving(true);

      await api.post(`/compras/${compraId}/receber`, {
        itens: itensPayload,
      });

      toast.success("Recebimento registrado com sucesso.");
      await loadCompra();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error ||
          err?.message ||
          "Erro ao registrar recebimento."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title={`Receber Compra #${compraId || "-"}`}
        subtitle="Registre o recebimento total ou parcial dos produtos da compra."
        action={
          <button
            type="button"
            style={buttonStyles.secondary}
            onClick={() => navigate("/compras")}
            disabled={saving}
          >
            <FiArrowLeft size={15} /> Voltar
          </button>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <SummaryCard label="Itens" value={resumo.totalItens} />

        <SummaryCard
          label="Pendente"
          value={formatQtyBR(resumo.totalPendente)}
          tone="danger"
        />

        <SummaryCard
          label="Receber agora"
          value={formatQtyBR(resumo.totalReceberAgora)}
          tone="info"
        />

        <SummaryCard
          label="Valor estimado"
          value={formatMoneyBR(resumo.totalValorReceberAgora)}
          tone="success"
        />
      </div>

      <DataCard
        title="Dados do recebimento"
        subtitle={
          compra
            ? `Status atual: ${String(compra.status || "-").replaceAll(
                "_",
                " "
              )}`
            : "Carregando dados da compra..."
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 12,
            alignItems: "center",
          }}
        >
          <InfoItem
            label="Compra"
            value={`#${compraId || "-"}`}
          />

          <InfoItem
            label="Data do pedido"
            value={formatDateBR(compra?.data_pedido)}
          />

          <div>
            <div style={infoLabelStyle}>Status</div>
            <span
              style={{
                marginTop: 4,
                display: "inline-flex",
                borderRadius: 999,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 850,
                ...statusStyle(compra?.status),
              }}
            >
              {String(compra?.status || "-").replaceAll("_", " ")}
            </span>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 8,
              fontSize: 13,
              color: "#334155",
              fontWeight: 800,
            }}
          >
            <input
              type="checkbox"
              checked={receberTudo}
              onChange={(e) => setReceberTudo(e.target.checked)}
              disabled={loading || saving}
            />
            Receber tudo pendente
          </label>
        </div>
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Recebimento por item"
        subtitle="Informe a quantidade recebida e os dados de lote/validade quando exigidos pelo produto."
      >
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 1100,
              borderCollapse: "collapse",
            }}
          >
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {[
                  "Produto",
                  "Pedida",
                  "Recebida",
                  "Pendente",
                  "Recebimento",
                  "Status",
                  "Prev. Entrega",
                ].map((title) => (
                  <th key={title} style={thStyle}>
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={emptyStyle}>
                    Carregando itens...
                  </td>
                </tr>
              ) : itens.length === 0 ? (
                <tr>
                  <td colSpan={7} style={emptyStyle}>
                    Nenhum item encontrado.
                  </td>
                </tr>
              ) : (
                itens.map((it, idx) => {
                  const qtd = toNumberAny(it.qtd);
                  const recebido = toNumberAny(it.recebido_qtd);
                  const cancelada = toNumberAny(it.qtd_cancelada);
                  const pendente = Math.max(0, qtd - recebido - cancelada);

                  const nome =
                    it.produto?.nome ||
                    it.produto?.descricao ||
                    `Produto #${it.produto_id}`;

                  const controlaLote = !!it.produto?.controla_lote;
                  const controlaValidade = !!it.produto?.controla_validade;
                  const formItem = getRecebimentoItem(it.id);

                  return (
                    <tr
                      key={it.id}
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>
                          {nome}
                        </div>

                        {(controlaLote || controlaValidade) && (
                          <div style={subTextStyle}>
                            {controlaLote ? "Controla lote" : ""}
                            {controlaLote && controlaValidade ? " • " : ""}
                            {controlaValidade ? "Controla validade" : ""}
                          </div>
                        )}
                      </td>

                      <td style={tdRightStyle}>{formatQtyBR(qtd)}</td>

                      <td style={tdRightStyle}>
                        <span
                          style={{
                            fontWeight: 900,
                            color: recebido > 0 ? "#166534" : "#64748b",
                          }}
                        >
                          {formatQtyBR(recebido)}
                        </span>
                      </td>

                      <td style={tdRightStyle}>
                        <span
                          style={{
                            fontWeight: 900,
                            color: pendente > 0 ? "#b45309" : "#166534",
                          }}
                        >
                          {formatQtyBR(pendente)}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <input
                            value={
                              receberTudo
                                ? pendente > 0
                                  ? String(pendente)
                                  : ""
                                : formItem.receber_qtd
                            }
                            onChange={(e) =>
                              updateRecebimentoItem(
                                it.id,
                                "receber_qtd",
                                normalizeDecimalString(e.target.value)
                              )
                            }
                            disabled={
                              loading || saving || pendente <= 0 || receberTudo
                            }
                            inputMode="decimal"
                            placeholder="Qtd"
                            style={{
                              ...smallInputStyle,
                              textAlign: "right",
                              width: 92,
                              background:
                                pendente <= 0 || receberTudo
                                  ? "#f8fafc"
                                  : "#fff",
                            }}
                          />

                          {controlaLote && (
                            <input
                              value={formItem.lote}
                              onChange={(e) =>
                                updateRecebimentoItem(
                                  it.id,
                                  "lote",
                                  e.target.value
                                )
                              }
                              disabled={loading || saving || pendente <= 0}
                              placeholder="Lote"
                              style={{
                                ...smallInputStyle,
                                width: 120,
                                background: pendente <= 0 ? "#f8fafc" : "#fff",
                              }}
                            />
                          )}

                          {controlaValidade && (
                            <input
                              type="date"
                              value={formItem.validade}
                              onChange={(e) =>
                                updateRecebimentoItem(
                                  it.id,
                                  "validade",
                                  e.target.value
                                )
                              }
                              disabled={loading || saving || pendente <= 0}
                              style={{
                                ...smallInputStyle,
                                width: 150,
                                background: pendente <= 0 ? "#f8fafc" : "#fff",
                              }}
                            />
                          )}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            borderRadius: 999,
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 850,
                            ...statusStyle(it.status || "PENDENTE"),
                          }}
                        >
                          {String(it.status || "PENDENTE").replaceAll("_", " ")}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        {formatDateBR(it.previsao_entrega)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 16,
            borderRadius: 18,
            background: "#0f172a",
            padding: 18,
            color: "#fff",
          }}
        >
          <div style={totalLineStyle}>
            <span>Total pedido</span>
            <strong>{formatQtyBR(resumo.totalPedido)}</strong>
          </div>

          <div style={totalLineStyle}>
            <span>Total já recebido</span>
            <strong>{formatQtyBR(resumo.totalRecebido)}</strong>
          </div>

          <div style={totalLineStyle}>
            <span>Total pendente</span>
            <strong>{formatQtyBR(resumo.totalPendente)}</strong>
          </div>

          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,0.16)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 22,
              fontWeight: 900,
              gap: 16,
            }}
          >
            <span>Receber agora</span>
            <span>{formatQtyBR(resumo.totalReceberAgora)}</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            type="button"
            style={buttonStyles.secondary}
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
            <FiCheckCircle size={15} />{" "}
            {saving ? "Registrando..." : "Confirmar recebimento"}
          </button>
        </div>
      </DataCard>
    </PageShell>
  );
}

function InfoItem({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div style={infoLabelStyle}>{label}</div>

      <div
        style={{
          marginTop: 4,
          fontSize: 14,
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

const infoLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "#64748b",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
  color: "#334155",
  verticalAlign: "middle",
};

const tdRightStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: "right",
};

const subTextStyle: React.CSSProperties = {
  marginTop: 3,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 600,
};

const emptyStyle: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
};

const smallInputStyle: React.CSSProperties = {
  ...filterStyles.input,
  height: 34,
  minWidth: 0,
  padding: "0 10px",
  boxSizing: "border-box",
  fontSize: 13,
};

const totalLineStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 13,
  color: "#cbd5e1",
  marginBottom: 8,
};