import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { tableStyles } from "../../styles/table";
import { filterStyles } from "../../styles/filters";

import { FiTrash2 } from "react-icons/fi";

type ContratoOption = {
  id: number;
  numero: string;
  orgaoNome?: string;
  empresaNome?: string;
};

type ContratoItemOption = {
  id: number;
  produto_id: number;
  produtoNome?: string;
  unidade_contratada?: string;
  fator_multiplicacao?: string | number;
  preco_unitario_contratado?: string | number;
  qtd_maxima_contratada?: string | number;

  // ✅ do backend
  qtd_utilizada?: string | number;
  saldo_contrato?: string | number;
};

type PedidoItem = {
  id: number;
  contrato_item_id: number;
  produto_id: number;
  qtd: string;
  preco_unitario: string;
  aprovado?: boolean;
  motivo_bloqueio?: string | null;

  produto?: { nome?: string };
  contrato_item?: { id: number };
};

const LS_DRAFT_KEY = "pedidovenda_create_draft_v1";

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

/**
 * ✅ NORMALIZA DINHEIRO
 * Alguns endpoints retornam em centavos (ex: 1000000 = R$ 10.000,00).
 * Heurística: se for inteiro e >= 100000, assume centavos e divide por 100.
 */
function moneyFromApi(v: any): number {
  const n = toNumberAny(v);
  const isInt = Math.abs(n - Math.round(n)) < 1e-9;
  if (isInt && n >= 100000) return n / 100;
  return n;
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

export default function PedidoVendaCreate() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  // ===== combos =====
  const [contratosOptions, setContratosOptions] = useState<ContratoOption[]>([]);
  const [contratoItensOptions, setContratoItensOptions] = useState<ContratoItemOption[]>([]);

  // ===== header form =====
  const [contratoId, setContratoId] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [observacao, setObservacao] = useState("");

  // ===== pedido criado =====
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [itens, setItens] = useState<PedidoItem[]>([]);

  // ===== item form =====
  const [contratoItemId, setContratoItemId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [qtd, setQtd] = useState("");
  const [precoUnit, setPrecoUnit] = useState("");

  const qtdRef = useRef<HTMLInputElement | null>(null);

  // ✅ helper com altura estável (melhor leitura, sem cortar)
  const helperLineStyle: React.CSSProperties = {
    marginTop: 8,
    fontSize: 12,
    color: "#64748b",
    minHeight: 42,
    lineHeight: "17px",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as any,
    WebkitLineClamp: 3 as any,
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

  async function loadContratos() {
    try {
      const res = await api.get("/contratos", { params: { page: 1, limit: 500 } });
      const list = res.data?.data ?? res.data?.rows ?? [];
      const contratos = (Array.isArray(list) ? list : []).map((c: any) => ({
        id: c.id,
        numero: c.numero,
        orgaoNome: c.orgao?.nome ?? "",
        empresaNome: c.empresa?.razao_social ?? c.empresa?.nome_fantasia ?? "",
      }));
      setContratosOptions(contratos);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar contratos");
      setContratosOptions([]);
    }
  }

  // ✅ carrega itens do contrato + saldo_contrato vindo do backend
  async function loadContratoItens(contrato_id: number) {
    try {
      const res = await api.get(`/contratos/${contrato_id}`);
      const lista = (res.data?.itens ?? []).map((it: any) => ({
        id: it.id,
        produto_id: it.produto_id,
        produtoNome: it.produto?.nome ?? "",
        unidade_contratada: it.unidade_contratada ?? "UN",
        fator_multiplicacao: it.fator_multiplicacao ?? 1,
        preco_unitario_contratado: it.preco_unitario_contratado ?? "",
        qtd_maxima_contratada: it.qtd_maxima_contratada ?? "",
        saldo_contrato: it.saldo_contrato ?? it.saldoContrato ?? 0,
        qtd_utilizada: it.qtd_utilizada ?? it.qtdUtilizada ?? 0,
      }));
      setContratoItensOptions(lista);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar itens do contrato");
      setContratoItensOptions([]);
    }
  }

  async function loadPedido(id: number) {
    try {
      const res = await api.get(`/pedidosvenda/${id}`);
      const lista = res.data?.itens ?? res.data?.PedidoItemVendas ?? res.data?.pedidoItens ?? [];
      setItens(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar itens do pedido");
    }
  }

  // restore draft do cabeçalho (se não salvou)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft) return;
      if (!pedidoId) {
        if (draft.contratoId) setContratoId(String(draft.contratoId));
        if (draft.data) setData(String(draft.data));
        if (draft.observacao !== undefined) setObservacao(String(draft.observacao ?? ""));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pedidoId) return;
    try {
      localStorage.setItem(LS_DRAFT_KEY, JSON.stringify({ contratoId, data, observacao }));
    } catch {}
  }, [contratoId, data, observacao, pedidoId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadContratos();
      setLoading(false);
    })();
  }, []);

  const contratoSelecionado = useMemo(() => {
    const id = Number(contratoId);
    if (!id) return null;
    return contratosOptions.find((c) => c.id === id) ?? null;
  }, [contratoId, contratosOptions]);

  const contratoItemSelecionado = useMemo(() => {
    const id = Number(contratoItemId);
    if (!id) return null;
    return contratoItensOptions.find((i) => i.id === id) ?? null;
  }, [contratoItemId, contratoItensOptions]);

  useEffect(() => {
    const id = Number(contratoId);
    if (!id) {
      setContratoItensOptions([]);
      setContratoItemId("");
      setProdutoId("");
      setQtd("");
      setPrecoUnit("");
      return;
    }
    loadContratoItens(id);
    setContratoItemId("");
    setProdutoId("");
    setQtd("");
    setPrecoUnit("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratoId]);

  // preço sempre do contrato
  useEffect(() => {
    if (!contratoItemSelecionado) return;
    setProdutoId(String(contratoItemSelecionado.produto_id));

    const precoContrato = moneyFromApi(contratoItemSelecionado.preco_unitario_contratado);
    setPrecoUnit(String(precoContrato || ""));

    setTimeout(() => qtdRef.current?.focus(), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratoItemId]);

  // totais do pedido
  const totais = useMemo(() => {
    const totalItens = itens.length;
    const totalQtd = itens.reduce((acc, it) => acc + toNumberAny(it.qtd), 0);
    const totalValor = itens.reduce((acc, it) => {
      const q = toNumberAny(it.qtd);
      const p = moneyFromApi(it.preco_unitario);
      return acc + q * p;
    }, 0);
    return { totalItens, totalQtd, totalValor };
  }, [itens]);

  const qtdInformadaNum = useMemo(() => toNumberAny(qtd), [qtd]);

  // ✅ SALDO DO CONTRATO (única regra)
  const saldoContratoSelecionado = useMemo(() => {
    if (!contratoItemSelecionado) return 0;
    return toNumberAny(contratoItemSelecionado.saldo_contrato);
  }, [contratoItemSelecionado]);

  const qtdExcedeSaldoContrato = useMemo(() => {
    if (!contratoItemSelecionado) return false;
    if (!qtdInformadaNum) return false;
    return qtdInformadaNum > saldoContratoSelecionado;
  }, [contratoItemSelecionado, qtdInformadaNum, saldoContratoSelecionado]);

  async function handleSalvarCabecalho(e: React.FormEvent) {
    e.preventDefault();
    if (!contratoId) return toast.error("Selecione um contrato");

    setSavingHeader(true);
    try {
      const payload = {
        contrato_id: Number(contratoId),
        data,
        observacao: observacao?.trim() || null,
      };

      // ✅ mantém como estava: precisa retornar id
      const res = await api.post("/pedidosvenda", payload);
      const id = res.data?.id;
      if (!id) throw new Error("API não retornou o ID do pedido");

      setPedidoId(id);

      try {
        localStorage.removeItem(LS_DRAFT_KEY);
      } catch {}

      toast.success("Pedido criado. Agora adicione os itens.");
      await loadPedido(id);
      // carrega saldo atualizado do contrato também
      await loadContratoItens(Number(contratoId));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao salvar cabeçalho");
    } finally {
      setSavingHeader(false);
    }
  }

  async function handleAddItem() {
    if (!pedidoId) return toast.error("Salve o cabeçalho do pedido primeiro.");
    if (!contratoItemId) return toast.error("Selecione o item do contrato");
    if (!produtoId) return toast.error("Produto inválido");

    const qtdN = toNumberAny(qtd);
    if (!qtdN || qtdN <= 0) return toast.error("Informe a quantidade");

    // ✅ valida pelo SALDO DO CONTRATO
    if (qtdExcedeSaldoContrato) {
      return toast.error("Quantidade excede o saldo do contrato para este item.");
    }

    const precoContrato = contratoItemSelecionado
      ? moneyFromApi(contratoItemSelecionado.preco_unitario_contratado)
      : 0;

    if (!precoContrato || precoContrato <= 0) return toast.error("Preço do contrato inválido");

    setSavingItem(true);
    try {
      const payload = {
        contrato_item_id: Number(contratoItemId),
        produto_id: Number(produtoId),
        qtd: String(qtdN),
        preco_unitario: String(precoContrato),
      };

      await api.post(`/pedidosvenda/${pedidoId}/itens`, payload);

      toast.success("Item inserido");

      // reset form
      setContratoItemId("");
      setProdutoId("");
      setQtd("");
      setPrecoUnit("");

      await loadPedido(pedidoId);
      // ✅ atualiza saldos do contrato após inserir
      if (contratoId) await loadContratoItens(Number(contratoId));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao inserir item");
    } finally {
      setSavingItem(false);
    }
  }

  async function handleRemoveItem(itemId: number) {
    if (!pedidoId) return;
    if (!window.confirm("Remover este item?")) return;

    setRemovingItemId(itemId);
    try {
      await api.delete(`/pedidoitem/${pedidoId}/itens/${itemId}`);
      toast.success("Item removido");

      await loadPedido(pedidoId);
      // ✅ atualiza saldos do contrato após remover
      if (contratoId) await loadContratoItens(Number(contratoId));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao remover item");
    } finally {
      setRemovingItemId(null);
    }
  }

  const disableHeader = loading || savingHeader || !!pedidoId;
  const disableItem = loading || savingItem || !pedidoId;

  const precoContratoAtual = contratoItemSelecionado
    ? moneyFromApi(contratoItemSelecionado.preco_unitario_contratado)
    : 0;

  const canInsert =
    !disableItem &&
    !!contratoItemId &&
    !!qtd &&
    toNumberAny(qtd) > 0 &&
    !qtdExcedeSaldoContrato &&
    !!contratoItemSelecionado;

  function statusStyle(aprovado?: boolean) {
    return {
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 700,
      display: "inline-block",
      background: aprovado ? "#dcfce7" : "#fef9c3",
      color: aprovado ? "#166534" : "#854d0e",
    } as React.CSSProperties;
  }

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>
            {pedidoId ? `Pedido de Venda #${pedidoId}` : "Novo Pedido de Venda"}
          </h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {pedidoId
              ? "Cabeçalho criado. Insira os itens abaixo."
              : "Crie o cabeçalho e depois adicione os itens do pedido."}
          </div>
        </div>
      </div>

      {/* CABEÇALHO */}
      <div style={layoutStyles.card}>
        <div style={sectionTitleStyle}>
          <div style={sectionLabelStyle}>Cabeçalho do Pedido</div>
          <div style={sectionHintStyle}>{pedidoId ? "Salvo" : "Preencha e salve para liberar os itens"}</div>
        </div>

        <form onSubmit={handleSalvarCabecalho}>
          <div style={layoutStyles.cardCompact}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
              <div style={{ display: "flex", gap: 16, width: "100%", alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                    Contrato (Número - Órgão)
                  </label>

                  <select
                    value={contratoId}
                    onChange={(e) => setContratoId(e.target.value)}
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
                    {contratosOptions.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.numero} {c.orgaoNome ? `- ${c.orgaoNome}` : ""}
                      </option>
                    ))}
                  </select>

                  <div style={helperLineStyle}>
                    {contratoSelecionado?.empresaNome ? (
                      <>
                        <span style={{ color: "#9ca3af" }}>Empresa do contrato: </span>
                        {contratoSelecionado.empresaNome}
                      </>
                    ) : (
                      "\u00A0"
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Data</label>

                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
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
              </div>

              <div style={{ display: "flex", gap: 16, width: "100%" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                    Observação
                  </label>

                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Opcional"
                    style={{
                      ...filterStyles.input,
                      height: 120,
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
            <button type="button" style={buttonStyles.link} onClick={() => navigate(-1)} disabled={savingHeader}>
              Voltar
            </button>

            <button type="submit" style={buttonStyles.primary} disabled={disableHeader || !contratoId}>
              {savingHeader ? "Salvando..." : pedidoId ? "Salvo" : "Salvar Cabeçalho"}
            </button>
          </div>
        </form>
      </div>

      <div style={{ height: 22 }} />

      {/* ITENS */}
      <div style={layoutStyles.card}>
        <div style={sectionTitleStyle}>
          <div style={sectionLabelStyle}>Itens do Pedido</div>
          <div style={sectionHintStyle}>
            {pedidoId
              ? `Itens: ${totais.totalItens} · Qtd: ${formatQtyBR(totais.totalQtd)} · Total: R$ ${formatMoneyBR(totais.totalValor)}`
              : "Salve o cabeçalho para liberar"}
          </div>
        </div>

        <div style={layoutStyles.cardCompact}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end", width: "100%" }}>
              {/* select item */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  Item do Contrato (Produto)
                </label>

                <select
                  value={contratoItemId}
                  onChange={(e) => setContratoItemId(e.target.value)}
                  style={{
                    ...filterStyles.select,
                    height: 38,
                    padding: "0 12px",
                    boxSizing: "border-box",
                    width: "100%",
                  }}
                  disabled={disableItem || !contratoId}
                >
                  <option value="">{pedidoId ? "Selecione..." : "Salve o cabeçalho primeiro"}</option>
                  {contratoItensOptions.map((it) => (
                    <option key={it.id} value={String(it.id)}>
                      {it.produtoNome ? it.produtoNome : `Item #${it.id}`}
                    </option>
                  ))}
                </select>

                {/* ✅ visual melhor: 2 linhas claras */}
                <div style={helperLineStyle}>
                  {contratoItemSelecionado ? (
                    <>
                      <div>
                        <span style={{ color: "#9ca3af" }}>Unidade:</span>{" "}
                        <b>{contratoItemSelecionado.unidade_contratada ?? "UN"}</b>
                        <span style={{ color: "#9ca3af", marginLeft: 12 }}>Fator:</span>{" "}
                        <b>{String(contratoItemSelecionado.fator_multiplicacao ?? 1)}</b>
                      </div>

                      <div>
                        <span style={{ color: "#9ca3af" }}>Saldo do contrato:</span>{" "}
                        <b>{formatQtyBR(saldoContratoSelecionado)}</b>
                        <span style={{ color: "#9ca3af", marginLeft: 12 }}>Preço contrat.:</span>{" "}
                        <b>R$ {formatMoneyBR(precoContratoAtual)}</b>
                      </div>
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
                  style={{
                    ...filterStyles.input,
                    height: 38,
                    padding: "0 12px",
                    boxSizing: "border-box",
                    width: "100%",
                    borderColor: qtdExcedeSaldoContrato ? "#fecaca" : undefined,
                  }}
                  disabled={disableItem}
                />
                <div style={helperLineStyle}>
                  {qtdExcedeSaldoContrato ? (
                    <span style={{ color: "#b91c1c", fontWeight: 700 }}>Excede o saldo do contrato.</span>
                  ) : (
                    "\u00A0"
                  )}
                </div>
              </div>

              {/* preço */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 260 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  Preço Unitário (Contrato)
                </label>
                <input
                  value={contratoItemSelecionado ? `R$ ${formatMoneyBR(precoContratoAtual)}` : ""}
                  readOnly
                  style={{
                    ...filterStyles.input,
                    height: 38,
                    padding: "0 12px",
                    boxSizing: "border-box",
                    width: "100%",
                    background: "#f8fafc",
                    cursor: "not-allowed",
                  }}
                  disabled={disableItem}
                />
                <div style={helperLineStyle} aria-hidden>
                  {"\u00A0"}
                </div>
              </div>

              {/* botão inserir */}
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
          {pedidoId ? `Exibindo ${itens.length} item(ns)` : "Salve o cabeçalho para liberar os itens."}
        </div>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ ...tableStyles.table, tableLayout: "auto" }}>
            <thead>
              <tr>
                <th style={{ ...tableStyles.th, width: 70 }}>ID</th>
                <th style={{ ...tableStyles.th, width: "52%" }}>PRODUTO</th>
                <th style={{ ...tableStyles.th, width: 80, textAlign: "center" }}>UNID.</th>
                <th style={{ ...tableStyles.th, width: 150, textAlign: "right" }}>QTD</th>
                <th style={{ ...tableStyles.th, width: 170, textAlign: "right" }}>PREÇO UNIT.</th>
                <th style={{ ...tableStyles.th, width: 190, textAlign: "right" }}>SUBTOTAL</th>
                <th style={{ ...tableStyles.th, width: 130, textAlign: "center" }}>APROVADO</th>
                <th style={{ ...tableStyles.th, width: 90, textAlign: "center" }}>AÇÕES</th>
              </tr>
            </thead>

            <tbody>
              {!pedidoId && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Salve o cabeçalho para inserir itens.
                  </td>
                </tr>
              )}

              {pedidoId && itens.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Nenhum item inserido ainda.
                  </td>
                </tr>
              )}

              {pedidoId &&
                itens.map((it, idx) => {
                  const qtdN = toNumberAny(it.qtd);
                  const precoN = moneyFromApi(it.preco_unitario);
                  const subtotal = qtdN * precoN;

                  const option = contratoItensOptions.find((x) => x.id === it.contrato_item_id);
                  const unid = option?.unidade_contratada ?? "UN";
                  const nome = it.produto?.nome || option?.produtoNome || `Produto #${it.produto_id}`;

                  return (
                    <tr key={it.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}>
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
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{nome}</div>
                        {it.motivo_bloqueio ? (
                          <div style={{ marginTop: 6, fontSize: 12, color: "#b91c1c" }}>{it.motivo_bloqueio}</div>
                        ) : null}
                      </td>

                      <td style={{ ...tableStyles.td, textAlign: "center" }}>{unid}</td>

                      <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                        {formatQtyBR(qtdN)}
                      </td>

                      <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                        R$ {formatMoneyBR(precoN)}
                      </td>

                      <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8, fontWeight: 800 }}>
                        R$ {formatMoneyBR(subtotal)}
                      </td>

                      <td style={{ ...tableStyles.td, textAlign: "center" }}>
                        <span style={statusStyle(it.aprovado)}>{it.aprovado ? "SIM" : "NÃO"}</span>
                      </td>

                      <td style={{ ...tableStyles.td, textAlign: "center" }}>
                        <button
                          style={{ ...buttonStyles.icon, opacity: removingItemId === it.id ? 0.6 : 1 }}
                          onClick={() => handleRemoveItem(it.id)}
                          disabled={removingItemId === it.id || !pedidoId}
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
          <button style={buttonStyles.link} onClick={() => navigate("/pedidosvenda")} disabled={savingItem || savingHeader}>
            Voltar para lista
          </button>
        </div>
      </div>
    </div>
  );
}