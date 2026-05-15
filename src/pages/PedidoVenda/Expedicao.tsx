import { FiArrowLeft, FiCheckCircle, FiPackage } from "react-icons/fi";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  pedidoVendaExpedicaoUtils,
  usePedidoVendaExpedicao,
} from "./hooks/usePedidoVendaExpedicao";

function formatQtyBR(v: any) {
  return pedidoVendaExpedicaoUtils.toNumberAny(v).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function formatDateBR(value?: string | null) {
  if (!value) return "-";

  const s = String(value).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "-";

  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function statusStyle(status?: string): React.CSSProperties {
  const s = String(status || "").toUpperCase();

  if (["ATENDIDO", "CONCLUIDO", "CONCLUÍDO", "EXPEDIDO"].includes(s)) {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (["PARCIALMENTE_ATENDIDO", "PARCIALMENTE_EXPEDIDO"].includes(s)) {
    return { background: "#fef3c7", color: "#92400e" };
  }

  if (["APROVADO", "RESERVADO"].includes(s)) {
    return { background: "#dbeafe", color: "#1e40af" };
  }

  if (["CANCELADO", "DEVOLVIDO"].includes(s)) {
    return { background: "#fee2e2", color: "#991b1b" };
  }

  return { background: "#f1f5f9", color: "#475569" };
}

export default function PedidoVendaExpedicao() {
  const {
    navigate,
    pedidoId,

    loading,
    saving,

    pedido,
    itens,
    resumo,

    modalOpen,
    itemSelecionado,
    qtdBaixa,
    setQtdBaixa,
    dataExpedicao,
    setDataExpedicao,
    observacaoExpedicao,
    setObservacaoExpedicao,

    estoqueLoteId,
    setEstoqueLoteId,
    lotes,
    loadingLotes,
    produtoControlaLote,

    getSaldoPendente,
    abrirModalExpedicao,
    fecharModal,
    confirmarExpedicao,
  } = usePedidoVendaExpedicao();

  return (
    <PageShell>
      <PageHeader
        title={`Expedição do Pedido #${pedidoId || "-"}`}
        subtitle="Registre expedições parciais ou totais dos itens aprovados do pedido."
        action={
          <button
            type="button"
            style={buttonStyles.secondary}
            onClick={() => navigate(`/pedidosvenda/${pedidoId}/editar`)}
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
          label="Qtd. pedido"
          value={formatQtyBR(resumo.totalPedido)}
          tone="info"
        />

        <SummaryCard
          label="Expedido"
          value={formatQtyBR(resumo.totalExpedido)}
          tone="success"
        />

        <SummaryCard
          label="Pendente"
          value={formatQtyBR(resumo.totalPendente)}
          tone="danger"
        />
      </div>

      <DataCard
        title="Dados do pedido"
        subtitle={
          pedido
            ? `Status atual: ${String(pedido.status || "-").replaceAll("_", " ")}`
            : "Carregando dados do pedido..."
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
          <InfoItem label="Pedido" value={`#${pedidoId || "-"}`} />

          <InfoItem label="Data" value={formatDateBR(pedido?.data)} />

          <InfoItem
            label="Contrato"
            value={pedido?.contrato_id ? `#${pedido.contrato_id}` : "-"}
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
                ...statusStyle(pedido?.status),
              }}
            >
              {String(pedido?.status || "-").replaceAll("_", " ")}
            </span>
          </div>
        </div>
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Itens para expedição"
        subtitle="Informe as quantidades que serão expedidas e registre a data para emissão futura do romaneio."
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
              minWidth: 980,
              borderCollapse: "collapse",
            }}
          >
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {[
                  "Produto",
                  "Pedido",
                  "Reservado",
                  "Expedido",
                  "Pendente",
                  "Status",
                  "Ações",
                ].map((title) => (
                  <th
                    key={title}
                    style={{
                      ...thStyle,
                      textAlign: title === "Ações" ? "right" : "left",
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
                itens.map((item, idx) => {
                  const saldo = getSaldoPendente(item);

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>
                          {item.produto?.nome || `Produto #${item.produto_id}`}
                        </div>

                        {item.motivo_bloqueio && (
                          <div style={subTextStyle}>{item.motivo_bloqueio}</div>
                        )}
                      </td>

                      <td style={tdRightStyle}>{formatQtyBR(item.qtd)}</td>

                      <td style={tdRightStyle}>
                        {formatQtyBR(item.qtd_reservada)}
                      </td>

                      <td style={tdRightStyle}>
                        <span
                          style={{
                            fontWeight: 900,
                            color:
                              pedidoVendaExpedicaoUtils.toNumberAny(
                                item.qtd_expedida
                              ) > 0
                                ? "#166534"
                                : "#64748b",
                          }}
                        >
                          {formatQtyBR(item.qtd_expedida)}
                        </span>
                      </td>

                      <td style={tdRightStyle}>
                        <span
                          style={{
                            fontWeight: 900,
                            color: saldo > 0 ? "#b45309" : "#166534",
                          }}
                        >
                          {formatQtyBR(saldo)}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            borderRadius: 999,
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 850,
                            ...statusStyle(item.status_item || "PENDENTE"),
                          }}
                        >
                          {String(item.status_item || "PENDENTE").replaceAll(
                            "_",
                            " "
                          )}
                        </span>
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <button
                          type="button"
                          style={{
                            ...iconButtonStyle,
                            color: saldo > 0 ? "#166534" : "#94a3b8",
                            border:
                              saldo > 0
                                ? "1px solid #bbf7d0"
                                : "1px solid #e5e7eb",
                            background: saldo > 0 ? "#f0fdf4" : "#ffffff",
                            cursor: saldo > 0 ? "pointer" : "not-allowed",
                          }}
                          disabled={saving || saldo <= 0}
                          onClick={() => abrirModalExpedicao(item)}
                          title={
                            saldo > 0
                              ? "Expedir item"
                              : "Item sem saldo pendente"
                          }
                        >
                          <FiPackage size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DataCard>

      {modalOpen && itemSelecionado && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>Registrar expedição</div>

            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={infoLabelStyle}>Produto</div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 15,
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  {itemSelecionado.produto?.nome ||
                    `Produto #${itemSelecionado.produto_id}`}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <InfoItem
                  label="Qtd. pedido"
                  value={formatQtyBR(itemSelecionado.qtd)}
                />

                <InfoItem
                  label="Qtd. expedida"
                  value={formatQtyBR(itemSelecionado.qtd_expedida)}
                />

                <InfoItem
                  label="Saldo pendente"
                  value={formatQtyBR(getSaldoPendente(itemSelecionado))}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <label style={labelStyle}>Quantidade a expedir</label>
                  <input
                    value={qtdBaixa}
                    onChange={(e) => setQtdBaixa(e.target.value)}
                    inputMode="decimal"
                    style={{
                      ...fieldStyle,
                      textAlign: "right",
                    }}
                    disabled={saving}
                    autoFocus
                  />
                </div>

                <div>
                  <label style={labelStyle}>Data da expedição</label>
                  <input
                    type="date"
                    value={dataExpedicao}
                    onChange={(e) => setDataExpedicao(e.target.value)}
                    style={fieldStyle}
                    disabled={saving}
                  />
                </div>
              </div>

              {produtoControlaLote && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Lote / Validade</label>

                  <select
                    value={estoqueLoteId}
                    onChange={(e) => setEstoqueLoteId(e.target.value)}
                    style={fieldStyle}
                    disabled={saving || loadingLotes}
                  >
                    <option value="">
                      {loadingLotes ? "Carregando lotes..." : "Selecione o lote"}
                    </option>

                    {lotes.map((lote) => (
                      <option key={lote.id} value={lote.id}>
                        Lote: {lote.lote || "-"} • Validade:{" "}
                        {formatDateBR(lote.validade)} • Saldo:{" "}
                        {formatQtyBR(lote.quantidade)}
                      </option>
                    ))}
                  </select>

                  {!loadingLotes && lotes.length === 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#b91c1c",
                      }}
                    >
                      Nenhum lote com saldo disponível foi encontrado.
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={labelStyle}>Observação da expedição</label>
                <textarea
                  value={observacaoExpedicao}
                  onChange={(e) => setObservacaoExpedicao(e.target.value)}
                  style={{
                    ...fieldStyle,
                    height: 78,
                    paddingTop: 10,
                    resize: "vertical",
                  }}
                  disabled={saving}
                  placeholder="Ex.: entrega parcial, rota, motorista, observações..."
                />
              </div>

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  style={buttonStyles.secondary}
                  disabled={saving}
                  onClick={fecharModal}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  style={buttonStyles.primary}
                  disabled={saving}
                  onClick={confirmarExpedicao}
                >
                  <FiCheckCircle size={15} />{" "}
                  {saving ? "Registrando..." : "Confirmar expedição"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 800,
  color: "#374151",
  marginBottom: 6,
};

const fieldStyle: React.CSSProperties = {
  ...filterStyles.input,
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  height: 40,
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
  color: "#b91c1c",
  fontWeight: 600,
};

const emptyStyle: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
};

const iconButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  width: 620,
  maxWidth: "96vw",
  background: "#fff",
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
};

const modalHeaderStyle: React.CSSProperties = {
  padding: "18px 22px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
};