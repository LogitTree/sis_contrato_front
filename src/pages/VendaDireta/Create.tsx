import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCreditCard,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
  FiUser,
  FiCheckCircle,
  FiFilePlus,
} from "react-icons/fi";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  maskCpfCnpj,
  maskTelefone,
  onlyDigits,
} from "../../utils/masks";

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

export default function VendaDiretaCreate() {
  const navigate = useNavigate();

  const {
    codBarraRef,
    qtdRef,
    empresaAtiva,

    creatingVenda,
    searchingProduto,
    savingItem,
    finishing,
    removingItemId,

    venda,
    vendaId,
    itens,

    clienteId,
    setClienteId,
    formaPagamentoId,
    setFormaPagamentoId,
    clientesOptions,
    formasPagamentoOptions,
    observacao,
    setObservacao,

    codBarra,
    setCodBarra,
    searchProduto,
    setSearchProduto,
    produtosEncontrados,
    produtoSelecionado,
    selecionarProduto,

    qtd,
    setQtd,
    precoUnitario,
    setPrecoUnitario,
    valorDesconto,
    setValorDesconto,

    subtotalItem,
    totais,

    lotesSelecionados,
    selecionarLote,

    canStartVenda,
    canAddItem,

    iniciarVenda,
    buscarPorCodigoBarras,
    pesquisarProdutos,
    adicionarItem,
    removerItem,
    finalizarVenda,
    cancelarVenda,
    criarClienteRapido,
    novaVenda

  } = useVendaDiretaCreate();

  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [modalFormaOpen, setModalFormaOpen] = useState(false);
  const [modalProdutoOpen, setModalProdutoOpen] = useState(false);
  const [modalItemOpen, setModalItemOpen] = useState(false);

  const [searchCliente, setSearchCliente] = useState("");
  const [modalNovoClienteOpen, setModalNovoClienteOpen] = useState(false);
  const [searchForma, setSearchForma] = useState("");

  const vendaBloqueada =
    String(venda?.status || "RASCUNHO").toUpperCase() !== "RASCUNHO";

  const clienteSelecionado = clientesOptions.find(
    (cliente: any) => String(cliente.id) === String(clienteId)
  );

  const formaSelecionada = formasPagamentoOptions.find(
    (forma: any) => String(forma.id) === String(formaPagamentoId)
  );

  const clientesFiltrados = useMemo(() => {
    const termo = searchCliente.toLowerCase().trim();
    if (!termo) return clientesOptions;

    return clientesOptions.filter((cliente: any) =>
      String(
        cliente.nome ||
        cliente.razao_social ||
        cliente.nome_fantasia ||
        cliente.cnpj ||
        ""
      )
        .toLowerCase()
        .includes(termo)
    );
  }, [clientesOptions, searchCliente]);

  const formasFiltradas = useMemo(() => {
    const termo = searchForma.toLowerCase().trim();
    if (!termo) return formasPagamentoOptions;

    return formasPagamentoOptions.filter((forma: any) =>
      String(forma.descricao || forma.nome || "")
        .toLowerCase()
        .includes(termo)
    );
  }, [formasPagamentoOptions, searchForma]);

  async function handleAdicionarItemModal() {
    await adicionarItem();
    setModalItemOpen(false);
  }

  async function handleBuscarCodigoBarras() {
    await buscarPorCodigoBarras();
    setTimeout(() => {
      setModalItemOpen(true);
    }, 120);
  }

  return (
    <PageShell>
      <PageHeader
        title="Venda Direta / PDV"
        subtitle="Venda rápida sem vínculo com contrato, com busca por código de barras, produto e baixa direta no estoque."
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
          Empresa ativa: {empresaAtiva.nome_fantasia || empresaAtiva.razao_social}
        </div>
      )}

      <div style={summaryGridStyle}>
        <SummaryCard label="Venda" value={vendaId ? `#${vendaId}` : "Nova"} />

        <SummaryCard
          label="Status"
          value={venda?.status || "RASCUNHO"}
          tone="info"
        />

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
                  {vendaId
                    ? "Venda iniciada. Agora adicione os produtos."
                    : "Informe cliente, forma de pagamento e inicie a venda."}
                </p>
              </div>

              {!vendaId ? (
                <button
                  type="button"
                  style={buttonStyles.primary}
                  disabled={!canStartVenda}
                  onClick={iniciarVenda}
                >
                  {creatingVenda ? "Iniciando..." : "Iniciar"}
                </button>
              ) : (
                <button
                  type="button"
                  style={{
                    ...buttonStyles.secondary,
                    height: 42,
                    color: "#dc2626",
                    borderColor: "#fecaca",
                    background: "#fff5f5",
                  }}
                  disabled={finishing || vendaBloqueada}
                  onClick={cancelarVenda}
                >
                  <FiX size={15} /> Cancelar
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Cliente / Órgão</label>

                <button
                  type="button"
                  disabled={!!vendaId || !empresaAtiva}
                  onClick={() => setModalClienteOpen(true)}
                  style={{
                    ...fieldStyle,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: vendaId || !empresaAtiva ? "not-allowed" : "pointer",
                    background: vendaId || !empresaAtiva ? "#f8fafc" : "#fff",
                    textAlign: "left",
                  }}
                >
                  <span style={selectedTextStyle(!!clienteSelecionado)}>
                    {clienteSelecionado
                      ? clienteSelecionado.nome ||
                      clienteSelecionado.razao_social ||
                      clienteSelecionado.nome_fantasia ||
                      `Cliente #${clienteSelecionado.id}`
                      : "Selecionar cliente"}
                  </span>

                  <FiUser size={15} color="#64748b" />
                </button>
              </div>

              <div>
                <label style={labelStyle}>Forma de pagamento</label>

                <button
                  type="button"
                  disabled={!!vendaId || !empresaAtiva}
                  onClick={() => setModalFormaOpen(true)}
                  style={{
                    ...fieldStyle,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: vendaId || !empresaAtiva ? "not-allowed" : "pointer",
                    background: vendaId || !empresaAtiva ? "#f8fafc" : "#fff",
                    textAlign: "left",
                  }}
                >
                  <span style={selectedTextStyle(!!formaSelecionada)}>
                    {formaSelecionada
                      ? formaSelecionada.descricao ||
                      formaSelecionada.nome ||
                      `Forma #${formaSelecionada.id}`
                      : "Selecionar forma de pagamento"}
                  </span>

                  <FiCreditCard size={15} color="#64748b" />
                </button>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={labelStyle}>Observação</label>

              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                disabled={!!vendaId || !empresaAtiva}
                placeholder="Observações da venda"
                style={{
                  ...fieldStyle,
                  height: 139,
                  resize: "vertical",
                  paddingTop: 9,
                }}
              />
            </div>
          </DataCard>

          <DataCard
            title="Adicionar produto"
            subtitle="Leia o código de barras ou pesquise o produto em uma lista."
          >
            <div>
              <label style={labelStyle}>Código de barras</label>

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  ref={codBarraRef}
                  value={codBarra}
                  disabled={!empresaAtiva || !vendaId || vendaBloqueada}
                  onChange={(e) => setCodBarra(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleBuscarCodigoBarras();
                    }
                  }}
                  placeholder="Leia ou digite o código"
                  style={fieldStyle}
                />

                <button
                  type="button"
                  style={{
                    ...buttonStyles.secondary,
                    height: 40,
                    whiteSpace: "nowrap",
                  }}
                  disabled={
                    !empresaAtiva || !vendaId || vendaBloqueada || searchingProduto
                  }
                  onClick={handleBuscarCodigoBarras}
                >
                  <FiSearch size={15} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Produto</label>

              <button
                type="button"
                disabled={!empresaAtiva || !vendaId || vendaBloqueada}
                onClick={() => setModalProdutoOpen(true)}
                style={{
                  ...fieldStyle,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor:
                    !empresaAtiva || !vendaId || vendaBloqueada
                      ? "not-allowed"
                      : "pointer",
                  background:
                    !empresaAtiva || !vendaId || vendaBloqueada
                      ? "#f8fafc"
                      : "#fff",
                  textAlign: "left",
                }}
              >
                <span style={selectedTextStyle(!!produtoSelecionado)}>
                  {produtoSelecionado?.nome || "Pesquisar produto"}
                </span>

                <FiSearch size={16} color="#64748b" />
              </button>
            </div>
          </DataCard>
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
                    {itens.length === 0 ? (
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

                              {controlaLote && (
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
                                        {lote.lote} • Val:{" "}
                                        {lote.validade || "Sem validade"} • Qtd:{" "}
                                        {lote.quantidade}
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
                              <button
                                type="button"
                                title="Remover item"
                                disabled={
                                  removingItemId === item.id || vendaBloqueada
                                }
                                onClick={() => removerItem(item.id)}
                                style={iconButtonDanger}
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
                  {vendaId && (
                    <button
                      type="button"
                      style={{
                        ...buttonStyles.secondary,
                        flex: 1,
                        height: 46,
                        justifyContent: "center",
                      }}
                      onClick={novaVenda}
                      title="Nova venda"
                    >
                      <FiFilePlus size={18} />
                    </button>
                  )}

                  <button
                    type="button"
                    style={{
                      ...buttonStyles.primary,
                      flex: 1,
                      height: 46,
                      justifyContent: "center",
                    }}
                    disabled={
                      !empresaAtiva || !itens.length || finishing || vendaBloqueada
                    }
                    onClick={finalizarVenda}
                    title="Finalizar venda"
                  >
                    <FiCheckCircle size={18} />
                  </button>
                </div>
              </div>
            </div>
          </DataCard>
        </div>
      </div>

      {modalClienteOpen && (
        <SearchModal
          title="Selecionar cliente"
          subtitle="Escolha o cliente ou órgão vinculado à venda."
          search={searchCliente}
          setSearch={setSearchCliente}
          onClose={() => setModalClienteOpen(false)}
          count={clientesFiltrados.length}
        >
          <button
            type="button"
            style={{
              ...buttonStyles.primary,
              width: "100%",
              justifyContent: "center",
              marginBottom: 8,
            }}
            onClick={() => {
              setModalClienteOpen(false);
              setModalNovoClienteOpen(true);
            }}
          >
            <FiPlus size={15} /> Novo cliente
          </button>
          {clientesFiltrados.map((cliente: any) => (
            <button
              key={cliente.id}
              type="button"
              style={modalItemStyle}
              onClick={() => {
                setClienteId(String(cliente.id));
                setModalClienteOpen(false);
                setSearchCliente("");
              }}
            >
              <strong>
                {cliente.nome ||
                  cliente.razao_social ||
                  cliente.nome_fantasia ||
                  `Cliente #${cliente.id}`}
              </strong>

              <span style={{ color: "#64748b", fontSize: 12 }}>
                ID: {cliente.id}
              </span>
            </button>
          ))}
        </SearchModal>
      )}

      {modalNovoClienteOpen && (
        <NovoClienteModal
          onClose={() => setModalNovoClienteOpen(false)}
          onSave={async (payload) => {
            const cliente = await criarClienteRapido(payload);

            if (cliente?.id) {
              setClienteId(String(cliente.id));
            }

            setModalNovoClienteOpen(false);
            setModalClienteOpen(false);
            setSearchCliente("");
          }}
        />
      )}

      {modalFormaOpen && (
        <SearchModal
          title="Selecionar forma de pagamento"
          subtitle="Escolha a forma de pagamento utilizada na venda."
          search={searchForma}
          setSearch={setSearchForma}
          onClose={() => setModalFormaOpen(false)}
          count={formasFiltradas.length}
        >
          {formasFiltradas.map((forma: any) => (
            <button
              key={forma.id}
              type="button"
              style={modalItemStyle}
              onClick={() => {
                setFormaPagamentoId(String(forma.id));
                setModalFormaOpen(false);
                setSearchForma("");
              }}
            >
              <strong>
                {forma.descricao || forma.nome || `Forma #${forma.id}`}
              </strong>

              <span style={{ color: "#64748b", fontSize: 12 }}>
                ID: {forma.id}
              </span>
            </button>
          ))}
        </SearchModal>
      )}

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
            <FiSearch size={15} />{" "}
            {searchingProduto ? "Pesquisando..." : "Pesquisar"}
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
                    disabled={vendaBloqueada}
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
                    disabled={vendaBloqueada}
                    onChange={(e) => setPrecoUnitario(e.target.value)}
                    inputMode="decimal"
                    style={{ ...fieldStyle, textAlign: "right" }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Desconto</label>
                  <input
                    value={valorDesconto}
                    disabled={vendaBloqueada}
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
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  style={buttonStyles.primary}
                  disabled={!canAddItem || savingItem}
                  onClick={handleAdicionarItemModal}
                >
                  <FiPlus size={15} />{" "}
                  {savingItem ? "Adicionando..." : "Adicionar ao carrinho"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
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

function NovoClienteModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [tipo, setTipo] = useState("PRIVADO");
  const [esfera, setEsfera] = useState("MUNICIPAL");
  const [telefone, setTelefone] = useState("");
  const [emailOficial, setEmailOficial] = useState("");

  async function salvar() {
    if (!nome.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }

    if (!cnpj.trim()) {
      alert("Informe o CNPJ.");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        nome: nome.trim(),
        cnpj: onlyDigits(cnpj),
        tipo,
        esfera,
        telefone: onlyDigits(telefone) || null,
        email_oficial: emailOficial.trim() || "inserir@email.com",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={itemModalStyle}>
        <div style={modalHeaderStyle}>
          <div>
            <div style={modalTitleStyle}>Novo cliente</div>
            <div style={modalSubtitleStyle}>
              Cadastre rapidamente um cliente para a venda.
            </div>
          </div>

          <button type="button" onClick={onClose} style={closeButtonStyle}>
            <FiX size={16} />
          </button>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={labelStyle}>Nome *</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={fieldStyle}
                placeholder="Nome ou razão social"
              />
            </div>

            <div>
              <label style={labelStyle}>CPF/CNPJ *</label>
              <input
                value={cnpj}
                onChange={(e) => setCnpj(maskCpfCnpj(e.target.value))}
                style={fieldStyle}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <label style={labelStyle}>Tipo *</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  style={fieldStyle}
                >
                  <option value="PRIVADO">Privado</option>
                  <option value="PUBLICO">Público</option>
                  <option value="ONG">ONG</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Esfera *</label>
                <select
                  value={esfera}
                  onChange={(e) => setEsfera(e.target.value)}
                  style={fieldStyle}
                >
                  <option value="MUNICIPAL">Municipal</option>
                  <option value="ESTADUAL">Estadual</option>
                  <option value="FEDERAL">Federal</option>
                  <option value="PRIVADA">Privada</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Telefone</label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(maskTelefone(e.target.value))}
                style={fieldStyle}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label style={labelStyle}>E-mail</label>
              <input
                value={emailOficial}
                onChange={(e) => setEmailOficial(e.target.value)}
                style={fieldStyle}
                placeholder="email@cliente.com"
              />
            </div>
          </div>

          <div style={itemModalActionsStyle}>
            <button type="button" style={buttonStyles.secondary} onClick={onClose}>
              Cancelar
            </button>

            <button
              type="button"
              style={buttonStyles.primary}
              disabled={saving}
              onClick={salvar}
            >
              <FiPlus size={15} /> {saving ? "Salvando..." : "Salvar cliente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function selectedTextStyle(selected: boolean): React.CSSProperties {
  return {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: selected ? 800 : 500,
    color: selected ? "#0f172a" : "#94a3b8",
  };
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