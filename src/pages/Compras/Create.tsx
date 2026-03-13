// src/pages/Compras/Create.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { tableStyles } from "../../styles/table";
import { filterStyles } from "../../styles/filters";

import { FiTrash2 } from "react-icons/fi";

type FornecedorOption = { id: number; nome: string };
type ProdutoOption = { id: number; nome: string };

type CompraItem = {
  id: number;
  compra_id: number;
  produto_id: number;
  qtd: string;
  preco_unitario: string;
  recebido_qtd?: string;
  previsao_entrega?: string | null;

  produto?: { nome?: string };
};

const LS_DRAFT_KEY = "compra_create_draft_v1";

/** Converte strings BR/US para número */
function toNumberAny(v: any): number {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim();
  if (!s) return 0;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    const normalized = s.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  if (hasComma) {
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function formatMoneyBR(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatQtyBR(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

/** permite digitar decimal com vírgula/ponto, mas guarda normalizado */
function normalizeDecimalString(v: string) {
  const clean = (v || "").replace(/[^\d.,]/g, "");
  const hasComma = clean.includes(",");
  const hasDot = clean.includes(".");
  if (hasComma && hasDot) return clean.replace(/\./g, "").replace(",", ".");
  if (hasComma) return clean.replace(",", ".");
  return clean;
}

export default function ComprasCreate() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  // ===== combos =====
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([]);
  const [produtos, setProdutos] = useState<ProdutoOption[]>([]);
  const produtosMap = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);

  // ===== header form =====
  const [fornecedorId, setFornecedorId] = useState("");
  const [dataPedido, setDataPedido] = useState(() => new Date().toISOString().slice(0, 10));
  const [observacao, setObservacao] = useState("");

  // ✅ novos campos (backend)
  const [numeroNF, setNumeroNF] = useState("");
  const [serieNF, setSerieNF] = useState("");
  const [dataEmissaoNF, setDataEmissaoNF] = useState("");
  const [chaveNfe, setChaveNfe] = useState("");

  const [valorFrete, setValorFrete] = useState("");
  const [valorDesconto, setValorDesconto] = useState("");

  const [formaPagamento, setFormaPagamento] = useState("");
  const [condicaoPagamento, setCondicaoPagamento] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");

  // ===== compra criada =====
  const [compraId, setCompraId] = useState<number | null>(null);
  const [itens, setItens] = useState<CompraItem[]>([]);

  // ===== item form =====
  const [produtoId, setProdutoId] = useState("");
  const [qtd, setQtd] = useState("");
  const [precoUnit, setPrecoUnit] = useState("");
  const [previsaoEntrega, setPrevisaoEntrega] = useState("");

  const qtdRef = useRef<HTMLInputElement | null>(null);

  // antes: minHeight: 42, marginTop: 8, lineClamp: 3
  const helperLineStyle: React.CSSProperties = {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    minHeight: 0,        // 👈 bem menor
    lineHeight: "16px",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as any,
    WebkitLineClamp: 1 as any, // 👈 2 linhas já resolve
  };

  const headerStackStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 0,            // 👈 antes 16
    width: "100%",
  };

  const headerRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 0,            // 👈 antes 16
    width: "100%",
    alignItems: "flex-end",
    flexWrap: "wrap",
  };

  const sectionTitleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    marginBottom: 10,
    borderBottom: "1px solid #eef2f7",
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  };

  const sectionHintStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 600,
  };

  async function loadCombos() {
    try {
      const [resForn, resProd] = await Promise.all([
        api.get("/fornecedores", { params: { page: 1, limit: 1000 } }),
        api.get("/produtos", { params: { page: 1, limit: 2000 } }),
      ]);

      const fornList = resForn.data?.data ?? resForn.data?.rows ?? resForn.data?.items ?? [];
      const prodList = resProd.data?.data ?? resProd.data?.rows ?? resProd.data?.items ?? [];

      setFornecedores(
        (Array.isArray(fornList) ? fornList : []).map((f: any) => ({
          id: Number(f.id),
          nome: f.nome ?? f.razao_social ?? f.nome_fantasia ?? `Fornecedor #${f.id}`,
        }))
      );

      setProdutos(
        (Array.isArray(prodList) ? prodList : []).map((p: any) => ({
          id: Number(p.id),
          nome: p.nome ?? p.descricao ?? `Produto #${p.id}`,
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar fornecedores/produtos");
      setFornecedores([]);
      setProdutos([]);
    }
  }

  async function loadCompra(id: number) {
    try {
      const res = await api.get(`/compras/${id}`);
      const compra = res.data?.data ?? res.data ?? {};
      const lista =
        compra?.itens ??
        compra?.CompraItems ??
        compra?.compra_itens ??
        compra?.items ??
        res.data?.itens ??
        [];
      setItens(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar itens da compra");
    }
  }

  // restore draft (se ainda não salvou)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft) return;
      if (!compraId) {
        if (draft.fornecedorId) setFornecedorId(String(draft.fornecedorId));
        if (draft.dataPedido) setDataPedido(String(draft.dataPedido));
        if (draft.observacao !== undefined) setObservacao(String(draft.observacao ?? ""));

        // novos campos
        if (draft.numeroNF !== undefined) setNumeroNF(String(draft.numeroNF ?? ""));
        if (draft.serieNF !== undefined) setSerieNF(String(draft.serieNF ?? ""));
        if (draft.dataEmissaoNF !== undefined) setDataEmissaoNF(String(draft.dataEmissaoNF ?? ""));
        if (draft.chaveNfe !== undefined) setChaveNfe(String(draft.chaveNfe ?? ""));
        if (draft.valorFrete !== undefined) setValorFrete(String(draft.valorFrete ?? ""));
        if (draft.valorDesconto !== undefined) setValorDesconto(String(draft.valorDesconto ?? ""));
        if (draft.formaPagamento !== undefined) setFormaPagamento(String(draft.formaPagamento ?? ""));
        if (draft.condicaoPagamento !== undefined) setCondicaoPagamento(String(draft.condicaoPagamento ?? ""));
        if (draft.dataVencimento !== undefined) setDataVencimento(String(draft.dataVencimento ?? ""));
      }
    } catch { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // salva draft enquanto não criou
  useEffect(() => {
    if (compraId) return;
    try {
      localStorage.setItem(
        LS_DRAFT_KEY,
        JSON.stringify({
          fornecedorId,
          dataPedido,
          observacao,
          numeroNF,
          serieNF,
          dataEmissaoNF,
          chaveNfe,
          valorFrete,
          valorDesconto,
          formaPagamento,
          condicaoPagamento,
          dataVencimento,
        })
      );
    } catch { }
  }, [
    fornecedorId,
    dataPedido,
    observacao,
    numeroNF,
    serieNF,
    dataEmissaoNF,
    chaveNfe,
    valorFrete,
    valorDesconto,
    formaPagamento,
    condicaoPagamento,
    dataVencimento,
    compraId,
  ]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadCombos();
      setLoading(false);
    })();
  }, []);

  const fornecedorSelecionado = useMemo(() => {
    const id = Number(fornecedorId);
    if (!id) return null;
    return fornecedores.find((f) => f.id === id) ?? null;
  }, [fornecedorId, fornecedores]);

  const produtoSelecionado = useMemo(() => {
    const id = Number(produtoId);
    if (!id) return null;
    return produtosMap.get(id) ?? null;
  }, [produtoId, produtosMap]);

  // foca qtd ao escolher produto
  useEffect(() => {
    if (!produtoId) return;
    setTimeout(() => qtdRef.current?.focus(), 60);
  }, [produtoId]);

  // totais
  const totais = useMemo(() => {
    const totalItens = itens.length;
    const totalQtd = itens.reduce((acc, it) => acc + toNumberAny(it.qtd), 0);
    const totalValor = itens.reduce((acc, it) => {
      const q = toNumberAny(it.qtd);
      const p = toNumberAny(it.preco_unitario);
      return acc + q * p;
    }, 0);

    const frete = toNumberAny(valorFrete);
    const desconto = toNumberAny(valorDesconto);
    const totalFinal = totalValor + frete - desconto;

    return { totalItens, totalQtd, totalValor, frete, desconto, totalFinal };
  }, [itens, valorFrete, valorDesconto]);

  async function handleSalvarCabecalho(e: React.FormEvent) {
    e.preventDefault();

    if (!dataPedido) return toast.error("Informe a data do pedido.");

    setSavingHeader(true);
    try {
      const payload = {
        fornecedor_id: fornecedorId ? Number(fornecedorId) : null,
        data_pedido: dataPedido,
        observacao: observacao?.trim() || null,

        // ✅ novos campos
        numero_nota_fiscal: numeroNF?.trim() || null,
        serie_nota_fiscal: serieNF?.trim() || null,
        data_emissao_nf: dataEmissaoNF || null,
        chave_nfe: chaveNfe?.trim() || null,

        valor_frete: String(toNumberAny(valorFrete)),
        valor_desconto: String(toNumberAny(valorDesconto)),

        forma_pagamento: formaPagamento?.trim() || null,
        condicao_pagamento: condicaoPagamento?.trim() || null,
        data_vencimento: dataVencimento || null,
      };

      const res = await api.post("/compras", payload);

      const id = res.data?.data?.id ?? res.data?.id ?? res.data?.data?.data?.id ?? null;
      if (!id) throw new Error("API não retornou o ID da compra");

      setCompraId(Number(id));

      try {
        localStorage.removeItem(LS_DRAFT_KEY);
      } catch { }

      toast.success("Compra criada. Agora adicione os itens.");
      await loadCompra(Number(id));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || err?.message || "Erro ao salvar cabeçalho");
    } finally {
      setSavingHeader(false);
    }
  }

  async function handleAddItem() {
    if (!compraId) return toast.error("Salve o cabeçalho da compra primeiro.");
    if (!produtoId) return toast.error("Selecione um produto.");

    const qtdN = toNumberAny(qtd);
    const precoN = toNumberAny(precoUnit);

    if (!qtdN || qtdN <= 0) return toast.error("Informe a quantidade.");
    if (precoN <= 0) return toast.error("Informe um preço unitário maior que zero.");

    setSavingItem(true);
    try {
      const payload = {
        produto_id: Number(produtoId),
        qtd: String(qtdN),
        preco_unitario: String(precoN),
        previsao_entrega: previsaoEntrega ? previsaoEntrega : null,
      };

      await api.post(`/compras/${compraId}/itens`, payload);

      toast.success("Item inserido");

      setProdutoId("");
      setQtd("");
      setPrecoUnit("");
      setPrevisaoEntrega("");

      await loadCompra(compraId);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao inserir item");
    } finally {
      setSavingItem(false);
    }
  }

  async function handleRemoveItem(itemId: number) {
    if (!compraId) return;
    if (!window.confirm("Remover este item?")) return;

    setRemovingItemId(itemId);
    try {
      await api.delete(`/compras/${compraId}/itens/${itemId}`);

      toast.success("Item removido");
      await loadCompra(compraId);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao remover item");
    } finally {
      setRemovingItemId(null);
    }
  }

  const disableHeader = loading || savingHeader || !!compraId;
  const disableItem = loading || savingItem || !compraId;

  const canInsert =
    !disableItem &&
    !!produtoId &&
    !!qtd &&
    toNumberAny(qtd) > 0 &&
    precoUnit !== "" &&
    toNumberAny(precoUnit) > 0;

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>{compraId ? `Compra #${compraId}` : "Nova Compra"}</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {compraId ? "Cabeçalho criado. Insira os itens abaixo." : "Crie o cabeçalho e depois adicione os itens da compra."}
          </div>
        </div>
      </div>

      {/* CABEÇALHO */}
      <div style={layoutStyles.card}>
        <div style={sectionTitleStyle}>
          <div style={sectionLabelStyle}>Cabeçalho da Compra</div>
          <div style={sectionHintStyle}>{compraId ? "Salvo" : "Preencha e salve para liberar os itens"}</div>
        </div>

        <form onSubmit={handleSalvarCabecalho}>
          <div style={layoutStyles.cardCompact}>
            <div style={headerStackStyle}>
              {/* linha 1 */}
              <div style={{ display: "flex", gap: 16, width: "100%", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 320 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Fornecedor</label>

                  <select
                    value={fornecedorId}
                    onChange={(e) => setFornecedorId(e.target.value)}
                    style={{ ...filterStyles.select, height: 38, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
                    disabled={disableHeader}
                  >
                    <option value="">Selecione...</option>
                    {fornecedores.map((f) => (
                      <option key={f.id} value={String(f.id)}>
                        {f.nome}
                      </option>
                    ))}
                  </select>

                  <div style={helperLineStyle}>
                    {fornecedorSelecionado ? (
                      <>
                        <span style={{ color: "#9ca3af" }}>Fornecedor selecionado: </span>
                        {fornecedorSelecionado.nome}
                      </>
                    ) : (
                      "\u00A0"
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Data do Pedido</label>

                  <input
                    type="date"
                    value={dataPedido}
                    onChange={(e) => setDataPedido(e.target.value)}
                    style={{ ...filterStyles.input, height: 38, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
                    disabled={disableHeader}
                  />

                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>
              </div>

              {/* linha 2 - NF */}
              <div style={headerRowStyle}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Número NF</label>
                  <input
                    value={numeroNF}
                    onChange={(e) => setNumeroNF(e.target.value)}
                    placeholder="Ex: 12345"
                    style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                    disabled={disableHeader}
                  />
                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 180 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Série NF</label>
                  <input
                    value={serieNF}
                    onChange={(e) => setSerieNF(e.target.value)}
                    placeholder="Ex: 1"
                    style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                    disabled={disableHeader}
                  />
                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Data Emissão NF</label>
                  <input
                    type="date"
                    value={dataEmissaoNF}
                    onChange={(e) => setDataEmissaoNF(e.target.value)}
                    style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                    disabled={disableHeader}
                  />
                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 320 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Chave NFe</label>
                  <input
                    value={chaveNfe}
                    onChange={(e) => setChaveNfe(e.target.value)}
                    placeholder="44 dígitos (opcional)"
                    style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                    disabled={disableHeader}
                  />
                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>
              </div>

              {/* linha 3 - financeiro/pagamento */}
              <div style={{ display: "flex", gap: 16, width: "100%", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 200 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Valor Frete</label>
                  <input
                    value={valorFrete}
                    onChange={(e) => setValorFrete(normalizeDecimalString(e.target.value))}
                    placeholder="0,00"
                    inputMode="decimal"
                    style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                    disabled={disableHeader}
                  />
                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 200 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Valor Desconto</label>
                  <input
                    value={valorDesconto}
                    onChange={(e) => setValorDesconto(normalizeDecimalString(e.target.value))}
                    placeholder="0,00"
                    inputMode="decimal"
                    style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                    disabled={disableHeader}
                  />
                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Forma Pagamento</label>
                  <input
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    placeholder="Ex: PIX / Cartão / Boleto"
                    style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                    disabled={disableHeader}
                  />
                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 260 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Condição Pagamento</label>
                  <input
                    value={condicaoPagamento}
                    onChange={(e) => setCondicaoPagamento(e.target.value)}
                    placeholder="Ex: 30/60/90"
                    style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                    disabled={disableHeader}
                  />
                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Data Vencimento</label>
                  <input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                    disabled={disableHeader}
                  />
                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>
              </div>

              {/* observação */}
              <div style={{ display: "flex", gap: 16, width: "100%" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Observação</label>

                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Opcional"
                    style={{ ...filterStyles.input, height: 120, padding: "10px 12px", boxSizing: "border-box", width: "100%", resize: "vertical" }}
                    disabled={disableHeader}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button type="button" style={buttonStyles.link} onClick={() => navigate(-1)} disabled={savingHeader}>
              Voltar
            </button>

            <button type="submit" style={buttonStyles.primary} disabled={disableHeader || !dataPedido}>
              {savingHeader ? "Salvando..." : compraId ? "Salvo" : "Salvar Cabeçalho"}
            </button>
          </div>
        </form>
      </div>

      <div style={{ height: 22 }} />

      {/* ITENS */}
      <div style={layoutStyles.card}>
        <div style={sectionTitleStyle}>
          <div style={sectionLabelStyle}>Itens da Compra</div>
          <div style={sectionHintStyle}>
            {compraId
              ? `Itens: ${totais.totalItens} · Qtd: ${formatQtyBR(totais.totalQtd)} · Itens: R$ ${formatMoneyBR(
                totais.totalValor
              )} · Frete: R$ ${formatMoneyBR(totais.frete)} · Desc: R$ ${formatMoneyBR(totais.desconto)} · Total: R$ ${formatMoneyBR(
                totais.totalFinal
              )}`
              : "Salve o cabeçalho para liberar"}
          </div>
        </div>

        {/* FORM ITEM */}
        <div style={layoutStyles.cardCompact}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end", width: "100%" }}>
              {/* produto */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Produto</label>

                <select
                  value={produtoId}
                  onChange={(e) => setProdutoId(e.target.value)}
                  style={{ ...filterStyles.select, height: 38, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
                  disabled={disableItem}
                >
                  <option value="">{compraId ? "Selecione..." : "Salve o cabeçalho primeiro"}</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.nome}
                    </option>
                  ))}
                </select>

                <div style={helperLineStyle}>
                  {produtoSelecionado ? (
                    <>
                      <span style={{ color: "#9ca3af" }}>Selecionado: </span>
                      {produtoSelecionado.nome}
                    </>
                  ) : (
                    "\u00A0"
                  )}
                </div>
              </div>

              {/* qtd */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Quantidade</label>
                <input
                  ref={qtdRef}
                  value={qtd}
                  onChange={(e) => setQtd(normalizeDecimalString(e.target.value))}
                  placeholder="0,000"
                  inputMode="decimal"
                  style={{ ...filterStyles.input, height: 38, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
                  disabled={disableItem}
                />
                <div style={helperLineStyle} aria-hidden>
                  {"\u00A0"}
                </div>
              </div>

              {/* preço */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 260 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Preço Unitário</label>
                <input
                  value={precoUnit}
                  onChange={(e) => setPrecoUnit(normalizeDecimalString(e.target.value))}
                  placeholder="0,00"
                  inputMode="decimal"
                  style={{ ...filterStyles.input, height: 38, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
                  disabled={disableItem}
                />
                <div style={helperLineStyle} aria-hidden>
                  {"\u00A0"}
                </div>
              </div>

              {/* previsão */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Prev. Entrega</label>
                <input
                  type="date"
                  value={previsaoEntrega}
                  onChange={(e) => setPrevisaoEntrega(e.target.value)}
                  style={{ ...filterStyles.input, height: 38, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
                  disabled={disableItem}
                />
                <div style={helperLineStyle} aria-hidden>
                  {"\u00A0"}
                </div>
              </div>

              {/* inserir */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 170 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>&nbsp;</label>
                <button
                  type="button"
                  style={{ ...buttonStyles.primary, height: 38, padding: "0 12px", width: "100%", whiteSpace: "nowrap", fontSize: 13 }}
                  onClick={handleAddItem}
                  disabled={!canInsert}
                >
                  {savingItem ? "Inserindo..." : "+ Inserir"}
                </button>
                <div style={helperLineStyle} aria-hidden>
                  {"\u00A0"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 12, fontSize: 13, color: "#64748b" }}>
          {compraId ? `Exibindo ${itens.length} item(ns)` : "Salve o cabeçalho para liberar os itens."}
        </div>

        {/* TABELA ITENS */}
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ ...tableStyles.table, tableLayout: "auto" }}>
            <thead>
              <tr>
                <th style={{ ...tableStyles.th, width: 70 }}>ID</th>
                <th style={{ ...tableStyles.th, width: "48%" }}>PRODUTO</th>
                <th style={{ ...tableStyles.th, width: 150, textAlign: "right" }}>QTD</th>
                <th style={{ ...tableStyles.th, width: 170, textAlign: "right" }}>PREÇO UNIT.</th>
                <th style={{ ...tableStyles.th, width: 150 }}>PREV. ENTREGA</th>
                <th style={{ ...tableStyles.th, width: 190, textAlign: "right" }}>SUBTOTAL</th>
                <th style={{ ...tableStyles.th, width: 90, textAlign: "center" }}>AÇÕES</th>
              </tr>
            </thead>

            <tbody>
              {!compraId && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Salve o cabeçalho para inserir itens.
                  </td>
                </tr>
              )}

              {compraId && itens.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Nenhum item inserido ainda.
                  </td>
                </tr>
              )}

              {compraId &&
                itens.map((it, idx) => {
                  const qtdN = toNumberAny(it.qtd);
                  const precoN = toNumberAny(it.preco_unitario);
                  const subtotal = qtdN * precoN;

                  const nome =
                    it.produto?.nome ||
                    produtosMap.get(Number(it.produto_id))?.nome ||
                    `Produto #${it.produto_id}`;

                  return (
                    <tr key={it.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}>
                      <td style={tableStyles.td}>{it.id}</td>

                      <td style={{ ...tableStyles.td, whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.35 }} title={nome}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{nome}</div>
                      </td>

                      <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                        {formatQtyBR(qtdN)}
                      </td>

                      <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                        R$ {formatMoneyBR(precoN)}
                      </td>

                      <td style={tableStyles.td}>{it.previsao_entrega ? String(it.previsao_entrega).slice(0, 10) : "-"}</td>

                      <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8, fontWeight: 800 }}>
                        R$ {formatMoneyBR(subtotal)}
                      </td>

                      <td style={{ ...tableStyles.td, textAlign: "center" }}>
                        <button
                          style={{ ...buttonStyles.icon, opacity: removingItemId === it.id ? 0.6 : 1 }}
                          onClick={() => handleRemoveItem(it.id)}
                          disabled={removingItemId === it.id || !compraId}
                          title="Remover item"
                        >
                          <FiTrash2 size={18} color="#dc2626" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
          <button style={buttonStyles.link} onClick={() => navigate("/compras")} disabled={savingItem || savingHeader}>
            Voltar para lista
          </button>
        </div>
      </div>
    </div>
  );
}