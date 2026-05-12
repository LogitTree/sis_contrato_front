import { useNavigate } from "react-router-dom";
import { FiPlus, FiSave, FiTrash2 } from "react-icons/fi";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  pedidoVendaCreateUtils,
  usePedidoVendaCreate,
} from "./hooks/usePedidoVendaCreate";

function formatMoneyBR(v: any) {
  return pedidoVendaCreateUtils.moneyFromApi(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PedidoVendaCreate() {
  const navigate = useNavigate();

  const {
    qtdRef,
    loading,
    savingHeader,
    savingItem,
    removingItemId,

    contratosOptions,
    contratoItensOptions,

    contratoId,
    setContratoId,
    data,
    setData,
    observacao,
    setObservacao,

    pedidoId,
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

    disableHeader,
    disableItem,
    canInsert,

    salvarCabecalho,
    adicionarItem,
    removerItem,
  } = usePedidoVendaCreate();

  return (
    <PageShell>
      <PageHeader
        title="Novo Pedido de Venda"
        subtitle="Cadastre o cabeçalho do pedido e depois inclua os itens vinculados ao contrato."
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
        <SummaryCard label="Pedido" value={pedidoId ? `#${pedidoId}` : "Novo"} />
        <SummaryCard label="Itens" value={totais.totalItens} />
        <SummaryCard label="Quantidade" value={totais.totalQtd} tone="info" />
        <SummaryCard
          label="Total"
          value={formatMoneyBR(totais.totalValor)}
          tone="success"
        />
      </div>

      <DataCard
        title="Cabeçalho do pedido"
        subtitle={
          pedidoId
            ? "Cabeçalho salvo. Agora você pode adicionar itens ao pedido."
            : "Selecione o contrato, data e observações do pedido."
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
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

        {!pedidoId && (
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
              <FiSave size={15} />{" "}
              {savingHeader ? "Salvando..." : "Salvar cabeçalho"}
            </button>
          </div>
        )}
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Adicionar itens"
        subtitle={
          pedidoId
            ? "Informe a quantidade com baixa de estoque ou a quantidade sem baixa."
            : "Salve o cabeçalho para liberar a inclusão de itens."
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
                {!pedidoId
                  ? "Salve o cabeçalho primeiro"
                  : contratoItensOptions.length === 0
                    ? "Nenhum item disponível"
                    : "Selecione"}
              </option>

              {contratoItensOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.produtoNome || `Produto #${item.produto_id}`} • Saldo:{" "}
                  {item.saldo_contrato ?? 0}
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
                borderColor: qtdExcedeSaldoContrato ? "#f87171" : "#cbd5e1",
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
            <FiPlus size={15} /> {savingItem ? "Inserindo..." : "Adicionar"}
          </button>
        </div>

        {contratoItemSelecionado && (
          <div
            style={{
              marginTop: 12,
              border: "1px solid #e5e7eb",
              background: qtdExcedeSaldoContrato ? "#fef2f2" : "#f8fafc",
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
            <InfoItem label="Saldo disponível" value={saldoContratoSelecionado} />
            <InfoItem
              label="Preço contratado"
              value={formatMoneyBR(precoContratoAtual)}
            />
          </div>
        )}

        {qtdExcedeSaldoContrato && (
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: "#b91c1c",
              fontWeight: 700,
            }}
          >
            A quantidade com baixa excede o saldo disponível do contrato.
          </div>
        )}
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Itens do pedido"
        subtitle="Confira os itens já adicionados ao pedido de venda."
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
              {itens.length === 0 ? (
                <tr>
                  <td colSpan={7} style={emptyStyle}>
                    Nenhum item adicionado.
                  </td>
                </tr>
              ) : (
                itens.map((item) => {
                  const qtdComBaixa = pedidoVendaCreateUtils.toNumberAny(
                    item.qtd
                  );

                  const qtdSemBaixa = pedidoVendaCreateUtils.toNumberAny(
                    (item as any).qtd_sem_baixa_estoque
                  );

                  const precoNum = pedidoVendaCreateUtils.moneyFromApi(
                    item.preco_unitario
                  );

                  const subtotal = (qtdComBaixa + qtdSemBaixa) * precoNum;

                  return (
                    <tr key={item.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>
                          {item.produto?.nome || `Produto #${item.produto_id}`}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <strong>{qtdComBaixa}</strong>
                      </td>

                      <td style={tdStyle}>
                        <strong>{qtdSemBaixa}</strong>
                      </td>

                      <td style={tdStyle}>{formatMoneyBR(precoNum)}</td>

                      <td style={tdStyle}>
                        <strong>{formatMoneyBR(subtotal)}</strong>
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            borderRadius: 999,
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 850,
                            background: "#f1f5f9",
                            color: "#334155",
                          }}
                        >
                          {item.status_item || "RASCUNHO"}
                        </span>
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <button
                          type="button"
                          title="Remover item"
                          disabled={removingItemId === item.id}
                          onClick={() => removerItem(item.id)}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            border: "1px solid #e5e7eb",
                            background: "#ffffff",
                            color: "#dc2626",
                            cursor:
                              removingItemId === item.id
                                ? "not-allowed"
                                : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FiTrash2 size={15} />
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