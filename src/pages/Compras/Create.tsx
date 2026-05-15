// src/pages/Compras/Create.tsx

import { useNavigate } from "react-router-dom";
import { FiPlus, FiSave, FiTrash2 } from "react-icons/fi";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  compraCreateUtils,
  useCompraCreate,
} from "./hooks/useCompraCreate";

function formatMoneyBR(v: any) {
  return compraCreateUtils.moneyFromApi(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatQtyBR(v: any) {
  return compraCreateUtils.toNumberAny(v).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export default function CompraCreate() {
  const navigate = useNavigate();

  const {
    qtdRef,

    loading,
    savingHeader,
    savingItem,
    removingItemId,

    fornecedores,
    produtos,

    compraId,
    itens,

    fornecedorId,
    setFornecedorId,
    dataPedido,
    setDataPedido,
    observacao,
    setObservacao,

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

    disableHeader,
    disableItem,
    canInsert,

    salvarCabecalho,
    adicionarItem,
    removerItem,
  } = useCompraCreate();

  return (
    <PageShell>
      <PageHeader
        title="Nova Compra"
        subtitle="Cadastre o cabeçalho da compra e depois inclua os produtos adquiridos."
        action={
          <button
            type="button"
            style={buttonStyles.secondary}
            onClick={() => navigate("/compras")}
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
        <SummaryCard label="Compra" value={compraId ? `#${compraId}` : "Nova"} />

        <SummaryCard label="Itens" value={totais.totalItens} />

        <SummaryCard
          label="Quantidade"
          value={formatQtyBR(totais.totalQtd)}
          tone="info"
        />

        <SummaryCard
          label="Total final"
          value={formatMoneyBR(totais.totalFinal)}
          tone="success"
        />
      </div>

      <DataCard
        title="Cabeçalho da compra"
        subtitle={
          compraId
            ? "Cabeçalho salvo. Agora você pode adicionar produtos à compra."
            : "Informe fornecedor, data, documento fiscal e condições comerciais."
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
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label style={labelStyle}>Frete</label>

              <input
                value={valorFrete}
                onChange={(e) => setValorFrete(e.target.value)}
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
                onChange={(e) => setValorDesconto(e.target.value)}
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
              <label style={labelStyle}>Condição de pagamento</label>

              <input
                value={condicaoPagamento}
                onChange={(e) => setCondicaoPagamento(e.target.value)}
                disabled={disableHeader}
                placeholder="Ex.: 30 dias, 2 parcelas..."
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

          {!compraId && (
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
                disabled={savingHeader || !fornecedorId || !dataPedido}
              >
                <FiSave size={15} />{" "}
                {savingHeader ? "Salvando..." : "Salvar cabeçalho"}
              </button>
            </div>
          )}
        </form>
      </DataCard>

      {fornecedorSelecionado && (
        <>
          <div style={{ height: 16 }} />

          <DataCard
            title="Fornecedor selecionado"
            subtitle="Resumo do fornecedor vinculado à compra."
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <InfoItem label="Fornecedor" value={fornecedorSelecionado.nome} />
              <InfoItem label="ID" value={`#${fornecedorSelecionado.id}`} />
              <InfoItem
                label="Situação"
                value={compraId ? "Compra iniciada" : "Aguardando cabeçalho"}
              />
            </div>
          </DataCard>
        </>
      )}

      <div style={{ height: 16 }} />

      <DataCard
        title="Adicionar produtos"
        subtitle={
          compraId
            ? "Inclua os produtos adquiridos nesta compra."
            : "Salve o cabeçalho para liberar a inclusão dos produtos."
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
                {!compraId
                  ? "Salve o cabeçalho primeiro"
                  : produtos.length === 0
                    ? "Nenhum produto disponível"
                    : "Selecione"}
              </option>

              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome || produto.descricao || `Produto #${produto.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Quantidade</label>

            <input
              ref={qtdRef}
              value={qtd}
              onChange={(e) => setQtd(e.target.value)}
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
              onChange={(e) => setPrecoUnit(e.target.value)}
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
            onClick={adicionarItem}
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
              value={
                produtoSelecionado.nome ||
                produtoSelecionado.descricao ||
                `Produto #${produtoSelecionado.id}`
              }
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
                compraCreateUtils.toNumberAny(qtd) *
                  compraCreateUtils.toNumberAny(precoUnit)
              )}
            />
          </div>
        )}
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Itens da compra"
        subtitle="Confira os produtos já adicionados à compra."
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
              {itens.length === 0 ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Nenhum item adicionado.
                  </td>
                </tr>
              ) : (
                itens.map((item) => {
                  const qtdNum = compraCreateUtils.toNumberAny(item.qtd);
                  const precoNum = compraCreateUtils.moneyFromApi(
                    item.preco_unitario
                  );

                  return (
                    <tr key={item.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>
                          {item.produto?.nome ||
                            item.produto?.descricao ||
                            `Produto #${item.produto_id}`}
                        </div>
                      </td>

                      <td style={tdStyle}>{formatQtyBR(qtdNum)}</td>

                      <td style={tdStyle}>{formatMoneyBR(precoNum)}</td>

                      <td style={tdStyle}>
                        <strong>{formatMoneyBR(qtdNum * precoNum)}</strong>
                      </td>

                      <td style={tdStyle}>
                        {item.previsao_entrega
                          ? new Date(item.previsao_entrega).toLocaleDateString(
                              "pt-BR"
                            )
                          : "-"}
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <button
                          type="button"
                          title="Remover item"
                          disabled={removingItemId === item.id}
                          onClick={() => removerItem(item.id)}
                          style={{
                            ...iconButtonDanger,
                            opacity: removingItemId === item.id ? 0.7 : 1,
                            cursor:
                              removingItemId === item.id
                                ? "not-allowed"
                                : "pointer",
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