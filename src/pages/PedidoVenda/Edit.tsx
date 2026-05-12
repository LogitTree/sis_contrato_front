// src/pages/PedidoVenda/Edit.tsx

import { useNavigate, useParams } from "react-router-dom";
import {
  FiCheckCircle,
  FiPlus,
  FiSave,
  FiSend,
  FiTrash2,
} from "react-icons/fi";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import { pedidoVendaCreateUtils } from "./hooks/usePedidoVendaCreate";
import { usePedidoVendaEdit } from "./hooks/usePedidoVendaEdit";

function formatMoneyBR(v: any) {
  return pedidoVendaCreateUtils.moneyFromApi(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function statusColor(status?: string): React.CSSProperties {
  const s = String(status || "").toUpperCase();

  if (s === "RASCUNHO") {
    return { background: "#f1f5f9", color: "#475569" };
  }

  if (s === "APROVADO") {
    return { background: "#dbeafe", color: "#1d4ed8" };
  }

  if (s === "PARCIALMENTE_ATENDIDO") {
    return { background: "#e0f2fe", color: "#075985" };
  }

  if (["ATENDIDO", "CONCLUIDO", "CONCLUÍDO"].includes(s)) {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (s === "CANCELADO") {
    return { background: "#fee2e2", color: "#991b1b" };
  }

  if (s === "DEVOLVIDO") {
    return { background: "#fef3c7", color: "#92400e" };
  }

  return { background: "#f8fafc", color: "#475569" };
}

function statusLabel(status?: string) {
  return String(status || "-").replaceAll("_", " ");
}

function controlaLoteProduto(item: any) {
  return (
    item?.produto?.controla_lote === true ||
    item?.produto?.controla_lote === "true"
  );
}

function formatDateBR(value?: string | null) {
  if (!value) return "Sem validade";

  const s = String(value).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return "Sem validade";
  }

  const [y, m, d] = s.split("-");

  return `${d}/${m}/${y}`;
}

export default function PedidoVendaEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const pedidoId = Number(id);

  const {
    qtdRef,

    loading,
    savingHeader,
    savingItem,
    removingItemId,
    actingItemId,

    contratosOptions,
    contratoItensOptions,

    contratoId,
    setContratoId,
    data,
    setData,
    observacao,
    setObservacao,
    pedidoStatus,

    itens,

    contratoItemId,
    setContratoItemId,
    produtoId,

    qtd,
    setQtd,

    qtdSemBaixaEstoque,
    setQtdSemBaixaEstoque,

    contratoItemSelecionado,
    totais,
    saldoContratoSelecionado,
    precoContratoAtual,
    qtdExcedeSaldoContrato,

    canEditHeader,
    canManageItems,
    disableHeader,
    disableItem,
    canInsert,

    salvarCabecalho,
    adicionarItem,
    removerItem,

    abrirModalBaixa,
    confirmarBaixa,

    modalBaixaOpen,
    setModalBaixaOpen,
    itemBaixa,
    qtdBaixa,
    setQtdBaixa,
    estoqueLoteId,
    setEstoqueLoteId,
    lotesOptions,
    loadingLotes,
  } = usePedidoVendaEdit(pedidoId);

  return (
    <PageShell>
      <PageHeader
        title={`Editar Pedido de Venda #${pedidoId || "-"}`}
        subtitle="Atualize o cabeçalho, gerencie itens e acompanhe o fluxo operacional do pedido."
        action={
          <button
            type="button"
            style={buttonStyles.secondary}
            onClick={() => navigate("/pedidosvenda")}
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
        <SummaryCard label="Pedido" value={`#${pedidoId || "-"}`} />

        <SummaryCard
          label="Status"
          value={statusLabel(pedidoStatus)}
          tone="info"
        />

        <SummaryCard label="Itens" value={totais.totalItens} />

        <SummaryCard
          label="Total"
          value={formatMoneyBR(totais.totalValor)}
          tone="success"
        />
      </div>

      <DataCard
        title="Cabeçalho do pedido"
        subtitle={
          canEditHeader
            ? "Pedido em rascunho. Cabeçalho liberado para edição."
            : "Cabeçalho bloqueado após início do fluxo operacional."
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle}>Contrato</label>

            <select
              value={contratoId}
              onChange={(e) => setContratoId(e.target.value)}
              disabled={disableHeader}
              style={fieldStyle}
            >
              <option value="">
                {loading ? "Carregando contratos..." : "Selecione"}
              </option>

              {contratosOptions.map((contrato) => (
                <option key={contrato.id} value={contrato.id}>
                  {contrato.numero}
                  {contrato.orgaoNome ? ` - ${contrato.orgaoNome}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Data</label>

            <input
              type="date"
              value={data}
              disabled={disableHeader}
              onChange={(e) => setData(e.target.value)}
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Status</label>

            <div
              style={{
                ...fieldStyle,
                display: "flex",
                alignItems: "center",
                fontWeight: 800,
                ...statusColor(pedidoStatus),
              }}
            >
              {statusLabel(pedidoStatus)}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Observação</label>

          <textarea
            value={observacao}
            disabled={disableHeader}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observações adicionais do pedido"
            style={{
              ...fieldStyle,
              height: 86,
              resize: "vertical",
              paddingTop: 10,
            }}
          />
        </div>

        {canEditHeader && (
          <div
            style={{
              marginTop: 14,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              style={buttonStyles.primary}
              disabled={savingHeader || !contratoId}
              onClick={salvarCabecalho}
            >
              <FiSave size={15} />
              {" "}
              {savingHeader ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        )}
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Adicionar itens"
        subtitle={
          canManageItems
            ? "Inclua novos itens conforme saldo disponível no contrato."
            : "Inclusão de itens bloqueada para o status atual."
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle}>Item do contrato</label>

            <select
              value={contratoItemId}
              disabled={disableItem}
              onChange={(e) => setContratoItemId(e.target.value)}
              style={fieldStyle}
            >
              <option value="">
                {disableItem
                  ? "Inclusão bloqueada"
                  : contratoItensOptions.length === 0
                  ? "Nenhum item disponível"
                  : "Selecione"}
              </option>

              {contratoItensOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.produtoNome || `Produto #${item.produto_id}`} •
                  Saldo: {item.saldo_contrato ?? 0}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Qtd com baixa</label>

            <input
              ref={qtdRef}
              value={qtd}
              disabled={disableItem || !contratoItemId}
              onChange={(e) => setQtd(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              style={{
                ...fieldStyle,
                textAlign: "right",
                borderColor: qtdExcedeSaldoContrato
                  ? "#f87171"
                  : "#cbd5e1",
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Qtd sem baixa</label>

            <input
              value={qtdSemBaixaEstoque}
              disabled={disableItem || !contratoItemId}
              onChange={(e) => setQtdSemBaixaEstoque(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              style={{
                ...fieldStyle,
                textAlign: "right",
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Preço</label>

            <input
              value={formatMoneyBR(precoContratoAtual)}
              disabled
              style={{
                ...fieldStyle,
                textAlign: "right",
                background: "#f8fafc",
              }}
            />
          </div>

          <button
            type="button"
            style={{
              ...buttonStyles.primary,
              height: 40,
              whiteSpace: "nowrap",
            }}
            disabled={!canInsert || savingItem}
            onClick={adicionarItem}
          >
            <FiPlus size={15} />
            {" "}
            {savingItem ? "Inserindo..." : "Adicionar"}
          </button>
        </div>

        {contratoItemSelecionado && (
          <div
            style={{
              marginTop: 12,
              border: "1px solid #e5e7eb",
              background: qtdExcedeSaldoContrato
                ? "#fef2f2"
                : "#f8fafc",
              borderRadius: 16,
              padding: 12,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            <InfoItem
              label="Produto"
              value={
                contratoItemSelecionado.produtoNome ||
                `Produto #${produtoId || contratoItemSelecionado.produto_id}`
              }
            />

            <InfoItem
              label="Saldo disponível"
              value={saldoContratoSelecionado}
            />

            <InfoItem
              label="Preço contratado"
              value={formatMoneyBR(precoContratoAtual)}
            />
          </div>
        )}
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Itens do pedido"
        subtitle="Acompanhe os itens e processe movimentações operacionais."
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
                  "Com baixa",
                  "Sem baixa",
                  "Expedido",
                  "Pendente",
                  "Preço",
                  "Subtotal",
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
                  <td colSpan={9} style={emptyStyle}>
                    Carregando itens...
                  </td>
                </tr>
              ) : itens.length === 0 ? (
                <tr>
                  <td colSpan={9} style={emptyStyle}>
                    Nenhum item adicionado.
                  </td>
                </tr>
              ) : (
                itens.map((item) => {
                  const qtdNum =
                    pedidoVendaCreateUtils.toNumberAny(item.qtd);

                  const qtdSemBaixa =
                    pedidoVendaCreateUtils.toNumberAny(
                      (item as any).qtd_sem_baixa_estoque
                    );

                  const qtdExpedida =
                    pedidoVendaCreateUtils.toNumberAny(
                      item.qtd_expedida
                    );

                  const qtdPendente = Math.max(
                    0,
                    qtdNum - qtdExpedida
                  );

                  const precoNum =
                    pedidoVendaCreateUtils.moneyFromApi(
                      item.preco_unitario
                    );

                  const subtotal =
                    (qtdNum + qtdSemBaixa) * precoNum;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <td style={tdStyle}>
                        <div
                          style={{
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          {item.produto?.nome ||
                            `Produto #${item.produto_id}`}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <strong>{qtdNum}</strong>
                      </td>

                      <td style={tdStyle}>
                        <strong>{qtdSemBaixa}</strong>
                      </td>

                      <td style={tdStyle}>
                        <strong>{qtdExpedida}</strong>
                      </td>

                      <td style={tdStyle}>
                        <strong>{qtdPendente}</strong>
                      </td>

                      <td style={tdStyle}>
                        {formatMoneyBR(precoNum)}
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {formatMoneyBR(subtotal)}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            borderRadius: 999,
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 850,
                            ...statusColor(
                              item.status_item || "RASCUNHO"
                            ),
                          }}
                        >
                          {statusLabel(
                            item.status_item || "RASCUNHO"
                          )}
                        </span>
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                          }}
                        >
                          {canManageItems && qtdNum > 0 && (
                            <button
                              type="button"
                              title="Processar/expedir item"
                              disabled={actingItemId === item.id}
                              onClick={() => abrirModalBaixa(item)}
                              style={iconButtonStyle}
                            >
                              <FiSend size={15} />
                            </button>
                          )}

                          {canManageItems && (
                            <button
                              type="button"
                              title="Remover item"
                              disabled={removingItemId === item.id}
                              onClick={() => removerItem(item.id)}
                              style={{
                                ...iconButtonStyle,
                                color: "#dc2626",
                              }}
                            >
                              <FiTrash2 size={15} />
                            </button>
                          )}

                          {!canManageItems && (
                            <button
                              type="button"
                              title="Item bloqueado"
                              disabled
                              style={{
                                ...iconButtonStyle,
                                color: "#16a34a",
                              }}
                            >
                              <FiCheckCircle size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DataCard>

      {modalBaixaOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              Processar / Expedir Item
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={labelStyle}>Produto</div>

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {itemBaixa?.produto?.nome ||
                    `Produto #${itemBaixa?.produto_id}`}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <InfoItem
                  label="Qtd. solicitada"
                  value={itemBaixa?.qtd || 0}
                />

                <InfoItem
                  label="Qtd. reservada"
                  value={itemBaixa?.qtd_reservada || 0}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Quantidade da baixa
                </label>

                <input
                  value={qtdBaixa}
                  onChange={(e) => setQtdBaixa(e.target.value)}
                  style={{
                    ...fieldStyle,
                    textAlign: "right",
                  }}
                  inputMode="decimal"
                  autoFocus
                />
              </div>

              {controlaLoteProduto(itemBaixa) && (
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>
                    Lote / Validade
                  </label>

                  <select
                    value={estoqueLoteId}
                    onChange={(e) =>
                      setEstoqueLoteId(e.target.value)
                    }
                    style={fieldStyle}
                    disabled={loadingLotes}
                  >
                    <option value="">
                      {loadingLotes
                        ? "Carregando lotes..."
                        : "Selecione o lote"}
                    </option>

                    {lotesOptions.map((lote: any) => (
                      <option key={lote.id} value={lote.id}>
                        Lote:{" "}
                        {lote.lote || lote.codigo_lote || "-"} •
                        Validade:{" "}
                        {formatDateBR(lote.validade)} •
                        Saldo:{" "}
                        {lote.qtd_disponivel ??
                          lote.quantidade ??
                          lote.saldo ??
                          0}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  style={buttonStyles.secondary}
                  onClick={() => setModalBaixaOpen(false)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  style={buttonStyles.primary}
                  disabled={actingItemId === itemBaixa?.id}
                  onClick={confirmarBaixa}
                >
                  {actingItemId === itemBaixa?.id
                    ? "Processando..."
                    : "Confirmar baixa"}
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
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 13,
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

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
  width: 520,
  maxWidth: "95vw",
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