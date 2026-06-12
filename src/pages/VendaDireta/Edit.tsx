import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiCheckCircle,
  FiFilePlus,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  adicionarItemVendaDireta,
  buscarProdutosVendaDireta,
  type ProdutoVendaDireta,
} from "../../services/vendadireta/vendaDiretaService";

import {
  useVendaDiretaEdit,
  vendaDiretaEditUtils,
} from "./hooks/useVendaDiretaEdit";

function formatMoneyBR(v: any) {
  return vendaDiretaEditUtils.moneyFromApi(v).toLocaleString("pt-BR", {
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

  const qtdRef = useRef<HTMLInputElement | null>(null);

  const {
    loading,
    finishing,
    removingItemId,

    empresaAtiva,

    venda,
    itens,
    vendaBloqueada,
    totais,

    lotesSelecionados,
    selecionarLote,

    carregarVenda,
    removerItem,
    finalizarVenda,
    cancelarVenda,
  } = useVendaDiretaEdit(vendaIdParam);

  const [modalProdutoOpen, setModalProdutoOpen] = useState(false);
  const [modalItemOpen, setModalItemOpen] = useState(false);

  const [searchProduto, setSearchProduto] = useState("");
  const [searchingProduto, setSearchingProduto] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  const [produtosEncontrados, setProdutosEncontrados] = useState<
    ProdutoVendaDireta[]
  >([]);

  const [produtoSelecionado, setProdutoSelecionado] =
    useState<ProdutoVendaDireta | null>(null);

  const [qtd, setQtd] = useState("1");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [valorDesconto, setValorDesconto] = useState("");

  const qtdNum = useMemo(
    () => vendaDiretaEditUtils.toNumberAny(qtd),
    [qtd]
  );

  const precoNum = useMemo(
    () => vendaDiretaEditUtils.moneyFromApi(precoUnitario),
    [precoUnitario]
  );

  const descontoNum = useMemo(
    () => vendaDiretaEditUtils.moneyFromApi(valorDesconto),
    [valorDesconto]
  );

  const subtotalItem = useMemo(() => {
    return Math.max(0, qtdNum * precoNum - descontoNum);
  }, [qtdNum, precoNum, descontoNum]);

  function selecionarProduto(produto: ProdutoVendaDireta) {
    setProdutoSelecionado(produto);

    setPrecoUnitario(
      String(
        vendaDiretaEditUtils.moneyFromApi(
          produto.preco_venda || produto.preco_referencia || 0
        )
      )
    );

    setQtd("1");
    setValorDesconto("");

    setTimeout(() => qtdRef.current?.focus(), 80);
  }

  async function pesquisarProdutos() {
    const termo = searchProduto.trim();

    if (!termo) {
      setProdutosEncontrados([]);
      return;
    }

    setSearchingProduto(true);

    try {
      const result = await buscarProdutosVendaDireta({
        search: termo,
      });

      setProdutosEncontrados(result);

      if (!result.length) {
        toast.info("Nenhum produto encontrado.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao pesquisar produtos.");
    } finally {
      setSearchingProduto(false);
    }
  }

  async function adicionarItem() {
    if (!vendaIdParam) return;

    if (vendaBloqueada) {
      toast.error("Esta venda não permite alteração.");
      return;
    }

    if (!produtoSelecionado) {
      toast.error("Selecione um produto.");
      return;
    }

    if (qtdNum <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }

    if (precoNum <= 0) {
      toast.error("Informe um preço válido.");
      return;
    }

    setSavingItem(true);

    try {
      await adicionarItemVendaDireta(vendaIdParam, {
        produto_id: produtoSelecionado.id,
        qtd: String(qtdNum),
        preco_unitario: String(precoNum),
        valor_desconto: String(descontoNum),
      });

      toast.success("Item adicionado.");

      setProdutoSelecionado(null);
      setQtd("1");
      setPrecoUnitario("");
      setValorDesconto("");
      setProdutosEncontrados([]);
      setSearchProduto("");
      setModalItemOpen(false);

      await carregarVenda();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao adicionar item.");
    } finally {
      setSavingItem(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title={`Venda Direta #${vendaIdParam || "-"}`}
        subtitle="Edite a venda em rascunho, adicione produtos e finalize a operação."
        action={
          <button
            type="button"
            style={buttonStyles.secondary}
            onClick={() => navigate("/vendas-diretas")}
            title="Voltar"
          >
            <FiX size={16} />
          </button>
        }
      />

      {empresaAtiva && (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 16,
            border: "1px solid #dbeafe",
            background: "#eff6ff",
            padding: "12px 14px",
            fontSize: 13,
            color: "#1d4ed8",
            fontWeight: 800,
          }}
        >
          Empresa ativa:{" "}
          {empresaAtiva.nome_fantasia || empresaAtiva.razao_social}
        </div>
      )}

      <div style={summaryGridStyle}>
        <SummaryCard label="Venda" value={`#${vendaIdParam || "-"}`} />
        <SummaryCard label="Status" value={venda?.status || "-"} tone="info" />
        <SummaryCard label="Itens" value={totais.totalItens} />
        <SummaryCard
          label="Total"
          value={formatMoneyBR(totais.totalVenda)}
          tone="success"
        />
      </div>

      <div style={mainGridStyle}>
        <div style={leftColumnStyle}>
          <DataCard title="" subtitle="">
            <div style={headerInlineStyle}>
              <div>
                <h3 style={headerTitleStyle}>Dados da venda</h3>
                <p style={headerSubtitleStyle}>
                  Dados gerais da venda direta selecionada.
                </p>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 900,
                  ...statusStyle(venda?.status),
                }}
              >
                {venda?.status || "-"}
              </div>
            </div>

            {loading ? (
              <div style={emptyStyle}>Carregando venda...</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
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

                <InfoItem
                  label="Observação"
                  value={venda?.observacao || "-"}
                />
              </div>
            )}
          </DataCard>

          {!vendaBloqueada && (
            <DataCard
              title="Adicionar produto"
              subtitle="Pesquise e adicione produtos enquanto a venda estiver em rascunho."
            >
              <button
                type="button"
                style={{
                  ...buttonStyles.primary,
                  height: 44,
                  justifyContent: "center",
                }}
                disabled={loading}
                onClick={() => setModalProdutoOpen(true)}
                title="Pesquisar produto"
              >
                <FiSearch size={16} />
              </button>
            </DataCard>
          )}
        </div>

        <div style={cartFixedWrapperStyle}>
          <DataCard
            title="Carrinho da venda"
            subtitle="Produtos adicionados à venda direta."
          >
            <div style={cartContentStyle}>
              <div style={cartTableWrapperStyle}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      {["Produto", "Qtd", "Preço", "Desc.", "Total", "Ações"].map(
                        (title) => (
                          <th
                            key={title}
                            style={{
                              padding: "12px 10px",
                              textAlign: title === "Ações" ? "right" : "left",
                              fontSize: 11,
                              fontWeight: 900,
                              textTransform: "uppercase",
                              color: "#64748b",
                              whiteSpace: "nowrap",
                              position: "sticky",
                              top: 0,
                              background: "#f8fafc",
                              zIndex: 1,
                            }}
                          >
                            {title}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} style={emptyStyle}>
                          Carregando itens...
                        </td>
                      </tr>
                    ) : itens.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={emptyStyle}>
                          Nenhum produto no carrinho.
                        </td>
                      </tr>
                    ) : (
                      itens.map((item) => {
                        const produto = item.produto;
                        const controlaLote = !!produto?.controla_lote;

                        return (
                          <tr
                            key={item.id}
                            style={{ borderTop: "1px solid #e5e7eb" }}
                          >
                            <td style={tdStyle}>
                              <strong>
                                {produto?.nome || `Produto #${item.produto_id}`}
                              </strong>

                              {controlaLote && !vendaBloqueada && (
                                <div style={{ marginTop: 8 }}>
                                  <select
                                    value={lotesSelecionados[item.id] || ""}
                                    disabled={vendaBloqueada}
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
                                        {lote.quantidade ??
                                          lote.qtd_disponivel ??
                                          0}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </td>

                            <td style={tdStyle}>{item.qtd}</td>

                            <td style={tdStyle}>
                              {formatMoneyBR(item.preco_unitario)}
                            </td>

                            <td style={tdStyle}>
                              {formatMoneyBR(item.valor_desconto)}
                            </td>

                            <td style={tdStyle}>
                              <strong>{formatMoneyBR(item.valor_total)}</strong>
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

              <div style={cartTotalBoxStyle}>
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

                <div style={grandTotalStyle}>
                  <span>Total</span>
                  <span>{formatMoneyBR(totais.totalVenda)}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 16,
                  }}
                >
                  <button
                    type="button"
                    style={{
                      ...buttonStyles.secondary,
                      flex: 1,
                      height: 46,
                      justifyContent: "center",
                    }}
                    onClick={() => navigate("/vendadireta/novo")}
                    title="Nova venda"
                  >
                    <FiFilePlus size={18} />
                  </button>

                  {!vendaBloqueada && (
                    <>
                      <button
                        type="button"
                        style={{
                          ...buttonStyles.secondary,
                          flex: 1,
                          height: 46,
                          justifyContent: "center",
                          color: "#dc2626",
                        }}
                        disabled={finishing}
                        onClick={cancelarVenda}
                        title="Cancelar venda"
                      >
                        <FiX size={18} />
                      </button>

                      <button
                        type="button"
                        style={{
                          ...buttonStyles.primary,
                          flex: 1,
                          height: 46,
                          justifyContent: "center",
                        }}
                        disabled={!itens.length || finishing}
                        onClick={finalizarVenda}
                        title="Finalizar venda"
                      >
                        <FiCheckCircle size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </DataCard>
        </div>
      </div>

      {modalProdutoOpen && (
        <SearchModal
          title="Pesquisar produto"
          subtitle="Busque por nome, descrição, SKU ou código de barras."
          search={searchProduto}
          setSearch={setSearchProduto}
          onClose={() => setModalProdutoOpen(false)}
          count={produtosEncontrados.length}
        >
          <button
            type="button"
            style={{
              ...buttonStyles.primary,
              width: "100%",
              justifyContent: "center",
              marginBottom: 8,
            }}
            disabled={searchingProduto || !searchProduto.trim()}
            onClick={pesquisarProdutos}
          >
            <FiSearch size={15} />
          </button>

          {produtosEncontrados.map((produto) => (
            <button
              key={produto.id}
              type="button"
              style={modalItemStyle}
              onClick={() => {
                selecionarProduto(produto);
                setModalProdutoOpen(false);
                setModalItemOpen(true);
              }}
            >
              <strong>{produto.nome}</strong>

              <span style={{ color: "#64748b", fontSize: 12 }}>
                Código: {produto.cod_barra || "-"} • Estoque livre:{" "}
                {produto.qtd_livre ?? 0} • Preço:{" "}
                {formatMoneyBR(produto.preco_venda)}
              </span>
            </button>
          ))}
        </SearchModal>
      )}

      {modalItemOpen && produtoSelecionado && (
        <div style={overlayStyle}>
          <div style={itemModalStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={modalTitleStyle}>Adicionar produto</div>
                <div style={modalSubtitleStyle}>{produtoSelecionado.nome}</div>
              </div>

              <button
                type="button"
                onClick={() => setModalItemOpen(false)}
                style={closeButtonStyle}
              >
                <FiX size={16} />
              </button>
            </div>

            <div style={{ padding: 18 }}>
              <div style={productInputsGridStyle}>
                <div>
                  <label style={labelStyle}>Qtd</label>
                  <input
                    ref={qtdRef}
                    value={qtd}
                    onChange={(e) => setQtd(e.target.value)}
                    inputMode="decimal"
                    style={{ ...fieldStyle, textAlign: "right" }}
                    autoFocus
                  />
                </div>

                <div>
                  <label style={labelStyle}>Preço</label>
                  <input
                    value={precoUnitario}
                    onChange={(e) => setPrecoUnitario(e.target.value)}
                    inputMode="decimal"
                    style={{ ...fieldStyle, textAlign: "right" }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Desconto</label>
                  <input
                    value={valorDesconto}
                    onChange={(e) => setValorDesconto(e.target.value)}
                    inputMode="decimal"
                    style={{ ...fieldStyle, textAlign: "right" }}
                  />
                </div>
              </div>

              <div style={subtotalBoxStyle}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 800 }}>
                  Subtotal
                </span>

                <strong style={{ fontSize: 22, color: "#0f172a" }}>
                  {formatMoneyBR(subtotalItem)}
                </strong>
              </div>

              <div style={itemModalActionsStyle}>
                <button
                  type="button"
                  style={buttonStyles.secondary}
                  onClick={() => setModalItemOpen(false)}
                  title="Cancelar"
                >
                  <FiX size={16} />
                </button>

                <button
                  type="button"
                  style={buttonStyles.primary}
                  disabled={savingItem}
                  onClick={adicionarItem}
                  title="Adicionar ao carrinho"
                >
                  <FiPlus size={16} />
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

function SearchModal({
  title,
  subtitle,
  search,
  setSearch,
  onClose,
  children,
  count,
}: {
  title: string;
  subtitle?: string;
  search: string;
  setSearch: (value: string) => void;
  onClose: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <div>
            <div style={modalTitleStyle}>{title}</div>
            <div style={modalSubtitleStyle}>
              {subtitle || "Pesquise e selecione uma opção para continuar."}
            </div>
          </div>

          <button type="button" onClick={onClose} style={closeButtonStyle}>
            <FiX size={16} />
          </button>
        </div>

        <div style={modalBodyStyle}>
          <div style={searchBoxStyle}>
            <FiSearch size={16} color="#64748b" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Digite para pesquisar..."
              autoFocus
              style={searchInputStyle}
            />
          </div>

          <div style={modalMetaStyle}>
            <span>{count ?? 0} registro(s) encontrado(s)</span>
            <span>Selecione uma opção abaixo</span>
          </div>

          <div style={modalListStyle}>{children}</div>
        </div>
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

const mainGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.25fr 1.75fr",
  gap: 16,
  alignItems: "start",
};

const leftColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const cartFixedWrapperStyle: React.CSSProperties = {
  minHeight: 0,
};

const cartContentStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const cartTableWrapperStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  overflowY: "auto",
  overflowX: "auto",
  height: 360,
  minHeight: 360,
};

const cartTotalBoxStyle: React.CSSProperties = {
  marginTop: 16,
  borderRadius: 18,
  background: "#0f172a",
  padding: 18,
  color: "#fff",
  flexShrink: 0,
};

const totalLineStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 13,
  color: "#cbd5e1",
  marginBottom: 8,
};

const grandTotalStyle: React.CSSProperties = {
  marginTop: 14,
  paddingTop: 14,
  borderTop: "1px solid rgba(255,255,255,0.16)",
  display: "flex",
  justifyContent: "space-between",
  fontSize: 22,
  fontWeight: 900,
};

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

const tdStyle: React.CSSProperties = {
  padding: "12px 10px",
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
  width: 640,
  maxWidth: "95vw",
  height: 620,
  maxHeight: "90vh",
  background: "#fff",
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 28px 80px rgba(15,23,42,0.35)",
  display: "flex",
  flexDirection: "column",
};

const itemModalStyle: React.CSSProperties = {
  width: 520,
  maxWidth: "95vw",
  background: "#fff",
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 28px 80px rgba(15,23,42,0.35)",
};

const modalHeaderStyle: React.CSSProperties = {
  padding: "20px 22px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
  flexShrink: 0,
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "#0f172a",
};

const modalSubtitleStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 13,
  color: "#64748b",
};

const modalBodyStyle: React.CSSProperties = {
  padding: 18,
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
};

const searchBoxStyle: React.CSSProperties = {
  height: 46,
  border: "1px solid #dbe3ee",
  borderRadius: 16,
  padding: "0 14px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "#f8fafc",
  flexShrink: 0,
};

const searchInputStyle: React.CSSProperties = {
  border: "none",
  outline: "none",
  background: "transparent",
  width: "100%",
  height: "100%",
  fontSize: 14,
  color: "#0f172a",
};

const modalMetaStyle: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 12,
  color: "#64748b",
  flexShrink: 0,
};

const modalListStyle: React.CSSProperties = {
  marginTop: 14,
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  paddingRight: 4,
};

const closeButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#475569",
};

const modalItemStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  borderRadius: 16,
  padding: "13px 14px",
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: 5,
};

const productInputsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 10,
};

const subtotalBoxStyle: React.CSSProperties = {
  marginTop: 18,
  borderRadius: 16,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  padding: 14,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const itemModalActionsStyle: React.CSSProperties = {
  marginTop: 18,
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const headerInlineStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 18,
};

const headerTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 900,
  color: "#0f172a",
};

const headerSubtitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 13,
  color: "#64748b",
};