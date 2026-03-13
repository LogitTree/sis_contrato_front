// src/pages/Compras/Edit.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";
import { tableStyles } from "../../styles/table";

import { FiTrash2 } from "react-icons/fi";

type CompraStatus =
  | "ABERTA"
  | "PARCIALMENTE_RECEBIDA"
  | "RECEBIDA"
  | "CANCELADA";

type FornecedorOption = { id: number; nome: string };
type ProdutoOption = { id: number; nome?: string; descricao?: string; nome_fantasia?: string };

type CompraItem = {
  id: number;
  produto_id: number;
  qtd: string;
  preco_unitario: string;
  recebido_qtd?: string;
  previsao_entrega?: string | null;
  produto?: { nome?: string; descricao?: string };
};

function pickListArray(resData: any): any[] {
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.rows)) return resData.rows;
  if (Array.isArray(resData?.data?.rows)) return resData.data.rows;
  if (Array.isArray(resData?.data?.data)) return resData.data.data;
  if (Array.isArray(resData?.items)) return resData.items;
  return [];
}

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
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQtyBR(n: number) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function formatDateISO(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeDecimalString(v: string) {
  const clean = (v || "").replace(/[^\d.,]/g, "");
  const hasComma = clean.includes(",");
  const hasDot = clean.includes(".");
  if (hasComma && hasDot) return clean.replace(/\./g, "").replace(",", ".");
  if (hasComma) return clean.replace(",", ".");
  return clean;
}

function nomeProduto(p?: ProdutoOption | null) {
  if (!p) return "Produto";
  return p.nome ?? p.descricao ?? p.nome_fantasia ?? `Produto #${p.id}`;
}

function normalizeCompraStatus(value: any): CompraStatus {
  const s = String(value || "ABERTA").toUpperCase();

  if (s === "PARCIALMENTE_RECEBIDA") return "PARCIALMENTE_RECEBIDA";
  if (s === "RECEBIDA") return "RECEBIDA";
  if (s === "CANCELADA") return "CANCELADA";
  return "ABERTA";
}

function getStatusColor(status: CompraStatus) {
  if (status === "RECEBIDA") return "#166534";
  if (status === "PARCIALMENTE_RECEBIDA") return "#92400e";
  if (status === "CANCELADA") return "#991b1b";
  return "#1e40af";
}

export default function ComprasEdit() {
  const navigate = useNavigate();
  const params = useParams();
  const compraId = Number(params.id);

  const [loading, setLoading] = useState(true);

  const [fornecedorId, setFornecedorId] = useState("");
  const [dataPedido, setDataPedido] = useState("");
  const [observacao, setObservacao] = useState("");
  const [status, setStatus] = useState<CompraStatus>("ABERTA");

  const [numeroNF, setNumeroNF] = useState("");
  const [serieNF, setSerieNF] = useState("");
  const [dataEmissaoNF, setDataEmissaoNF] = useState("");
  const [chaveNfe, setChaveNfe] = useState("");

  const [valorFrete, setValorFrete] = useState("");
  const [valorDesconto, setValorDesconto] = useState("");

  const [formaPagamento, setFormaPagamento] = useState("");
  const [condicaoPagamento, setCondicaoPagamento] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");

  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([]);
  const [produtos, setProdutos] = useState<ProdutoOption[]>([]);
  const produtosMap = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);

  const [itens, setItens] = useState<CompraItem[]>([]);

  const [produtoId, setProdutoId] = useState("");
  const [qtd, setQtd] = useState("");
  const [precoUnit, setPrecoUnit] = useState("");
  const [previsaoEntrega, setPrevisaoEntrega] = useState("");

  const qtdRef = useRef<HTMLInputElement | null>(null);

  const helperLineStyle: React.CSSProperties = {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    minHeight: 18,
    lineHeight: "16px",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as any,
    WebkitLineClamp: 2 as any,
  };

  const sectionTitleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    marginBottom: 10,
    borderBottom: "1px solid #eef2f7",
    gap: 12,
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

  const headerStackStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
  };

  const headerRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 12,
    width: "100%",
    alignItems: "flex-end",
    flexWrap: "wrap",
  };

  const totais = useMemo(() => {
    const totalItens = itens.length;
    const totalQtd = itens.reduce((acc, it) => acc + toNumberAny(it.qtd), 0);
    const totalValor = itens.reduce(
      (acc, it) => acc + toNumberAny(it.qtd) * toNumberAny(it.preco_unitario),
      0
    );

    const frete = toNumberAny(valorFrete);
    const desconto = toNumberAny(valorDesconto);
    const totalFinal = totalValor + frete - desconto;

    return { totalItens, totalQtd, totalValor, frete, desconto, totalFinal };
  }, [itens, valorFrete, valorDesconto]);

  async function loadCombos() {
    const [resFornec, resProd] = await Promise.all([
      api.get("/fornecedores", { params: { page: 1, limit: 1000 } }),
      api.get("/produtos", { params: { page: 1, limit: 2000 } }),
    ]);

    const forn = pickListArray(resFornec.data).map((f: any) => ({
      id: Number(f.id),
      nome: f.nome ?? f.razao_social ?? f.nome_fantasia ?? `Fornecedor #${f.id}`,
    }));
    setFornecedores(forn);

    const prods = pickListArray(resProd.data).map((p: any) => ({
      id: Number(p.id),
      nome: p.nome ?? p.descricao ?? `Produto #${p.id}`,
      descricao: p.descricao,
      nome_fantasia: p.nome_fantasia,
    }));
    setProdutos(prods);
  }

  async function loadCompra() {
    const res = await api.get(`/compras/${compraId}`);
    const c = res?.data?.data ?? res?.data ?? null;
    if (!c?.id) throw new Error("Compra não encontrada");

    setFornecedorId(c.fornecedor_id ? String(c.fornecedor_id) : "");
    setDataPedido(formatDateISO(c.data_pedido));
    setStatus(normalizeCompraStatus(c.status));
    setObservacao(c.observacao ?? "");

    setNumeroNF(c.numero_nota_fiscal ? String(c.numero_nota_fiscal) : "");
    setSerieNF(c.serie_nota_fiscal ? String(c.serie_nota_fiscal) : "");
    setDataEmissaoNF(formatDateISO(c.data_emissao_nf));
    setChaveNfe(c.chave_nfe ? String(c.chave_nfe) : "");

    setValorFrete(c.valor_frete !== null && c.valor_frete !== undefined ? String(c.valor_frete) : "");
    setValorDesconto(c.valor_desconto !== null && c.valor_desconto !== undefined ? String(c.valor_desconto) : "");

    setFormaPagamento(c.forma_pagamento ? String(c.forma_pagamento) : "");
    setCondicaoPagamento(c.condicao_pagamento ? String(c.condicao_pagamento) : "");
    setDataVencimento(formatDateISO(c.data_vencimento));

    const rawItens = c.itens ?? c.CompraItems ?? c.compra_itens ?? c.items ?? [];
    const lista: CompraItem[] = (Array.isArray(rawItens) ? rawItens : []).map((it: any) => ({
      id: Number(it.id),
      produto_id: Number(it.produto_id),
      qtd: String(it.qtd ?? "0"),
      preco_unitario: String(it.preco_unitario ?? "0"),
      recebido_qtd: String(it.recebido_qtd ?? "0"),
      previsao_entrega: it.previsao_entrega ? formatDateISO(it.previsao_entrega) : null,
      produto: it.produto ?? it.Produto ?? undefined,
    }));
    setItens(lista);
  }

  useEffect(() => {
    (async () => {
      if (!compraId) {
        toast.error("ID inválido");
        navigate("/compras");
        return;
      }

      setLoading(true);
      try {
        await Promise.all([loadCombos(), loadCompra()]);
      } catch (err: any) {
        console.error(err);
        toast.error(err?.response?.data?.error || err?.message || "Erro ao carregar compra");
        navigate("/compras");
      } finally {
        setLoading(false);
      }
    })();
  }, [compraId, navigate]);

  useEffect(() => {
    if (!produtoId) return;
    setTimeout(() => qtdRef.current?.focus(), 60);
  }, [produtoId]);

  async function salvarCabecalho(e?: React.FormEvent) {
    e?.preventDefault?.();

    if (!dataPedido) {
      toast.error("Informe a data do pedido.");
      return;
    }

    setSavingHeader(true);
    try {
      const payload = {
        fornecedor_id: fornecedorId ? Number(fornecedorId) : null,
        data_pedido: dataPedido,
        observacao: observacao?.trim() || null,

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

      await api.put(`/compras/${compraId}`, payload);
      toast.success("Cabeçalho atualizado!");
      await loadCompra();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao salvar cabeçalho");
    } finally {
      setSavingHeader(false);
    }
  }

  async function inserirItem() {
    if (!compraId) return toast.error("Compra inválida.");
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

      toast.success("Item inserido!");

      setProdutoId("");
      setQtd("");
      setPrecoUnit("");
      setPrevisaoEntrega("");
      setTimeout(() => qtdRef.current?.focus(), 80);

      await loadCompra();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao inserir item");
    } finally {
      setSavingItem(false);
    }
  }

  async function removerItem(itemId: number) {
    const ok = window.confirm("Remover este item?");
    if (!ok) return;

    setRemovingItemId(itemId);
    try {
      await api.delete(`/compras/${compraId}/itens/${itemId}`);
      toast.success("Item removido!");
      await loadCompra();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao remover item");
    } finally {
      setRemovingItemId(null);
    }
  }

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

  const compraEditavel = status === "ABERTA";

  const disableHeader =
    loading ||
    savingHeader ||
    savingItem ||
    removingItemId !== null ||
    !compraEditavel;

  const disableItem =
    loading ||
    savingItem ||
    savingHeader ||
    removingItemId !== null ||
    !compraEditavel;

  const canInsert =
    !disableItem &&
    !!produtoId &&
    !!qtd &&
    toNumberAny(qtd) > 0 &&
    precoUnit !== "" &&
    toNumberAny(precoUnit) > 0;

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Compra #{compraId}</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Status: <b>{status.replaceAll("_", " ")}</b> · Total: <b>R$ {formatMoneyBR(totais.totalFinal)}</b>
          </div>
        </div>
      </div>

      <div style={layoutStyles.card}>
        <div style={sectionTitleStyle}>
          <div style={sectionLabelStyle}>Cabeçalho da Compra</div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <div style={sectionHintStyle}>
              {compraEditavel ? "Atualize e salve o cabeçalho" : "Compra não editável neste status"}
            </div>

            <div
              style={{
                padding: "6px 10px",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                background: "#f8fafc",
                fontSize: 12,
                fontWeight: 900,
                color: "#0f172a",
                whiteSpace: "nowrap",
              }}
            >
              Total: R$ {formatMoneyBR(totais.totalFinal)}
            </div>
          </div>
        </div>

        <form onSubmit={salvarCabecalho}>
          <div style={layoutStyles.cardCompact}>
            <div style={headerStackStyle}>
              <div style={headerRowStyle}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 320 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Fornecedor</label>

                  <select
                    value={fornecedorId}
                    onChange={(e) => setFornecedorId(e.target.value)}
                    style={{
                      ...filterStyles.select,
                      height: 38,
                      padding: "0 12px",
                      boxSizing: "border-box",
                      width: "100%",
                    }}
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
                    style={{
                      ...filterStyles.input,
                      height: 38,
                      padding: "0 12px",
                      boxSizing: "border-box",
                      width: "100%",
                    }}
                    disabled={disableHeader}
                  />

                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Status</label>

                  <div
                    style={{
                      ...filterStyles.input,
                      height: 38,
                      padding: "0 12px",
                      display: "flex",
                      alignItems: "center",
                      background: "#f8fafc",
                      fontWeight: 700,
                      color: getStatusColor(status),
                    }}
                  >
                    {status.replaceAll("_", " ")}
                  </div>

                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>
              </div>

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

              <div style={headerRowStyle}>
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

              <div style={{ display: "flex", gap: 12, width: "100%" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Observação</label>

                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Opcional"
                    style={{
                      ...filterStyles.input,
                      height: 96,
                      padding: "10px 12px",
                      boxSizing: "border-box",
                      width: "100%",
                      resize: "vertical",
                    }}
                    disabled={disableHeader}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button
              type="button"
              style={buttonStyles.link}
              onClick={() => navigate(-1)}
              disabled={savingHeader || savingItem}
            >
              Voltar
            </button>
            <button
              type="submit"
              style={buttonStyles.primary}
              disabled={disableHeader || !dataPedido}
            >
              {savingHeader ? "Salvando..." : "Salvar Cabeçalho"}
            </button>
          </div>
        </form>
      </div>

      <div style={{ height: 22 }} />

      <div style={layoutStyles.card}>
        <div style={sectionTitleStyle}>
          <div style={sectionLabelStyle}>Itens da Compra</div>
          <div style={sectionHintStyle}>
            {`Itens: ${totais.totalItens} · Qtd: ${formatQtyBR(totais.totalQtd)} · Itens: R$ ${formatMoneyBR(
              totais.totalValor
            )} · Frete: R$ ${formatMoneyBR(totais.frete)} · Desc: R$ ${formatMoneyBR(
              totais.desconto
            )} · Total: R$ ${formatMoneyBR(totais.totalFinal)}`}
          </div>
        </div>

        <div style={layoutStyles.cardCompact}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", width: "100%", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 280 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Produto</label>
                <select
                  value={produtoId}
                  onChange={(e) => setProdutoId(e.target.value)}
                  style={{
                    ...filterStyles.select,
                    height: 38,
                    padding: "0 12px",
                    boxSizing: "border-box",
                    width: "100%",
                  }}
                  disabled={disableItem}
                >
                  <option value="">Selecione...</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {nomeProduto(p)}
                    </option>
                  ))}
                </select>

                <div style={helperLineStyle}>
                  {produtoSelecionado ? (
                    <>
                      <span style={{ color: "#9ca3af" }}>Selecionado: </span>
                      <b>{nomeProduto(produtoSelecionado)}</b>
                    </>
                  ) : (
                    "\u00A0"
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Quantidade</label>
                <input
                  ref={qtdRef}
                  value={qtd}
                  onChange={(e) => setQtd(normalizeDecimalString(e.target.value))}
                  placeholder="0,000"
                  inputMode="decimal"
                  style={{
                    ...filterStyles.input,
                    height: 38,
                    padding: "0 12px",
                    boxSizing: "border-box",
                    width: "100%",
                  }}
                  disabled={disableItem}
                />
                <div style={helperLineStyle} aria-hidden>
                  {"\u00A0"}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 260 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Preço Unitário</label>
                <input
                  value={precoUnit}
                  onChange={(e) => setPrecoUnit(normalizeDecimalString(e.target.value))}
                  placeholder="0,00"
                  inputMode="decimal"
                  style={{
                    ...filterStyles.input,
                    height: 38,
                    padding: "0 12px",
                    boxSizing: "border-box",
                    width: "100%",
                  }}
                  disabled={disableItem}
                />
                <div style={helperLineStyle} aria-hidden>
                  {"\u00A0"}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Prev. Entrega</label>
                <input
                  type="date"
                  value={previsaoEntrega}
                  onChange={(e) => setPrevisaoEntrega(e.target.value)}
                  style={{
                    ...filterStyles.input,
                    height: 38,
                    padding: "0 12px",
                    boxSizing: "border-box",
                    width: "100%",
                  }}
                  disabled={disableItem}
                />
                <div style={helperLineStyle} aria-hidden>
                  {"\u00A0"}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 170 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>&nbsp;</label>
                <button
                  type="button"
                  style={{
                    ...buttonStyles.primary,
                    height: 38,
                    padding: "0 12px",
                    width: "100%",
                    whiteSpace: "nowrap",
                    fontSize: 13,
                  }}
                  onClick={inserirItem}
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
          Exibindo {itens.length} item(ns)
        </div>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ ...tableStyles.table, tableLayout: "auto" }}>
            <thead>
              <tr>
                <th style={{ ...tableStyles.th, width: 70 }}>ID</th>
                <th style={{ ...tableStyles.th, width: "52%" }}>PRODUTO</th>
                <th style={{ ...tableStyles.th, width: 150, textAlign: "right" }}>QTD</th>
                <th style={{ ...tableStyles.th, width: 170, textAlign: "right" }}>PREÇO UNIT.</th>
                <th style={{ ...tableStyles.th, width: 160 }}>PREV. ENTREGA</th>
                <th style={{ ...tableStyles.th, width: 190, textAlign: "right" }}>SUBTOTAL</th>
                <th style={{ ...tableStyles.th, width: 90, textAlign: "center" }}>AÇÕES</th>
              </tr>
            </thead>

            <tbody>
              {itens.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Nenhum item inserido ainda.
                  </td>
                </tr>
              )}

              {itens.map((it, idx) => {
                const qtdN = toNumberAny(it.qtd);
                const precoN = toNumberAny(it.preco_unitario);
                const subtotal = qtdN * precoN;

                const pOpt = produtosMap.get(it.produto_id);
                const nome =
                  it.produto?.nome ||
                  it.produto?.descricao ||
                  pOpt?.nome ||
                  pOpt?.descricao ||
                  `Produto #${it.produto_id}`;

                const isRemoving = removingItemId === it.id;

                return (
                  <tr
                    key={it.id}
                    style={{
                      background: idx % 2 === 0 ? "#fff" : "#f9fafb",
                      opacity: isRemoving ? 0.6 : 1,
                    }}
                  >
                    <td style={tableStyles.td}>{it.id}</td>

                    <td
                      style={{
                        ...tableStyles.td,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        lineHeight: 1.35,
                      }}
                      title={nome}
                    >
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{nome}</div>
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                      {formatQtyBR(qtdN)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                      R$ {formatMoneyBR(precoN)}
                    </td>

                    <td style={tableStyles.td}>
                      {it.previsao_entrega ? formatDateISO(it.previsao_entrega) : "-"}
                    </td>

                    <td
                      style={{
                        ...tableStyles.td,
                        textAlign: "right",
                        paddingRight: 8,
                        fontWeight: 900,
                      }}
                    >
                      R$ {formatMoneyBR(subtotal)}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "center" }}>
                      <button
                        style={{ ...buttonStyles.icon, opacity: isRemoving ? 0.6 : 1 }}
                        onClick={() => removerItem(it.id)}
                        disabled={disableItem || isRemoving}
                        title="Remover item"
                      >
                        <FiTrash2 size={18} color="#dc2626" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {loading && itens.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Carregando itens...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
          <button
            style={buttonStyles.link}
            onClick={() => navigate("/compras")}
            disabled={savingItem || savingHeader}
          >
            Voltar para lista
          </button>
        </div>
      </div>
    </div>
  );
}