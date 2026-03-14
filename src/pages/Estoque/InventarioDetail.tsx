import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiX,
  FiRotateCcw,
  FiSlash,
  FiCamera
} from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api/api";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { tableStyles } from "../../styles/table";
import { filterStyles } from "../../styles/filters";
import { badgeStyles } from "../../styles/badges";
import { fieldFocusHandlers } from "../../styles/focus";

type Motivo = {
  id: number;
  descricao: string;
};

type Produto = {
  id: number;
  nome: string;
  cod_barra?: string | null;
  controla_lote?: boolean;
  controla_validade?: boolean;
  custo_medio?: string | number | null;
};

type InventarioItem = {
  id: number;
  inventario_id: number;
  produto_id: number;
  lote?: string | null;
  validade?: string | null;
  quantidade_contada: string | number;
  quantidade_estoque: string | number;
  quantidade_ajuste: string | number;
  custo_unitario?: string | number | null;
  status: string;
  observacao?: string | null;
  produto?: Produto | null;
};

type Inventario = {
  id: number;
  data_inventario: string;
  observacao?: string | null;
  status: string;
  motivo?: Motivo | null;
  itens?: InventarioItem[];
};

function toNumber(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}

function formatDecimal(v: unknown, digits = 4) {
  return toNumber(v).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatMoney(v: unknown) {
  return toNumber(v).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function getStatusLabel(status?: string) {
  switch (String(status || "").toUpperCase()) {
    case "ABERTO":
      return "Aberto";
    case "EM_CONFERENCIA":
      return "Em Conferência";
    case "CONFIRMADO":
      return "Confirmado";
    case "CANCELADO":
      return "Cancelado";
    case "PENDENTE":
      return "Pendente";
    case "CONFERIDO":
      return "Conferido";
    case "PROCESSADO":
      return "Processado";
    default:
      return status || "-";
  }
}

function getBadgeStyle(status?: string): React.CSSProperties {
  const s = String(status || "").toUpperCase();

  if (s === "CONFIRMADO" || s === "PROCESSADO") {
    return { ...badgeStyles.base, ...badgeStyles.success };
  }

  if (s === "CANCELADO") {
    return { ...badgeStyles.base, ...badgeStyles.danger };
  }

  if (s === "EM_CONFERENCIA") {
    return { ...badgeStyles.base, ...badgeStyles.warning };
  }

  return {
    ...badgeStyles.base,
    background: "#dbeafe",
    color: "#1d4ed8",
  };
}

const sectionTitleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingBottom: 12,
  marginBottom: 14,
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

export default function InventarioDetail() {
  const navigate = useNavigate();
  const params = useParams();

  const inventarioId = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [inventario, setInventario] = useState<Inventario | null>(null);

  const inventarioBloqueado =
    inventario?.status === "CONFIRMADO" ||
    inventario?.status === "CANCELADO";

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaProduto, setBuscaProduto] = useState("");

  const [itemForm, setItemForm] = useState({
    produto_id: "",
    quantidade_contada: "",
    custo_unitario: "",
    lote: "",
    validade: "",
    observacao: "",
  });

  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  useEffect(() => {
    if (!inventarioId) return;
    loadInventario();
    loadProdutos();
  }, [inventarioId]);

  async function loadInventario() {
    try {
      setLoading(true);
      const { data } = await api.get(`/inventario/${inventarioId}`);
      setInventario(data?.data || null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao carregar inventário");
    } finally {
      setLoading(false);
    }
  }

  async function loadProdutos() {
    try {
      const { data } = await api.get("/produtos", {
        params: {
          page: 1,
          limit: 500,
          sort: "nome",
          order: "ASC",
        },
      });

      setProdutos(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar produtos");
    }
  }

  async function handleConferirItem(itemId: number) {
    if (inventarioBloqueado) {
      toast.error("Inventário bloqueado para alterações");
      return;
    }

    try {
      await api.post(`/inventario/item/${itemId}/conferir`);
      toast.success("Item marcado como conferido");
      loadInventario();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao conferir item");
    }
  }

  async function handleVoltarPendente(itemId: number) {
    if (inventarioBloqueado) {
      toast.error("Inventário bloqueado para alterações");
      return;
    }

    try {
      await api.post(`/inventario/item/${itemId}/pendente`);
      toast.success("Item voltou para pendente");
      loadInventario();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao voltar item para pendente");
    }
  }

  async function handleCancelarInventario() {
    if (!inventario || inventarioBloqueado) return;

    const ok = window.confirm(
      "Deseja cancelar este inventário? Essa ação impedirá novas alterações."
    );
    if (!ok) return;

    try {
      await api.post(`/inventario/${inventarioId}/cancelar`);
      toast.success("Inventário cancelado com sucesso");
      loadInventario();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao cancelar inventário");
    }
  }

  const produtoSelecionado = useMemo(() => {
    const id = Number(itemForm.produto_id);
    if (!id) return null;
    return produtos.find((p) => Number(p.id) === id) || null;
  }, [itemForm.produto_id, produtos]);

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();
    if (!termo) return produtos;

    return produtos.filter((p) => {
      const nome = String(p.nome || "").toLowerCase();
      const codigo = String(p.cod_barra || "").toLowerCase();
      return nome.includes(termo) || codigo.includes(termo);
    });
  }, [produtos, buscaProduto]);

  const possuiItensPendentes = useMemo(() => {
    const itens = inventario?.itens || [];
    return itens.some((item) => {
      const status = String(item.status || "").toUpperCase();
      return status !== "CONFERIDO" && status !== "PROCESSADO";
    });
  }, [inventario]);

  const controlaLote = !!produtoSelecionado?.controla_lote;
  const controlaValidade = !!produtoSelecionado?.controla_validade;

  const totalItens = inventario?.itens?.length || 0;

  const totalConferidos = useMemo(() => {
    const itens = inventario?.itens || [];
    return itens.filter((item) => {
      const status = String(item.status || "").toUpperCase();
      return status === "CONFERIDO" || status === "PROCESSADO";
    }).length;
  }, [inventario]);

  const totalPendentes = useMemo(() => {
    const itens = inventario?.itens || [];
    return itens.filter((item) => {
      const status = String(item.status || "").toUpperCase();
      return status !== "CONFERIDO" && status !== "PROCESSADO";
    }).length;
  }, [inventario]);

  const resumoAjustes = useMemo(() => {
    const itens = inventario?.itens || [];
    const entradas = itens
      .filter((it) => toNumber(it.quantidade_ajuste) > 0)
      .reduce((acc, it) => acc + toNumber(it.quantidade_ajuste), 0);

    const saidas = itens
      .filter((it) => toNumber(it.quantidade_ajuste) < 0)
      .reduce((acc, it) => acc + Math.abs(toNumber(it.quantidade_ajuste)), 0);

    return { entradas, saidas };
  }, [inventario]);

  function updateItemField(field: string, value: string) {
    setItemForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleProdutoChange(value: string) {
    const produto = produtos.find((p) => String(p.id) === value) || null;
    const custoMedio = produto?.custo_medio;

    setItemForm((prev) => ({
      ...prev,
      produto_id: value,
      custo_unitario:
        custoMedio !== null &&
          custoMedio !== undefined &&
          String(custoMedio).trim() !== ""
          ? String(custoMedio)
          : "",
      lote: produto?.controla_lote ? prev.lote : "",
      validade: produto?.controla_validade ? prev.validade : "",
    }));

    if (produto && !produto.controla_lote) {
      setItemForm((prev) => ({
        ...prev,
        produto_id: value,
        custo_unitario:
          custoMedio !== null &&
            custoMedio !== undefined &&
            String(custoMedio).trim() !== ""
            ? String(custoMedio)
            : "",
        lote: "",
        validade: "",
      }));
    }

    if (produto && produto.controla_lote && !produto.controla_validade) {
      setItemForm((prev) => ({
        ...prev,
        produto_id: value,
        custo_unitario:
          custoMedio !== null &&
            custoMedio !== undefined &&
            String(custoMedio).trim() !== ""
            ? String(custoMedio)
            : "",
        validade: "",
      }));
    }
  }

  function resetItemForm() {
    setItemForm({
      produto_id: "",
      quantidade_contada: "",
      custo_unitario: "",
      lote: "",
      validade: "",
      observacao: "",
    });
    setBuscaProduto("");
    setEditingItemId(null);
  }

  function handleEditItem(item: InventarioItem) {
    setEditingItemId(item.id);

    setItemForm({
      produto_id: String(item.produto_id || ""),
      quantidade_contada: String(item.quantidade_contada ?? ""),
      custo_unitario:
        item.custo_unitario !== null && item.custo_unitario !== undefined
          ? String(item.custo_unitario)
          : "",
      lote: item.lote || "",
      validade: item.validade ? String(item.validade).slice(0, 10) : "",
      observacao: item.observacao || "",
    });

    setBuscaProduto(item.produto?.nome || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function validateItemForm() {
    if (!itemForm.produto_id) {
      toast.error("Selecione um produto");
      return false;
    }

    if (itemForm.quantidade_contada === "" || toNumber(itemForm.quantidade_contada, NaN) < 0) {
      toast.error("Informe uma quantidade contada válida");
      return false;
    }

    if (controlaLote && !itemForm.lote.trim()) {
      toast.error("Informe o lote");
      return false;
    }

    if (controlaValidade && !itemForm.validade) {
      toast.error("Informe a validade");
      return false;
    }

    if (!controlaLote && itemForm.validade) {
      toast.error("Não é permitido informar validade sem lote");
      return false;
    }

    return true;
  }

  async function handleUpdateItem(e: React.FormEvent) {
    e.preventDefault();

    if (!editingItemId) return;
    if (inventarioBloqueado) {
      toast.error("Inventário bloqueado para alterações");
      return;
    }

    if (!validateItemForm()) return;

    try {
      setSavingItem(true);

      const payload: Record<string, unknown> = {
        quantidade_contada: toNumber(itemForm.quantidade_contada),
        observacao: itemForm.observacao.trim() || null,
      };

      if (itemForm.custo_unitario.trim() !== "") {
        payload.custo_unitario = toNumber(itemForm.custo_unitario);
      } else {
        payload.custo_unitario = null;
      }

      if (controlaLote) {
        payload.lote = itemForm.lote.trim();
      } else {
        payload.lote = null;
      }

      if (controlaValidade) {
        payload.validade = itemForm.validade || null;
      } else {
        payload.validade = null;
      }

      await api.put(`/inventario/item/${editingItemId}`, payload);

      toast.success("Item atualizado com sucesso");
      resetItemForm();
      loadInventario();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao atualizar item");
    } finally {
      setSavingItem(false);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();

    if (inventarioBloqueado) {
      toast.error("Inventário bloqueado para alterações");
      return;
    }

    if (!validateItemForm()) return;

    try {
      setSavingItem(true);

      const payload: Record<string, unknown> = {
        produto_id: Number(itemForm.produto_id),
        quantidade_contada: toNumber(itemForm.quantidade_contada),
        observacao: itemForm.observacao.trim() || null,
      };

      if (itemForm.custo_unitario.trim() !== "") {
        payload.custo_unitario = toNumber(itemForm.custo_unitario);
      }

      if (controlaLote) {
        payload.lote = itemForm.lote.trim();
      }

      if (controlaValidade) {
        payload.validade = itemForm.validade;
      }

      await api.post(`/inventario/${inventarioId}/itens`, payload);

      toast.success("Item adicionado com sucesso");
      resetItemForm();
      loadInventario();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao adicionar item");
    } finally {
      setSavingItem(false);
    }
  }

  async function handleDeleteItem(itemId: number) {
    if (inventarioBloqueado) {
      toast.error("Inventário bloqueado para alterações");
      return;
    }

    const ok = window.confirm("Deseja remover este item do inventário?");
    if (!ok) return;

    try {
      await api.delete(`/inventario/item/${itemId}`);
      toast.success("Item removido com sucesso");
      loadInventario();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao remover item");
    }
  }

  async function handleConfirmInventario() {
    if (!inventario || inventarioBloqueado) return;

    const ok = window.confirm(
      "Deseja confirmar este inventário? Essa ação irá ajustar o estoque."
    );
    if (!ok) return;

    try {
      setConfirming(true);
      await api.post(`/inventario/${inventarioId}/confirmar`);
      toast.success("Inventário confirmado com sucesso");
      loadInventario();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao confirmar inventário");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div style={layoutStyles.page}>
      <div style={styles.headerTop}>
        <div>
          <h1 style={styles.title}>Inventário #{inventario?.id || inventarioId}</h1>
          <p style={styles.subtitle}>
            Gerencie os itens e confirme o inventário para atualizar o estoque.
          </p>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            style={buttonStyles.secondary}
            onClick={() => navigate("/estoque/inventario")}
          >
            <FiArrowLeft size={16} style={{ marginRight: 6 }} />
            Voltar
          </button>

          {inventario && !inventarioBloqueado && (
            <button
              type="button"
              style={buttonStyles.secondary}
              onClick={() => navigate(`/estoque/inventario/${inventarioId}/scanner`)}
              title="Abrir scanner de código de barras"
            >
              <FiCamera size={16} style={{ marginRight: 8 }} />
              Scanner
            </button>
          )}

          {!inventarioBloqueado && (
            <button
              type="button"
              style={{
                ...buttonStyles.primary,
                opacity: confirming || possuiItensPendentes ? 0.65 : 1,
                cursor: confirming || possuiItensPendentes ? "not-allowed" : "pointer",
              }}
              disabled={confirming || possuiItensPendentes}
              onClick={handleConfirmInventario}
              title={
                possuiItensPendentes
                  ? "Confira todos os itens antes de confirmar o inventário"
                  : "Confirmar inventário"
              }
            >
              <FiCheck size={16} style={{ marginRight: 8 }} />
              {confirming ? "Confirmando..." : "Confirmar inventário"}
            </button>
          )}

          {!inventarioBloqueado && (
            <button
              type="button"
              style={styles.dangerButton}
              onClick={handleCancelarInventario}
            >
              <FiSlash size={16} style={{ marginRight: 8 }} />
              Cancelar inventário
            </button>
          )}
        </div>
      </div>

      {!inventarioBloqueado && possuiItensPendentes && (
        <div style={styles.alertWarning}>
          Existem itens pendentes de conferência. Confira todos os itens antes de confirmar o inventário.
        </div>
      )}

      {!loading && inventario && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Itens</span>
            <span style={styles.statValue}>{totalItens}</span>
          </div>

          <div style={styles.statCard}>
            <span style={styles.statLabel}>Conferidos</span>
            <span style={styles.statValue}>{totalConferidos}</span>
          </div>

          <div style={styles.statCard}>
            <span style={styles.statLabel}>Pendentes</span>
            <span style={{ ...styles.statValue, color: "#d97706" }}>
              {totalPendentes}
            </span>
          </div>

          <div style={styles.statCard}>
            <span style={styles.statLabel}>Ajustes</span>
            <span style={styles.statValue}>
              {formatDecimal(resumoAjustes.entradas - resumoAjustes.saidas)}
            </span>
          </div>
        </div>
      )}

      <div style={layoutStyles.card}>
        <div style={sectionTitleStyle}>
          <div style={sectionLabelStyle}>Resumo do Inventário</div>
          <div style={sectionHintStyle}>
            {loading
              ? "Carregando..."
              : `${totalItens} item(ns) · Entradas: ${formatDecimal(
                resumoAjustes.entradas
              )} · Saídas: ${formatDecimal(resumoAjustes.saidas)}`}
          </div>
        </div>

        {loading && <div style={styles.emptyState}>Carregando inventário...</div>}

        {!loading && !inventario && (
          <div style={styles.emptyState}>Inventário não encontrado.</div>
        )}

        {!loading && inventario && (
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <span style={styles.summaryLabel}>ID</span>
              <strong style={styles.summaryValue}>{inventario.id}</strong>
            </div>

            <div style={styles.summaryCard}>
              <span style={styles.summaryLabel}>Data</span>
              <strong style={styles.summaryValue}>
                {formatDate(inventario.data_inventario)}
              </strong>
            </div>

            <div style={styles.summaryCard}>
              <span style={styles.summaryLabel}>Motivo</span>
              <strong style={styles.summaryValue}>
                {inventario.motivo?.descricao || "-"}
              </strong>
            </div>

            <div style={styles.summaryCard}>
              <span style={styles.summaryLabel}>Status</span>
              <span style={getBadgeStyle(inventario.status)}>
                {getStatusLabel(inventario.status)}
              </span>
            </div>

            <div style={{ ...styles.summaryCard, gridColumn: "1 / -1" }}>
              <span style={styles.summaryLabel}>Observação</span>
              <strong style={styles.summaryValue}>
                {inventario.observacao || "-"}
              </strong>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 22 }} />

      {inventario && !inventarioBloqueado && (
        <>
          <div style={layoutStyles.card}>
            <div style={sectionTitleStyle}>
              <div style={sectionLabelStyle}>
                {editingItemId ? "Editar Item" : "Adicionar Item"}
              </div>
              <div style={sectionHintStyle}>
                Selecione o produto e informe a contagem encontrada.
              </div>
            </div>

            {editingItemId && (
              <div style={styles.editingAlert}>
                Você está editando o item <strong>#{editingItemId}</strong>.
              </div>
            )}

            <form onSubmit={editingItemId ? handleUpdateItem : handleAddItem}>
              <div style={layoutStyles.cardCompact}>
                <div style={styles.formStack}>
                  <div style={styles.formRow}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 320 }}>
                      <label style={styles.label}>Buscar produto</label>
                      <input
                        type="text"
                        value={buscaProduto}
                        onChange={(e) => setBuscaProduto(e.target.value)}
                        placeholder="Digite nome ou código de barras"
                        style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                        onFocus={fieldFocusHandlers.onFocus}
                        onBlur={fieldFocusHandlers.onBlur}
                      />
                      <div style={styles.helperLine}>
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

                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 320 }}>
                      <label style={styles.label}>Produto *</label>
                      <select
                        value={itemForm.produto_id}
                        onChange={(e) => handleProdutoChange(e.target.value)}
                        style={{ ...filterStyles.select, height: 38, padding: "0 12px" }}
                        onFocus={fieldFocusHandlers.onFocus}
                        onBlur={fieldFocusHandlers.onBlur}
                      >
                        <option value="">Selecione</option>
                        {produtosFiltrados.map((produto) => (
                          <option key={produto.id} value={produto.id}>
                            {produto.nome}
                            {produto.cod_barra ? ` - ${produto.cod_barra}` : ""}
                          </option>
                        ))}
                      </select>
                      <div style={styles.helperLine}>{"\u00A0"}</div>
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                      <label style={styles.label}>Quantidade contada *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={itemForm.quantidade_contada}
                        onChange={(e) => updateItemField("quantidade_contada", e.target.value)}
                        style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                        onFocus={fieldFocusHandlers.onFocus}
                        onBlur={fieldFocusHandlers.onBlur}
                      />
                      <div style={styles.helperLine}>{"\u00A0"}</div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                      <label style={styles.label}>Custo unitário</label>
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={itemForm.custo_unitario}
                        onChange={(e) => updateItemField("custo_unitario", e.target.value)}
                        style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                        onFocus={fieldFocusHandlers.onFocus}
                        onBlur={fieldFocusHandlers.onBlur}
                      />
                      <div style={styles.helperLine}>
                        {produtoSelecionado?.custo_medio !== null &&
                          produtoSelecionado?.custo_medio !== undefined
                          ? `Custo médio atual: ${formatMoney(produtoSelecionado.custo_medio)}`
                          : "\u00A0"}
                      </div>
                    </div>

                    {controlaLote && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                        <label style={styles.label}>Lote *</label>
                        <input
                          type="text"
                          value={itemForm.lote}
                          onChange={(e) => updateItemField("lote", e.target.value)}
                          style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                          onFocus={fieldFocusHandlers.onFocus}
                          onBlur={fieldFocusHandlers.onBlur}
                        />
                        <div style={styles.helperLine}>{"\u00A0"}</div>
                      </div>
                    )}

                    {controlaValidade && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
                        <label style={styles.label}>Validade *</label>
                        <input
                          type="date"
                          value={itemForm.validade}
                          onChange={(e) => updateItemField("validade", e.target.value)}
                          style={{ ...filterStyles.input, height: 38, padding: "0 12px" }}
                          onFocus={fieldFocusHandlers.onFocus}
                          onBlur={fieldFocusHandlers.onBlur}
                        />
                        <div style={styles.helperLine}>{"\u00A0"}</div>
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 170 }}>
                      <label style={styles.label}>&nbsp;</label>
                      <button
                        type="submit"
                        style={{ ...buttonStyles.primary, height: 38, padding: "0 12px", width: "100%", whiteSpace: "nowrap", fontSize: 13 }}
                        disabled={savingItem}
                      >
                        {editingItemId ? (
                          <>
                            <FiCheck size={16} style={{ marginRight: 8 }} />
                            {savingItem ? "Salvando..." : "Salvar"}
                          </>
                        ) : (
                          <>
                            <FiPlus size={16} style={{ marginRight: 8 }} />
                            {savingItem ? "Adicionando..." : "Adicionar"}
                          </>
                        )}
                      </button>
                      <div style={styles.helperLine}>{"\u00A0"}</div>
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                      <label style={styles.label}>Observação</label>
                      <textarea
                        rows={3}
                        value={itemForm.observacao}
                        onChange={(e) => updateItemField("observacao", e.target.value)}
                        style={{ ...filterStyles.input, minHeight: 90, padding: "10px 12px", resize: "vertical" }}
                        onFocus={fieldFocusHandlers.onFocus}
                        onBlur={fieldFocusHandlers.onBlur}
                      />
                    </div>
                  </div>

                  {produtoSelecionado && (
                    <div style={styles.infoBox}>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Produto</span>
                        <strong style={styles.infoValue}>{produtoSelecionado.nome}</strong>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Código de barras</span>
                        <strong style={styles.infoValue}>{produtoSelecionado.cod_barra || "-"}</strong>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Controla lote</span>
                        <strong style={styles.infoValue}>{controlaLote ? "Sim" : "Não"}</strong>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Controla validade</span>
                        <strong style={styles.infoValue}>{controlaValidade ? "Sim" : "Não"}</strong>
                      </div>
                    </div>
                  )}

                  <div style={styles.formActions}>
                    {editingItemId ? (
                      <>
                        <button
                          type="button"
                          style={buttonStyles.secondary}
                          onClick={resetItemForm}
                          disabled={savingItem}
                        >
                          <FiX size={16} style={{ marginRight: 8 }} />
                          Cancelar edição
                        </button>

                        <button
                          type="submit"
                          style={buttonStyles.primary}
                          disabled={savingItem}
                        >
                          <FiCheck size={16} style={{ marginRight: 8 }} />
                          {savingItem ? "Salvando..." : "Salvar edição"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        style={buttonStyles.secondary}
                        onClick={resetItemForm}
                        disabled={savingItem}
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div style={{ height: 22 }} />
        </>
      )}

      {inventario && (
        <div style={layoutStyles.card}>
          <div style={sectionTitleStyle}>
            <div style={sectionLabelStyle}>Itens do Inventário</div>
            <div style={sectionHintStyle}>
              {totalItens} item(ns) registrado(s)
            </div>
          </div>

          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={{ ...tableStyles.table, tableLayout: "auto" }}>
              <thead>
                <tr>
                  <th style={{ ...tableStyles.th, width: "28%" }}>Produto</th>
                  <th style={{ ...tableStyles.th, width: 140, textAlign: "right" }}>Qtd. Estoque</th>
                  <th style={{ ...tableStyles.th, width: 140, textAlign: "right" }}>Qtd. Contada</th>
                  <th style={{ ...tableStyles.th, width: 140, textAlign: "right" }}>Ajuste</th>
                  <th style={{ ...tableStyles.th, width: 150 }}>Lote</th>
                  <th style={{ ...tableStyles.th, width: 150 }}>Validade</th>
                  <th style={{ ...tableStyles.th, width: 150, textAlign: "right" }}>Custo Unit.</th>
                  <th style={{ ...tableStyles.th, width: 140 }}>Status</th>
                  <th style={{ ...tableStyles.th, width: 120, textAlign: "center" }}>Ações</th>
                </tr>
              </thead>

              <tbody>
                {!inventario.itens || inventario.itens.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={styles.emptyState}>
                      Nenhum item adicionado.
                    </td>
                  </tr>
                ) : (
                  inventario.itens.map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{
                        background:
                          toNumber(item.quantidade_ajuste) > 0
                            ? "#f0fdf4"
                            : toNumber(item.quantidade_ajuste) < 0
                              ? "#fef2f2"
                              : idx % 2 === 0
                                ? "#fff"
                                : "#f9fafb",
                      }}
                    >
                      <td style={{ ...tableStyles.td, whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.35 }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>
                          {item.produto?.nome || "-"}
                        </div>
                        {item.produto?.cod_barra && (
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            {item.produto.cod_barra}
                          </div>
                        )}
                      </td>

                      <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                        {formatDecimal(item.quantidade_estoque)}
                      </td>

                      <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                        {formatDecimal(item.quantidade_contada)}
                      </td>

                      <td
                        style={{
                          ...tableStyles.td,
                          textAlign: "right",
                          paddingRight: 8,
                          color:
                            toNumber(item.quantidade_ajuste) > 0
                              ? "#166534"
                              : toNumber(item.quantidade_ajuste) < 0
                                ? "#b91c1c"
                                : "#334155",
                          fontWeight: 800,
                        }}
                      >
                        {formatDecimal(item.quantidade_ajuste)}
                      </td>

                      <td style={tableStyles.td}>{item.lote || "-"}</td>
                      <td style={tableStyles.td}>{formatDate(item.validade)}</td>

                      <td style={{ ...tableStyles.td, textAlign: "right", paddingRight: 8 }}>
                        {item.custo_unitario !== null && item.custo_unitario !== undefined
                          ? formatMoney(item.custo_unitario)
                          : "-"}
                      </td>

                      <td style={tableStyles.td}>
                        <span style={getBadgeStyle(item.status)}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>

                      <td style={{ ...tableStyles.td, textAlign: "center" }}>
                        {!inventarioBloqueado && (
                          <div style={styles.rowActions}>
                            {String(item.status || "").toUpperCase() !== "CONFERIDO" ? (
                              <button
                                type="button"
                                style={styles.iconButton}
                                title="Marcar como conferido"
                                onClick={() => handleConferirItem(item.id)}
                              >
                                <FiCheck size={16} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                style={styles.iconButton}
                                title="Voltar para pendente"
                                onClick={() => handleVoltarPendente(item.id)}
                              >
                                <FiRotateCcw size={16} />
                              </button>
                            )}

                            <button
                              type="button"
                              style={styles.iconButton}
                              title="Editar item"
                              onClick={() => handleEditItem(item)}
                            >
                              <FiEdit2 size={16} />
                            </button>

                            <button
                              type="button"
                              style={styles.iconButton}
                              title="Excluir item"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 4,
    color: "#0f172a",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.45,
    maxWidth: 520,
    margin: 0,
  },
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  alertWarning: {
    marginBottom: 20,
    padding: "12px 16px",
    borderRadius: 10,
    background: "#fff7ed",
    border: "1px solid #fdba74",
    color: "#9a3412",
    fontWeight: 600,
    fontSize: 13,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 16,
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  statLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    marginTop: 4,
    color: "#0f172a",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  summaryCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minHeight: 72,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 15,
    color: "#0f172a",
  },
  formStack: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
  },
  formRow: {
    display: "flex",
    gap: 16,
    width: "100%",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
  },
  helperLine: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    minHeight: 16,
    lineHeight: "16px",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as any,
    WebkitLineClamp: 1 as any,
  },
  editingAlert: {
    marginBottom: 14,
    padding: "10px 12px",
    borderRadius: 10,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: 600,
  },
  infoBox: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginTop: 6,
    padding: 14,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  infoValue: {
    fontSize: 14,
    color: "#0f172a",
  },
  formActions: {
    marginTop: 4,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    flexWrap: "wrap",
  },
  rowActions: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid #dbe2ea",
    background: "#fff",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButton: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  emptyState: {
    textAlign: "center",
    color: "#64748b",
    padding: 24,
  },
};