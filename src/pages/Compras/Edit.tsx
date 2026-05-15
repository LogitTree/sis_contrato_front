// src/pages/Compras/Edit.tsx

import { FiPlus, FiSave, FiTrash2 } from "react-icons/fi";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  compraEditUtils,
  useCompraEdit,
} from "./hooks/useCompraEdit";

function formatMoneyBR(v: any) {
  return compraEditUtils.moneyFromApi(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatQtyBR(v: any) {
  return compraEditUtils.toNumberAny(v).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function statusStyle(status?: string): React.CSSProperties {
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

export default function CompraEdit() {
  const {
    navigate,
    compraId,
    qtdRef,

    loading,
    savingHeader,
    savingItem,
    removingItemId,

    fornecedores,
    produtos,
    itens,

    fornecedorId,
    setFornecedorId,
    dataPedido,
    setDataPedido,
    observacao,
    setObservacao,
    status,

    numeroNF,
    setNumeroNF,
    serieNF,
    setSerieNF,
    dataEmissaoNF,
    setDataEmissaoNF,
    chaveNfe,
    setChaveNfe,

    valorFrete,
    setValorFrete,
    valorDesconto,
    setValorDesconto,

    formaPagamento,
    setFormaPagamento,
    condicaoPagamento,
    setCondicaoPagamento,
    dataVencimento,
    setDataVencimento,

    produtoId,
    setProdutoId,
    qtd,
    setQtd,
    precoUnit,
    setPrecoUnit,
    previsaoEntrega,
    setPrevisaoEntrega,

    fornecedorSelecionado,
    produtoSelecionado,
    totais,

    compraEditavel,
    canReceber,
    disableHeader,
    disableItem,
    canInsert,

    salvarCabecalho,
    inserirItem,
    removerItem,
  } = useCompraEdit();

  return (
    <PageShell>
      <PageHeader
        title={`Editar Compra #${compraId || "-"}`}
        subtitle="Atualize o cabeçalho da compra e gerencie os produtos adquiridos."
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              style={buttonStyles.secondary}
              onClick={() => navigate("/compras")}
            >
              Voltar
            </button>

            {canReceber && (
              <button
                type="button"
                style={buttonStyles.primary}
                onClick={() => navigate(`/compras/${compraId}/receber`)}
              >
                Receber compra
              </button>
            )}
          </div>
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
        <SummaryCard label="Compra" value={`#${compraId || "-"}`} />
        <SummaryCard label="Status" value={String(status || "-").replaceAll("_", " ")} tone="info" />
        <SummaryCard label="Itens" value={totais.totalItens} />
        <SummaryCard label="Total final" value={formatMoneyBR(totais.totalFinal)} tone="success" />
      </div>

      <DataCard
        title="Cabeçalho da compra"
        subtitle={
          compraEditavel
            ? "Compra aberta. Cabeçalho liberado para edição."
            : "Cabeçalho bloqueado porque a compra não está aberta."
        }
      >
        <form onSubmit={salvarCabecalho}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label style={labelStyle}>Fornecedor</label>

              <select
                value={fornecedorId}
                onChange={(e) => setFornecedorId(e.target.value)}
                disabled={disableHeader}
                style={fieldStyle}
              >
                <option value="">
                  {loading ? "Carregando fornecedores..." : "Selecione"}
                </option>

                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Data do pedido</label>

              <input
                type="date"
                value={dataPedido}
                onChange={(e) => setDataPedido(e.target.value)}
                disabled={disableHeader}
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
                  fontWeight: 900,
                  ...statusStyle(status),
                }}
              >
                {String(status || "-").replaceAll("_", " ")}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 2fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label style={labelStyle}>Nº nota fiscal</label>

              <input
                value={numeroNF}
                onChange={(e) => setNumeroNF(e.target.value)}
                disabled={disableHeader}
                placeholder="Ex.: 12345"
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Série</label>

              <input
                value={serieNF}
                onChange={(e) => setSerieNF(e.target.value)}
                disabled={disableHeader}
                placeholder="Ex.: 1"
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Emissão NF</label>

              <input
                type="date"
                value={dataEmissaoNF}
                onChange={(e) => setDataEmissaoNF(e.target.value)}
                disabled={disableHeader}
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Chave NFe</label>

              <input
                value={chaveNfe}
                onChange={(e) => setChaveNfe(e.target.value)}
                disabled={disableHeader}
                placeholder="Chave de acesso da NF-e"
                style={fieldStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label style={labelStyle}>Frete</label>

              <input
                value={valorFrete}
                onChange={(e) =>
                  setValorFrete(
                    compraEditUtils.normalizeDecimalString(e.target.value)
                  )
                }
                disabled={disableHeader}
                placeholder="0,00"
                inputMode="decimal"
                style={{
                  ...fieldStyle,
                  textAlign: "right",
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>Desconto</label>

              <input
                value={valorDesconto}
                onChange={(e) =>
                  setValorDesconto(
                    compraEditUtils.normalizeDecimalString(e.target.value)
                  )
                }
                disabled={disableHeader}
                placeholder="0,00"
                inputMode="decimal"
                style={{
                  ...fieldStyle,
                  textAlign: "right",
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>Forma de pagamento</label>

              <input
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                disabled={disableHeader}
                placeholder="Ex.: Boleto, Pix..."
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Condição</label>

              <input
                value={condicaoPagamento}
                onChange={(e) => setCondicaoPagamento(e.target.value)}
                disabled={disableHeader}
                placeholder="Ex.: 30 dias"
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Vencimento</label>

              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                disabled={disableHeader}
                style={fieldStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Observação</label>

            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              disabled={disableHeader}
              placeholder="Observações adicionais da compra"
              style={{
                ...fieldStyle,
                height: 86,
                resize: "vertical",
                paddingTop: 10,
              }}
            />
          </div>

          {fornecedorSelecionado && (
            <div
              style={{
                marginTop: 12,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                borderRadius: 16,
                padding: 12,
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <InfoItem label="Fornecedor" value={fornecedorSelecionado.nome} />
              <InfoItem label="Fornecedor ID" value={`#${fornecedorSelecionado.id}`} />
              <InfoItem
                label="Edição"
                value={compraEditavel ? "Liberada" : "Bloqueada"}
              />
            </div>
          )}

          {compraEditavel && (
            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="submit"
                style={buttonStyles.primary}
                disabled={disableHeader || !dataPedido}
              >
                <FiSave size={15} />{" "}
                {savingHeader ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          )}
        </form>
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Adicionar produtos"
        subtitle={
          compraEditavel
            ? "Inclua novos produtos enquanto a compra estiver aberta."
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
            <label style={labelStyle}>Produto</label>

            <select
              value={produtoId}
              disabled={disableItem}
              onChange={(e) => setProdutoId(e.target.value)}
              style={fieldStyle}
            >
              <option value="">
                {disableItem
                  ? "Inclusão bloqueada"
                  : produtos.length === 0
                    ? "Nenhum produto disponível"
                    : "Selecione"}
              </option>

              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {compraEditUtils.nomeProduto(produto)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Quantidade</label>

            <input
              ref={qtdRef}
              value={qtd}
              onChange={(e) =>
                setQtd(compraEditUtils.normalizeDecimalString(e.target.value))
              }
              disabled={disableItem || !produtoId}
              placeholder="0"
              inputMode="decimal"
              style={{
                ...fieldStyle,
                textAlign: "right",
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Preço unitário</label>

            <input
              value={precoUnit}
              onChange={(e) =>
                setPrecoUnit(
                  compraEditUtils.normalizeDecimalString(e.target.value)
                )
              }
              disabled={disableItem || !produtoId}
              placeholder="0,00"
              inputMode="decimal"
              style={{
                ...fieldStyle,
                textAlign: "right",
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Previsão entrega</label>

            <input
              type="date"
              value={previsaoEntrega}
              onChange={(e) => setPrevisaoEntrega(e.target.value)}
              disabled={disableItem || !produtoId}
              style={fieldStyle}
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
            onClick={inserirItem}
          >
            <FiPlus size={15} /> {savingItem ? "Inserindo..." : "Adicionar"}
          </button>
        </div>

        {produtoSelecionado && (
          <div
            style={{
              marginTop: 12,
              border: "1px solid #e5e7eb",
              background: "#f8fafc",
              borderRadius: 16,
              padding: 12,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <InfoItem
              label="Produto"
              value={compraEditUtils.nomeProduto(produtoSelecionado)}
            />

            <InfoItem
              label="Preço sugerido"
              value={formatMoneyBR(
                produtoSelecionado.preco_custo ||
                produtoSelecionado.preco_unitario ||
                0
              )}
            />

            <InfoItem
              label="Subtotal informado"
              value={formatMoneyBR(
                compraEditUtils.toNumberAny(qtd) *
                compraEditUtils.toNumberAny(precoUnit)
              )}
            />
          </div>
        )}
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Itens da compra"
        subtitle="Confira os produtos vinculados à compra."
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
                  "Qtd",
                  "Recebido",
                  "Preço",
                  "Subtotal",
                  "Previsão",
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
                    Nenhum item adicionado.
                  </td>
                </tr>
              ) : (
                itens.map((item) => {
                  const qtdNum = compraEditUtils.toNumberAny(item.qtd);
                  const recebidoNum = compraEditUtils.toNumberAny(
                    item.recebido_qtd
                  );
                  const precoNum = compraEditUtils.moneyFromApi(
                    item.preco_unitario
                  );

                  const produtoNome =
                    item.produto?.nome ||
                    item.produto?.descricao ||
                    produtos.find((p) => Number(p.id) === Number(item.produto_id))
                      ?.nome ||
                    `Produto #${item.produto_id}`;

                  const podeRemover = compraEditavel && recebidoNum <= 0;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        opacity: removingItemId === item.id ? 0.65 : 1,
                      }}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>
                          {produtoNome}
                        </div>
                        <div style={subTextStyle}>Item #{item.id}</div>
                      </td>

                      <td style={tdStyle}>{formatQtyBR(qtdNum)}</td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            fontWeight: 900,
                            color: recebidoNum > 0 ? "#166534" : "#64748b",
                          }}
                        >
                          {formatQtyBR(recebidoNum)}
                        </span>
                      </td>

                      <td style={tdStyle}>{formatMoneyBR(precoNum)}</td>

                      <td style={tdStyle}>
                        <strong>{formatMoneyBR(qtdNum * precoNum)}</strong>
                      </td>

                      <td style={tdStyle}>
                        {item.previsao_entrega
                          ? item.previsao_entrega.slice(0, 10)
                          : "-"}
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <button
                          type="button"
                          title={
                            podeRemover
                              ? "Remover item"
                              : "Item não pode ser removido"
                          }
                          disabled={!podeRemover || removingItemId === item.id}
                          onClick={() => removerItem(item.id)}
                          style={{
                            ...iconButtonDanger,
                            cursor:
                              !podeRemover || removingItemId === item.id
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              !podeRemover || removingItemId === item.id
                                ? 0.65
                                : 1,
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
            <strong>{formatQtyBR(totais.totalQtd)}</strong>
          </div>

          <div style={totalLineStyle}>
            <span>Subtotal produtos</span>
            <strong>{formatMoneyBR(totais.totalValor)}</strong>
          </div>

          <div style={totalLineStyle}>
            <span>Frete</span>
            <strong>{formatMoneyBR(totais.frete)}</strong>
          </div>

          <div style={totalLineStyle}>
            <span>Desconto</span>
            <strong>{formatMoneyBR(totais.desconto)}</strong>
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
            <span>Total final</span>
            <span>{formatMoneyBR(totais.totalFinal)}</span>
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

const infoLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
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