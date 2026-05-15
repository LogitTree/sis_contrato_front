import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiCreditCard, FiTrash2, FiX } from "react-icons/fi";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  useVendaDiretaCreate,
  vendaDiretaUtils,
} from "./hooks/useVendaDiretaCreate";

function formatMoneyBR(v: any) {
  return vendaDiretaUtils.moneyFromApi(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dateBR(v?: string | null) {
  if (!v) return "-";
  const dt = new Date(v);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("pt-BR");
}

function statusStyle(status?: string): React.CSSProperties {
  const s = String(status || "").toUpperCase();

  if (s === "CONCLUIDO") return { background: "#dcfce7", color: "#166534" };
  if (s === "CANCELADO") return { background: "#fee2e2", color: "#991b1b" };
  if (s === "RASCUNHO") return { background: "#f1f5f9", color: "#475569" };

  return { background: "#f8fafc", color: "#475569" };
}

export default function VendaDiretaEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const vendaIdParam = Number(id);

  const {
    loading,
    finishing,
    removingItemId,

    venda,
    itens,
    totais,

    lotesSelecionados,
    selecionarLote,

    carregarVenda,
    removerItem,
    finalizarVenda,
    cancelarVenda,
  } = useVendaDiretaCreate();

  useEffect(() => {
    if (vendaIdParam) {
      carregarVenda(vendaIdParam);
    }
  }, [vendaIdParam]);

  const vendaBloqueada = venda?.status && venda.status !== "RASCUNHO";

  return (
    <PageShell>
      <PageHeader
        title={`Venda Direta #${vendaIdParam || "-"}`}
        subtitle="Visualize os dados da venda direta, os itens lançados e a movimentação de estoque."
        action={
          <button
            type="button"
            style={buttonStyles.secondary}
            onClick={() => navigate("/vendas-diretas")}
          >
            Voltar
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
        <SummaryCard label="Venda" value={`#${vendaIdParam || "-"}`} />
        <SummaryCard label="Status" value={venda?.status || "-"} tone="info" />
        <SummaryCard label="Itens" value={totais.totalItens} />
        <SummaryCard
          label="Total"
          value={formatMoneyBR(totais.totalVenda)}
          tone="success"
        />
      </div>

      <DataCard
        title="Dados da venda"
        subtitle="Informações gerais da venda direta."
      >
        {loading ? (
          <div style={emptyStyle}>Carregando venda...</div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr 1fr",
                gap: 12,
                alignItems: "start",
              }}
            >
              <InfoItem label="Data" value={dateBR(venda?.data)} />

              <InfoItem
                label="Cliente / Órgão"
                value={
                  venda?.cliente?.nome ||
                  venda?.cliente?.razao_social ||
                  venda?.cliente_id ||
                  "-"
                }
              />

              <div>
                <div style={infoLabelStyle}>Status</div>
                <span
                  style={{
                    marginTop: 4,
                    display: "inline-flex",
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 900,
                    ...statusStyle(venda?.status),
                  }}
                >
                  {venda?.status || "-"}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <InfoItem label="Observação" value={venda?.observacao || "-"} />
            </div>

            {!vendaBloqueada && (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  style={{
                    ...buttonStyles.secondary,
                    color: "#dc2626",
                  }}
                  disabled={finishing}
                  onClick={cancelarVenda}
                >
                  <FiX size={15} /> Cancelar venda
                </button>

                <button
                  type="button"
                  style={buttonStyles.primary}
                  disabled={!itens.length || finishing}
                  onClick={finalizarVenda}
                >
                  <FiCreditCard size={15} />{" "}
                  {finishing ? "Finalizando..." : "Finalizar venda"}
                </button>
              </div>
            )}
          </>
        )}
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Itens da venda"
        subtitle="Produtos adicionados à venda direta."
      >
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {[
                  "Produto",
                  "Quantidade",
                  "Preço",
                  "Desconto",
                  "Total",
                  "Status",
                  "Ações",
                ].map((title) => (
                  <th
                    key={title}
                    style={{
                      padding: "12px 14px",
                      textAlign: title === "Ações" ? "right" : "left",
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      color: "#64748b",
                      whiteSpace: "nowrap",
                    }}
                  >
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
                itens.map((item) => {
                  const produto = item.produto;
                  const controlaLote = !!produto?.controla_lote;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>
                          {produto?.nome || `Produto #${item.produto_id}`}
                        </div>

                        {controlaLote && !vendaBloqueada && (
                          <div style={{ marginTop: 8, maxWidth: 360 }}>
                            <select
                              value={lotesSelecionados[item.id] || ""}
                              onChange={(e) =>
                                selecionarLote(item.id, e.target.value)
                              }
                              style={{
                                ...fieldStyle,
                                height: 34,
                                fontSize: 12,
                              }}
                            >
                              <option value="">Selecione o lote</option>

                              {produto?.lotes?.map((lote: any) => (
                                <option key={lote.id} value={lote.id}>
                                  {lote.lote || "-"} • Val:{" "}
                                  {lote.validade || "Sem validade"} • Qtd:{" "}
                                  {lote.quantidade ?? lote.qtd_disponivel ?? 0}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>

                      <td style={tdStyle}>
                        <strong>{item.qtd}</strong>
                      </td>

                      <td style={tdStyle}>
                        {formatMoneyBR(item.preco_unitario)}
                      </td>

                      <td style={tdStyle}>
                        {formatMoneyBR(item.valor_desconto)}
                      </td>

                      <td style={tdStyle}>
                        <strong>{formatMoneyBR(item.valor_total)}</strong>
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            borderRadius: 999,
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 850,
                            ...statusStyle(item.status_item || venda?.status),
                          }}
                        >
                          {item.status_item || venda?.status || "-"}
                        </span>
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        {!vendaBloqueada && (
                          <button
                            type="button"
                            title="Remover item"
                            disabled={removingItemId === item.id}
                            onClick={() => removerItem(item.id)}
                            style={{
                              ...iconButtonDanger,
                              cursor:
                                removingItemId === item.id
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: removingItemId === item.id ? 0.7 : 1,
                            }}
                          >
                            <FiTrash2 size={15} />
                          </button>
                        )}
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
            <span>Itens</span>
            <strong>{totais.totalItens}</strong>
          </div>

          <div style={totalLineStyle}>
            <span>Quantidade</span>
            <strong>{totais.totalQtd}</strong>
          </div>

          <div style={totalLineStyle}>
            <span>Descontos</span>
            <strong>{formatMoneyBR(totais.totalDesconto)}</strong>
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
            <span>Total</span>
            <span>{formatMoneyBR(totais.totalVenda)}</span>
          </div>
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

const fieldStyle: React.CSSProperties = {
  ...filterStyles.input,
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  height: 40,
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
  color: "#334155",
  verticalAlign: "middle",
};

const emptyStyle: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
};

const iconButtonDanger: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#dc2626",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const totalLineStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 13,
  color: "#cbd5e1",
  marginBottom: 8,
};