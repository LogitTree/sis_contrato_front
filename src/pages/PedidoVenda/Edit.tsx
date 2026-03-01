import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
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

function normalizeDecimalString(v: string) {
  const clean = (v || "").replace(/[^\d.,]/g, "");
  const hasComma = clean.includes(",");
  const hasDot = clean.includes(".");
  if (hasComma && hasDot) return clean.replace(/\./g, "").replace(",", ".");
  if (hasComma) return clean.replace(",", ".");
  return clean;
}

export default function PedidoVendaEdit() {
  const navigate = useNavigate();
  const params = useParams();
  const pedidoId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  // combos
  const [contratosOptions, setContratosOptions] = useState<ContratoOption[]>([]);
  const [contratoItensOptions, setContratoItensOptions] = useState<ContratoItemOption[]>([]);

  // header form
  const [contratoId, setContratoId] = useState("");
  const [data, setData] = useState("");
  const [observacao, setObservacao] = useState("");

  // itens do pedido
  const [itens, setItens] = useState<PedidoItem[]>([]);

  // item form
  const [contratoItemId, setContratoItemId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [qtd, setQtd] = useState("");

  const qtdRef = useRef<HTMLInputElement | null>(null);

  const helperLineStyle: React.CSSProperties = {
    marginTop: 8,
    fontSize: 12,
    color: "#64748b",
    height: 34,
    lineHeight: "17px",
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

  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const apply = () => setIsSmall(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  async function loadContratos() {
    const res = await api.get("/contratos", { params: { page: 1, limit: 500 } });
    const list = res.data?.data ?? res.data?.rows ?? [];
    const contratos = (Array.isArray(list) ? list : []).map((c: any) => ({
      id: c.id,
      numero: c.numero,
      orgaoNome: c.orgao?.nome ?? "",
      empresaNome: c.empresa?.razao_social ?? c.empresa?.nome_fantasia ?? "",
    }));
    setContratosOptions(contratos);
  }

  async function loadContratoItens(contrato_id: number) {
    const res = await api.get(`/contratos/${contrato_id}`);
    const lista = (res.data?.itens ?? []).map((it: any) => ({
      id: it.id,
      produto_id: it.produto_id,
      produtoNome: it.produto?.nome ?? "",
      unidade_contratada: it.unidade_contratada ?? "UN",
      fator_multiplicacao: it.fator_multiplicacao ?? 1,
      preco_unitario_contratado: it.preco_unitario_contratado ?? "",
      qtd_maxima_contratada: it.qtd_maxima_contratada ?? "",
    }));
    setContratoItensOptions(lista);
  }

  async function loadPedidoAndFill() {
    if (!pedidoId || Number.isNaN(pedidoId)) {
      toast.error("Pedido inválido");
      navigate("/pedidosvenda");
      return;
    }

    // ✅ seu backend retorna o objeto DIRETO (igual você mostrou)
    const res = await api.get(`/pedidosvenda/${pedidoId}`);
    const pedido = res.data;

    // ✅ header
    const contrato_id = pedido?.contrato_id ?? "";
    const dataApi = pedido?.data ?? "";
    const obsApi = pedido?.observacao ?? "";

    setContratoId(String(contrato_id));
    setData(String(dataApi).slice(0, 10));
    setObservacao(obsApi === null || obsApi === undefined ? "" : String(obsApi));

    // ✅ itens
    setItens(Array.isArray(pedido?.itens) ? pedido.itens : []);
  }

  // INIT (reset + load)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // ✅ reset (evita “sumir/ficar travado” ao trocar id)
        setContratoId("");
        setData("");
        setObservacao("");
        setItens([]);
        setContratoItensOptions([]);
        setContratoItemId("");
        setProdutoId("");
        setQtd("");

        await loadContratos();
        await loadPedidoAndFill();
      } catch (err: any) {
        console.error(err);
        toast.error(err?.response?.data?.error || "Erro ao carregar pedido");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  // quando contratoId muda (inclusive vindo do pedido), carrega itens do contrato
  useEffect(() => {
    const id = Number(contratoId);
    if (!id) {
      setContratoItensOptions([]);
      setContratoItemId("");
      setProdutoId("");
      setQtd("");
      return;
    }

    loadContratoItens(id).catch((err) => {
      console.error(err);
      toast.error("Erro ao carregar itens do contrato");
      setContratoItensOptions([]);
    });

    // reseta SOMENTE o form de inserir item
    setContratoItemId("");
    setProdutoId("");
    setQtd("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratoId]);

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
    if (!contratoItemSelecionado) return;
    setProdutoId(String(contratoItemSelecionado.produto_id));
    setTimeout(() => qtdRef.current?.focus(), 60);
  }, [contratoItemId, contratoItemSelecionado]);

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

  const qtdJaInseridaNoMesmoContratoItem = useMemo(() => {
    const id = Number(contratoItemId);
    if (!id) return 0;
    return itens.reduce((acc, it) => (it.contrato_item_id === id ? acc + toNumberAny(it.qtd) : acc), 0);
  }, [itens, contratoItemId]);

  const qtdMaxContratoItem = useMemo(() => {
    if (!contratoItemSelecionado) return 0;
    return toNumberAny(contratoItemSelecionado.qtd_maxima_contratada);
  }, [contratoItemSelecionado]);

  const saldoDisponivelNoPedido = useMemo(() => {
    if (!qtdMaxContratoItem) return 0;
    return Math.max(0, qtdMaxContratoItem - qtdJaInseridaNoMesmoContratoItem);
  }, [qtdMaxContratoItem, qtdJaInseridaNoMesmoContratoItem]);

  const qtdInformadaNum = useMemo(() => toNumberAny(qtd), [qtd]);

  const qtdExcedeMax = useMemo(() => {
    if (!contratoItemSelecionado) return false;
    if (!qtdMaxContratoItem) return false;
    if (!qtdInformadaNum) return false;
    return qtdJaInseridaNoMesmoContratoItem + qtdInformadaNum > qtdMaxContratoItem;
  }, [contratoItemSelecionado, qtdMaxContratoItem, qtdJaInseridaNoMesmoContratoItem, qtdInformadaNum]);

  async function handleSalvarCabecalho(e: React.FormEvent) {
    e.preventDefault();
    if (!pedidoId) return;
    if (!contratoId) return toast.error("Selecione um contrato");
    if (!data) return toast.error("Informe a data");

    setSavingHeader(true);
    try {
      const payload = {
        contrato_id: Number(contratoId),
        data,
        observacao: observacao?.trim() || null,
      };

      await api.put(`/pedidosvenda/${pedidoId}`, payload);
      toast.success("Cabeçalho atualizado");
      await loadPedidoAndFill();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao atualizar cabeçalho");
    } finally {
      setSavingHeader(false);
    }
  }

  async function handleAddItem() {
    if (!pedidoId) return toast.error("Pedido inválido.");
    if (!contratoItemId) return toast.error("Selecione o item do contrato");
    if (!produtoId) return toast.error("Produto inválido");

    const qtdN = toNumberAny(qtd);
    if (!qtdN || qtdN <= 0) return toast.error("Informe a quantidade");
    if (qtdExcedeMax) return toast.error("Quantidade excede o máximo contratado (no pedido).");

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
      setContratoItemId("");
      setProdutoId("");
      setQtd("");

      await loadPedidoAndFill();
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
      await api.delete(`/pedidosvenda/${pedidoId}/itens/${itemId}`);
      toast.success("Item removido");
      await loadPedidoAndFill();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao remover item");
    } finally {
      setRemovingItemId(null);
    }
  }

  const disableHeader = loading || savingHeader;
  const disableItem = loading || savingItem;

  const precoContratoAtual = contratoItemSelecionado
    ? moneyFromApi(contratoItemSelecionado.preco_unitario_contratado)
    : 0;

  const canInsert =
    !disableItem &&
    !!contratoItemId &&
    !!qtd &&
    toNumberAny(qtd) > 0 &&
    !qtdExcedeMax &&
    !!contratoItemSelecionado;

  const itemGridStyle: React.CSSProperties = {
    display: "grid",
    gap: 16,
    alignItems: "end",
    gridTemplateColumns: "minmax(360px, 1fr) 220px 260px 170px",
    width: "100%",
  };

  const itemGridStyleMobile: React.CSSProperties = {
    display: "grid",
    gap: 16,
    alignItems: "end",
    gridTemplateColumns: "1fr",
    width: "100%",
  };

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Editar Pedido de Venda #{pedidoId}</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {loading ? "Carregando..." : "Edite o cabeçalho e gerencie os itens."}
          </div>
        </div>
      </div>

      {/* CABEÇALHO */}
      <div style={layoutStyles.card}>
        <div style={sectionTitleStyle}>
          <div style={sectionLabelStyle}>Cabeçalho do Pedido</div>
          <div style={sectionHintStyle}>Atualize e salve</div>
        </div>

        <form onSubmit={handleSalvarCabecalho}>
          <div style={layoutStyles.cardCompact}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
              <div style={{ display: "flex", gap: 16, width: "100%", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 320 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                    Contrato (Número - Órgão)
                  </label>

                  <select
                    value={contratoId}
                    onChange={(e) => setContratoId(e.target.value)}
                    style={{ ...filterStyles.select, height: 38, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
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

                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220, minWidth: 220 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Data</label>

                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    style={{ ...filterStyles.input, height: 38, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
                    disabled={disableHeader}
                  />

                  <div style={helperLineStyle} aria-hidden>
                    {"\u00A0"}
                  </div>
                </div>
              </div>

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

            <button type="submit" style={buttonStyles.primary} disabled={disableHeader || !contratoId || !data}>
              {savingHeader ? "Salvando..." : "Salvar Alterações"}
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
            Itens: {totais.totalItens} · Qtd: {formatQtyBR(totais.totalQtd)} · Total: R$ {formatMoneyBR(totais.totalValor)}
          </div>
        </div>

        <div style={layoutStyles.cardCompact}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <div style={isSmall ? itemGridStyleMobile : itemGridStyle}>
              {/* SELECT */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Item do Contrato (Produto)</label>

                <select
                  value={contratoItemId}
                  onChange={(e) => setContratoItemId(e.target.value)}
                  style={{ ...filterStyles.select, height: 38, padding: "0 12px", boxSizing: "border-box", width: "100%" }}
                  disabled={disableItem || !contratoId}
                >
                  <option value="">Selecione...</option>
                  {contratoItensOptions.map((it) => (
                    <option key={it.id} value={String(it.id)}>
                      {it.produtoNome ? it.produtoNome : `Item #${it.id}`}
                    </option>
                  ))}
                </select>

                <div style={helperLineStyle}>
                  {contratoItemSelecionado ? (
                    <>
                      <span style={{ color: "#9ca3af" }}>Unidade: </span>
                      {contratoItemSelecionado.unidade_contratada ?? "UN"}
                      <span style={{ color: "#9ca3af", marginLeft: 10 }}>Fator: </span>
                      {String(contratoItemSelecionado.fator_multiplicacao ?? 1)}
                      <span style={{ color: "#9ca3af", marginLeft: 10 }}>Preço contrat.: </span>
                      R$ {formatMoneyBR(precoContratoAtual)}
                      {qtdMaxContratoItem ? (
                        <>
                          <span style={{ color: "#9ca3af", marginLeft: 10 }}>Saldo no pedido: </span>
                          <b>{formatQtyBR(saldoDisponivelNoPedido)}</b>
                        </>
                      ) : null}
                    </>
                  ) : (
                    "\u00A0"
                  )}
                </div>
              </div>

              {/* QTD */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
                    borderColor: qtdExcedeMax ? "#fecaca" : undefined,
                  }}
                  disabled={disableItem}
                />
                <div style={helperLineStyle}>
                  {qtdExcedeMax ? (
                    <span style={{ color: "#b91c1c", fontWeight: 700 }}>Excede o máximo contratado (no pedido).</span>
                  ) : (
                    "\u00A0"
                  )}
                </div>
              </div>

              {/* PREÇO */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Preço Unitário (Contrato)</label>
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
                <div style={{ height: 34 }} aria-hidden />
              </div>

              {/* BOTÃO */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>&nbsp;</label>
                <button
                  type="button"
                  style={{
                    ...buttonStyles.primary,
                    height: 36,               // um pouco menor
                    padding: "0 12px",        // menos padding lateral
                    width: 150,               // largura fixa menor
                    alignSelf: "flex-start",  // evita ocupar a coluna toda
                    whiteSpace: "nowrap",
                  }}
                  onClick={handleAddItem}
                  disabled={!canInsert}
                >
                  {savingItem ? "Inserindo..." : "+ Inserir"}
                </button>
                <div style={{ height: 34 }} aria-hidden />
              </div>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 12, fontSize: 13, color: "#64748b" }}>Exibindo {itens.length} item(ns)</div>

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
              {itens.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Nenhum item inserido ainda.
                  </td>
                </tr>
              )}

              {itens.map((it, idx) => {
                const qtdN = toNumberAny(it.qtd);
                const precoN = moneyFromApi(it.preco_unitario);
                const subtotal = qtdN * precoN;

                const option = contratoItensOptions.find((x) => x.id === it.contrato_item_id);
                const unid = option?.unidade_contratada ?? "UN";
                const nome = it.produto?.nome || option?.produtoNome || `Produto #${it.produto_id}`;

                return (
                  <tr key={it.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={tableStyles.td}>{it.id}</td>

                    <td style={{ ...tableStyles.td, whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.35 }} title={nome}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{nome}</div>
                      {it.motivo_bloqueio ? <div style={{ marginTop: 6, fontSize: 12, color: "#b91c1c" }}>{it.motivo_bloqueio}</div> : null}
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "center" }}>{unid}</td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>{formatQtyBR(qtdN)}</td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>R$ {formatMoneyBR(precoN)}</td>

                    <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8, fontWeight: 800 }}>R$ {formatMoneyBR(subtotal)}</td>

                    <td style={{ ...tableStyles.td, textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          display: "inline-block",
                          background: it.aprovado ? "#dcfce7" : "#fef9c3",
                          color: it.aprovado ? "#166534" : "#854d0e",
                        }}
                      >
                        {it.aprovado ? "SIM" : "NÃO"}
                      </span>
                    </td>

                    <td style={{ ...tableStyles.td, textAlign: "center" }}>
                      <button
                        style={{ ...buttonStyles.icon, opacity: removingItemId === it.id ? 0.6 : 1 }}
                        onClick={() => handleRemoveItem(it.id)}
                        disabled={removingItemId === it.id}
                        title="Remover item"
                      >
                        <FiTrash2 size={18} color="#dc2626" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Carregando...
                  </td>
                </tr>
              )}
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