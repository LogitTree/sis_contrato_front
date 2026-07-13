// src/pages/Compras/Create.tsx

import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheck,
  FiPlus,
  FiSave,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

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

function formatMoneyBR(value: any) {
  return compraCreateUtils.moneyFromApi(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatQtyBR(value: any) {
  return compraCreateUtils.toNumberAny(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function formatDateBR(value?: string | null) {
  if (!value) return "-";

  const raw = String(value).slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-");
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("pt-BR");
}

export default function CompraCreate() {
  const navigate = useNavigate();

  const productSearchRef = useRef<HTMLInputElement | null>(null);

  const {
    qtdRef,

    loading,
    savingHeader,
    savingItem,
    removingItemId,

    produtos,

    compraId,
    itens,

    fornecedorId,
    fornecedorBuscaRef,
    fornecedorBusca,
    fornecedorDropdown,
    fornecedoresFiltrados,
    selecionarFornecedor,
    limparFornecedor,
    alterarBuscaFornecedor,
    abrirFornecedorDropdown,
    fecharFornecedorDropdown,
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

  const [buscaProduto, setBuscaProduto] = useState("");
  const [mostrarProdutos, setMostrarProdutos] = useState(false);

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.toLowerCase().trim();

    if (!termo) return [];

    return produtos
      .filter((produto: any) => {
        const campos = [
          produto.id,
          produto.nome,
          produto.descricao,
          produto.codigo,
          produto.sku,
          produto.cod_barra,
          produto.codigo_barras,
          produto.grupo?.nome,
          produto.subgrupo?.nome,
        ];

        return campos
          .filter(
            (campo) =>
              campo !== null &&
              campo !== undefined &&
              String(campo).trim() !== ""
          )
          .some((campo) =>
            String(campo).toLowerCase().includes(termo)
          );
      })
      .slice(0, 30);
  }, [produtos, buscaProduto]);

  function getProdutoNome(produto: any) {
    return (
      produto?.nome ||
      produto?.descricao ||
      `Produto #${produto?.id || "-"}`
    );
  }

  function getCodigoProduto(produto: any) {
    return (
      produto?.cod_barra ||
      produto?.codigo_barras ||
      produto?.sku ||
      produto?.codigo ||
      "-"
    );
  }

  function getCustoProduto(produto: any) {
    return (
      produto?.preco_custo ||
      produto?.ultimo_custo ||
      produto?.ult_custo ||
      produto?.custo_medio ||
      produto?.preco_unitario ||
      0
    );
  }

  function getEstoqueProduto(produto: any) {
    return (
      produto?.qtd_livre ??
      produto?.qtd_disponivel ??
      produto?.estoque_atual ??
      produto?.estoque?.quantidade ??
      produto?.quantidade_estoque ??
      "-"
    );
  }

  function selecionarProduto(produto: any) {
    setProdutoId(String(produto.id));
    setBuscaProduto(getProdutoNome(produto));
    setMostrarProdutos(false);

    const custo = compraCreateUtils.moneyFromApi(getCustoProduto(produto));

    if (custo > 0) {
      setPrecoUnit(String(custo));
    }

    setTimeout(() => {
      qtdRef.current?.focus();
      qtdRef.current?.select();
    }, 80);
  }

  function limparProdutoSelecionado() {
    setProdutoId("");
    setBuscaProduto("");
    setQtd("");
    setPrecoUnit("");
    setPrevisaoEntrega("");
    setMostrarProdutos(false);

    setTimeout(() => {
      productSearchRef.current?.focus();
    }, 50);
  }

  async function handleAdicionarItem() {
    if (!canInsert || savingItem) return;

    await adicionarItem();

    setBuscaProduto("");
    setMostrarProdutos(false);

    setTimeout(() => {
      productSearchRef.current?.focus();
    }, 100);
  }

  function handleProductSearchKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Escape") {
      setMostrarProdutos(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (produtosFiltrados.length > 0) {
        selecionarProduto(produtosFiltrados[0]);
      }

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (produtosFiltrados.length === 1) {
        selecionarProduto(produtosFiltrados[0]);
      }
    }
  }

  function handleItemFieldKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key !== "Enter") return;

    event.preventDefault();

    if (canInsert && !savingItem) {
      handleAdicionarItem();
    }
  }

  const statusCompra = compraId ? "Em lançamento" : "Nova";

  return (
    <PageShell>
      <PageHeader
        title="Nova Compra"
        subtitle="Cadastre os dados da compra e inclua os produtos adquiridos."
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

      <div style={summaryGridStyle}>
        <SummaryCard
          label="Compra"
          value={compraId ? `#${compraId}` : "Nova"}
        />

        <SummaryCard
          label="Status"
          value={statusCompra}
          tone="info"
        />

        <SummaryCard
          label="Itens"
          value={totais.totalItens}
        />

        <SummaryCard
          label="Total final"
          value={formatMoneyBR(totais.totalFinal)}
          tone="success"
        />
      </div>

      <DataCard
        title="Dados gerais"
        subtitle={
          compraId
            ? "Cabeçalho salvo. A inclusão de produtos está liberada."
            : "Informe o fornecedor e os dados principais da compra."
        }
      >
        <form onSubmit={salvarCabecalho}>
          <div style={generalDataGridStyle}>
            <div style={supplierSearchContainerStyle}>
              <label style={labelStyle}>Fornecedor</label>

              <div
                style={{
                  ...supplierSearchBoxStyle,
                  background: disableHeader ? "#f8fafc" : "#fff",
                }}
              >
                <FiSearch size={16} color="#64748b" />

                <input
                  ref={fornecedorBuscaRef}
                  value={fornecedorBusca}
                  disabled={disableHeader}
                  onChange={(event) =>
                    alterarBuscaFornecedor(event.target.value)
                  }
                  onFocus={abrirFornecedorDropdown}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      fecharFornecedorDropdown();
                      return;
                    }

                    if (event.key === "Enter") {
                      event.preventDefault();

                      if (fornecedoresFiltrados.length === 1) {
                        selecionarFornecedor(fornecedoresFiltrados[0]);
                      }
                    }
                  }}
                  placeholder={
                    loading
                      ? "Carregando fornecedores..."
                      : "Digite o nome ou código do fornecedor"
                  }
                  style={supplierSearchInputStyle}
                />

                {fornecedorBusca && !disableHeader && (
                  <button
                    type="button"
                    style={clearSearchButtonStyle}
                    onClick={limparFornecedor}
                    title="Limpar fornecedor"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>

              {fornecedorDropdown && !disableHeader && (
                <div style={supplierResultBoxStyle}>
                  {fornecedoresFiltrados.length === 0 ? (
                    <div style={productResultEmptyStyle}>
                      Nenhum fornecedor encontrado.
                    </div>
                  ) : (
                    fornecedoresFiltrados.map((fornecedor) => (
                      <button
                        key={fornecedor.id}
                        type="button"
                        style={supplierResultItemStyle}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selecionarFornecedor(fornecedor)}
                      >
                        <div style={productResultHeaderStyle}>
                          <strong style={productNameStyle}>
                            {fornecedor.nome || `Fornecedor #${fornecedor.id}`}
                          </strong>

                          <span style={productIdStyle}>#{fornecedor.id}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Data do pedido</label>

              <input
                type="date"
                value={dataPedido}
                onChange={(event) =>
                  setDataPedido(event.target.value)
                }
                disabled={disableHeader}
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Vencimento</label>

              <input
                type="date"
                value={dataVencimento}
                onChange={(event) =>
                  setDataVencimento(event.target.value)
                }
                disabled={disableHeader}
                style={fieldStyle}
              />
            </div>
          </div>

          {fornecedorSelecionado && (
            <div style={selectedSupplierStyle}>
              <div>
                <div style={infoLabelStyle}>
                  Fornecedor selecionado
                </div>

                <div style={selectedSupplierNameStyle}>
                  {fornecedorSelecionado.nome ||
                    `Fornecedor #${fornecedorSelecionado.id}`}
                </div>
              </div>

              <div style={selectedSupplierStatusStyle}>
                <FiCheck size={14} />
                Selecionado
              </div>
            </div>
          )}

          <div style={sectionDividerStyle} />

          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              Documento fiscal
            </div>

            <div style={sectionSubtitleStyle}>
              Dados da nota fiscal vinculada à compra.
            </div>
          </div>

          <div style={invoiceGridStyle}>
            <div>
              <label style={labelStyle}>Nº nota fiscal</label>

              <input
                value={numeroNF}
                onChange={(event) =>
                  setNumeroNF(event.target.value)
                }
                disabled={disableHeader}
                placeholder="Ex.: 12345"
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Série</label>

              <input
                value={serieNF}
                onChange={(event) =>
                  setSerieNF(event.target.value)
                }
                disabled={disableHeader}
                placeholder="Ex.: 1"
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Emissão da NF</label>

              <input
                type="date"
                value={dataEmissaoNF}
                onChange={(event) =>
                  setDataEmissaoNF(event.target.value)
                }
                disabled={disableHeader}
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Chave da NF-e</label>

              <input
                value={chaveNfe}
                onChange={(event) =>
                  setChaveNfe(event.target.value)
                }
                disabled={disableHeader}
                placeholder="Chave de acesso da NF-e"
                style={fieldStyle}
              />
            </div>
          </div>

          <div style={sectionDividerStyle} />

          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              Condições comerciais
            </div>

            <div style={sectionSubtitleStyle}>
              Valores adicionais e condições de pagamento.
            </div>
          </div>

          <div style={commercialGridStyle}>
            <div>
              <label style={labelStyle}>Frete</label>

              <input
                value={valorFrete}
                onChange={(event) =>
                  setValorFrete(event.target.value)
                }
                disabled={disableHeader}
                placeholder="0,00"
                inputMode="decimal"
                style={moneyFieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Desconto</label>

              <input
                value={valorDesconto}
                onChange={(event) =>
                  setValorDesconto(event.target.value)
                }
                disabled={disableHeader}
                placeholder="0,00"
                inputMode="decimal"
                style={moneyFieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Forma de pagamento
              </label>

              <input
                value={formaPagamento}
                onChange={(event) =>
                  setFormaPagamento(event.target.value)
                }
                disabled={disableHeader}
                placeholder="Ex.: Boleto, Pix..."
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Condição de pagamento
              </label>

              <input
                value={condicaoPagamento}
                onChange={(event) =>
                  setCondicaoPagamento(event.target.value)
                }
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
              onChange={(event) =>
                setObservacao(event.target.value)
              }
              disabled={disableHeader}
              placeholder="Observações adicionais da compra"
              style={{
                ...fieldStyle,
                height: 84,
                paddingTop: 10,
                resize: "vertical",
              }}
            />
          </div>

          {!compraId && (
            <div style={headerActionsStyle}>
              <button
                type="submit"
                style={buttonStyles.primary}
                disabled={
                  savingHeader ||
                  !fornecedorId ||
                  !dataPedido
                }
              >
                <FiSave size={15} />

                {savingHeader
                  ? "Salvando..."
                  : "Salvar e liberar produtos"}
              </button>
            </div>
          )}
        </form>
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Adicionar produtos"
        subtitle={
          compraId
            ? "Pesquise um produto pelo nome, código, SKU ou código de barras."
            : "Salve os dados gerais para liberar a inclusão dos produtos."
        }
      >
        <div style={productEntryGridStyle}>
          <div style={productSearchContainerStyle}>
            <label style={labelStyle}>Produto</label>

            <div
              style={{
                ...productSearchBoxStyle,
                background: disableItem ? "#f8fafc" : "#fff",
              }}
            >
              <FiSearch size={16} color="#64748b" />

              <input
                ref={productSearchRef}
                value={buscaProduto}
                disabled={disableItem}
                onChange={(event) => {
                  const value = event.target.value;

                  setBuscaProduto(value);
                  setMostrarProdutos(value.trim().length > 0);

                  if (!value.trim()) {
                    setProdutoId("");
                  }
                }}
                onFocus={() => {
                  if (buscaProduto.trim()) {
                    setMostrarProdutos(true);
                  }
                }}
                onKeyDown={handleProductSearchKeyDown}
                placeholder={
                  !compraId
                    ? "Salve os dados gerais primeiro"
                    : "Digite nome, código, SKU ou código de barras"
                }
                style={productSearchInputStyle}
              />

              {buscaProduto && !disableItem && (
                <button
                  type="button"
                  style={clearSearchButtonStyle}
                  onClick={limparProdutoSelecionado}
                  title="Limpar produto"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            {mostrarProdutos && !disableItem && (
              <div style={productResultBoxStyle}>
                {produtosFiltrados.length === 0 ? (
                  <div style={productResultEmptyStyle}>
                    Nenhum produto encontrado.
                  </div>
                ) : (
                  produtosFiltrados.map((produto: any) => (
                    <button
                      key={produto.id}
                      type="button"
                      style={productResultItemStyle}
                      onMouseDown={(event) =>
                        event.preventDefault()
                      }
                      onClick={() =>
                        selecionarProduto(produto)
                      }
                    >
                      <div style={productResultHeaderStyle}>
                        <strong style={productNameStyle}>
                          {getProdutoNome(produto)}
                        </strong>

                        <span style={productIdStyle}>
                          #{produto.id}
                        </span>
                      </div>

                      <div style={productResultDetailsStyle}>
                        <span>
                          Código: {getCodigoProduto(produto)}
                        </span>

                        <span>
                          Custo:{" "}
                          {formatMoneyBR(
                            getCustoProduto(produto)
                          )}
                        </span>

                        <span>
                          Estoque: {getEstoqueProduto(produto)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Quantidade</label>

            <input
              ref={qtdRef}
              value={qtd}
              onChange={(event) =>
                setQtd(event.target.value)
              }
              onKeyDown={handleItemFieldKeyDown}
              disabled={disableItem || !produtoId}
              placeholder="0"
              inputMode="decimal"
              style={moneyFieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Preço unitário</label>

            <input
              value={precoUnit}
              onChange={(event) =>
                setPrecoUnit(event.target.value)
              }
              onKeyDown={handleItemFieldKeyDown}
              disabled={disableItem || !produtoId}
              placeholder="0,00"
              inputMode="decimal"
              style={moneyFieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Previsão de entrega
            </label>

            <input
              type="date"
              value={previsaoEntrega}
              onChange={(event) =>
                setPrevisaoEntrega(event.target.value)
              }
              onKeyDown={handleItemFieldKeyDown}
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
            onClick={handleAdicionarItem}
          >
            <FiPlus size={15} />

            {savingItem ? "Inserindo..." : "Adicionar"}
          </button>
        </div>

        {produtoSelecionado && (
          <div style={selectedProductStyle}>
            <InfoItem
              label="Produto selecionado"
              value={getProdutoNome(produtoSelecionado)}
            />

            <InfoItem
              label="Código"
              value={getCodigoProduto(produtoSelecionado)}
            />

            <InfoItem
              label="Custo sugerido"
              value={formatMoneyBR(
                getCustoProduto(produtoSelecionado)
              )}
            />

            <InfoItem
              label="Estoque atual"
              value={getEstoqueProduto(produtoSelecionado)}
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
        subtitle="Confira os produtos adicionados à compra."
      >
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {[
                  "Produto",
                  "Quantidade",
                  "Preço unitário",
                  "Subtotal",
                  "Entrega",
                  "Ações",
                ].map((title) => (
                  <th
                    key={title}
                    style={{
                      ...thStyle,
                      textAlign:
                        title === "Ações"
                          ? "right"
                          : title === "Quantidade" ||
                              title === "Preço unitário" ||
                              title === "Subtotal"
                            ? "right"
                            : "left",
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
                itens.map((item: any) => {
                  const qtdNum =
                    compraCreateUtils.toNumberAny(item.qtd);

                  const precoNum =
                    compraCreateUtils.moneyFromApi(
                      item.preco_unitario
                    );

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <td style={tdStyle}>
                        <div style={itemProductNameStyle}>
                          {getProdutoNome(item.produto)}
                        </div>

                        <div style={itemProductCodeStyle}>
                          Código:{" "}
                          {getCodigoProduto(item.produto)}
                        </div>
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "right",
                        }}
                      >
                        {formatQtyBR(qtdNum)}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "right",
                        }}
                      >
                        {formatMoneyBR(precoNum)}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "right",
                        }}
                      >
                        <strong>
                          {formatMoneyBR(qtdNum * precoNum)}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        {formatDateBR(
                          item.previsao_entrega
                        )}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "right",
                        }}
                      >
                        <button
                          type="button"
                          title="Remover item"
                          disabled={
                            removingItemId === item.id
                          }
                          onClick={() =>
                            removerItem(item.id)
                          }
                          style={{
                            ...iconButtonDanger,
                            opacity:
                              removingItemId === item.id
                                ? 0.6
                                : 1,
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

        <div style={totalBoxStyle}>
          <div style={totalLineStyle}>
            <span>Produtos</span>
            <strong>{totais.totalItens}</strong>
          </div>

          <div style={totalLineStyle}>
            <span>Quantidade</span>
            <strong>
              {formatQtyBR(totais.totalQtd)}
            </strong>
          </div>

          <div style={totalLineStyle}>
            <span>Subtotal dos produtos</span>
            <strong>
              {formatMoneyBR(totais.totalValor)}
            </strong>
          </div>

          <div style={totalLineStyle}>
            <span>Frete</span>
            <strong>
              {formatMoneyBR(totais.frete)}
            </strong>
          </div>

          <div style={totalLineStyle}>
            <span>Desconto</span>
            <strong>
              {formatMoneyBR(totais.desconto)}
            </strong>
          </div>

          <div style={grandTotalStyle}>
            <span>Total final</span>
            <span>
              {formatMoneyBR(totais.totalFinal)}
            </span>
          </div>
        </div>
      </DataCard>
    </PageShell>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div>
      <div style={infoLabelStyle}>{label}</div>

      <div style={infoValueStyle}>
        {value === null ||
        value === undefined ||
        value === ""
          ? "-"
          : value}
      </div>
    </div>
  );
}

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const generalDataGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr",
  gap: 12,
  alignItems: "end",
};

const invoiceGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 0.7fr 1fr 2.3fr",
  gap: 12,
  alignItems: "end",
};

const commercialGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1.5fr 1.5fr",
  gap: 12,
  alignItems: "end",
};

const productEntryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(320px, 2.4fr) 0.8fr 1fr 1fr auto",
  gap: 12,
  alignItems: "end",
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

const moneyFieldStyle: React.CSSProperties = {
  ...fieldStyle,
  textAlign: "right",
};

const sectionDividerStyle: React.CSSProperties = {
  margin: "20px 0 16px",
  height: 1,
  background: "#e5e7eb",
};

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  color: "#0f172a",
};

const sectionSubtitleStyle: React.CSSProperties = {
  marginTop: 3,
  fontSize: 12,
  color: "#64748b",
};

const selectedSupplierStyle: React.CSSProperties = {
  marginTop: 12,
  border: "1px solid #dbeafe",
  borderRadius: 14,
  background: "#eff6ff",
  padding: "11px 13px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const selectedSupplierNameStyle: React.CSSProperties = {
  marginTop: 3,
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 900,
};

const selectedSupplierStatusStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  borderRadius: 999,
  padding: "5px 10px",
  background: "#dcfce7",
  color: "#166534",
  fontSize: 11,
  fontWeight: 900,
};

const headerActionsStyle: React.CSSProperties = {
  marginTop: 16,
  display: "flex",
  justifyContent: "flex-end",
};

const supplierSearchContainerStyle: React.CSSProperties = {
  position: "relative",
  minWidth: 0,
};

const supplierSearchBoxStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  border: "1px solid #dbe3ee",
  borderRadius: 12,
  padding: "0 10px",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const supplierSearchInputStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#0f172a",
  fontSize: 14,
};

const supplierResultBoxStyle: React.CSSProperties = {
  position: "absolute",
  top: 68,
  left: 0,
  right: 0,
  zIndex: 120,
  maxHeight: 300,
  overflowY: "auto",
  padding: 8,
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "#fff",
  boxShadow: "0 18px 48px rgba(15,23,42,0.18)",
};

const supplierResultItemStyle: React.CSSProperties = {
  width: "100%",
  marginBottom: 7,
  padding: "11px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: 13,
  background: "#fff",
  cursor: "pointer",
  textAlign: "left",
};

const productSearchContainerStyle: React.CSSProperties = {
  position: "relative",
  minWidth: 0,
};

const productSearchBoxStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  border: "1px solid #dbe3ee",
  borderRadius: 12,
  padding: "0 10px",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const productSearchInputStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#0f172a",
  fontSize: 14,
};

const clearSearchButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  border: "none",
  borderRadius: 9,
  background: "#f1f5f9",
  color: "#64748b",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const productResultBoxStyle: React.CSSProperties = {
  position: "absolute",
  top: 68,
  left: 0,
  right: 0,
  zIndex: 100,
  maxHeight: 320,
  overflowY: "auto",
  padding: 8,
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "#fff",
  boxShadow: "0 18px 48px rgba(15,23,42,0.18)",
};

const productResultItemStyle: React.CSSProperties = {
  width: "100%",
  marginBottom: 7,
  padding: "11px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: 13,
  background: "#fff",
  cursor: "pointer",
  textAlign: "left",
};

const productResultHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 10,
};

const productNameStyle: React.CSSProperties = {
  color: "#0f172a",
  fontSize: 13,
  lineHeight: 1.35,
};

const productIdStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const productResultDetailsStyle: React.CSSProperties = {
  marginTop: 5,
  display: "flex",
  flexWrap: "wrap",
  gap: "4px 12px",
  color: "#64748b",
  fontSize: 11,
  fontWeight: 700,
};

const productResultEmptyStyle: React.CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#64748b",
  fontSize: 13,
};

const selectedProductStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "#f8fafc",
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  gap: 12,
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.45,
};

const infoValueStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 13,
  fontWeight: 800,
  color: "#0f172a",
};

const tableWrapperStyle: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  minHeight: 260,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
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

const itemProductNameStyle: React.CSSProperties = {
  fontWeight: 800,
  color: "#0f172a",
};

const itemProductCodeStyle: React.CSSProperties = {
  marginTop: 3,
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 700,
};

const emptyStyle: React.CSSProperties = {
  height: 210,
  padding: 36,
  textAlign: "center",
  verticalAlign: "middle",
  fontSize: 13,
  color: "#64748b",
};

const iconButtonDanger: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#dc2626",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const totalBoxStyle: React.CSSProperties = {
  marginTop: 16,
  borderRadius: 18,
  background: "#0f172a",
  padding: 18,
  color: "#fff",
};

const totalLineStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 8,
  color: "#cbd5e1",
  fontSize: 13,
};

const grandTotalStyle: React.CSSProperties = {
  marginTop: 14,
  paddingTop: 14,
  borderTop: "1px solid rgba(255,255,255,0.16)",
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  color: "#fff",
  fontSize: 22,
  fontWeight: 900,
};