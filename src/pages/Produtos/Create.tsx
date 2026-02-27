import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { formStyles } from "../../styles/form";
import api from "../../api/api";

import { toast } from "react-toastify";

/* =========================
   Types
========================= */
type Grupo = { id: number; nome: string };
type Subgrupo = { id: number; nome: string };

type ProdutoForm = {
  nome: string;
  descricao: string;
  unidade: string;

  grupo_id: string;
  subgrupo_id: string;

  preco_referencia: string; // digits
  custo_medio: string; // digits
  ult_custo: string; // digits

  estoque_min: string;
  cod_barra: string;

  status: "ATIVO" | "INATIVO";
};

/* =========================
   Money helpers (mask)
========================= */
function cleanMoneyDigits(value: string) {
  return (value || "").replace(/\D/g, "");
}

function moneyDigitsToBRL(digits: string) {
  const d = cleanMoneyDigits(digits);
  if (!d) return "";
  const cents = Number(d);
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function digitsToReaisNumber(digits: string) {
  const d = cleanMoneyDigits(digits);
  if (!d) return 0;
  return Number(d) / 100;
}

export default function ProdutoCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [subgrupos, setSubgrupos] = useState<Subgrupo[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [loadingSubgrupos, setLoadingSubgrupos] = useState(false);

  const [form, setForm] = useState<ProdutoForm>({
    nome: "",
    descricao: "",
    unidade: "",
    grupo_id: "",
    subgrupo_id: "",
    preco_referencia: "",
    custo_medio: "",
    ult_custo: "",
    estoque_min: "",
    cod_barra: "",
    status: "ATIVO",
  });

  const moneyFields = useMemo(
    () => new Set(["preco_referencia", "custo_medio", "ult_custo"]),
    []
  );

  /* =========================
     UI helpers
  ========================= */
  const labelSmall: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 6,
  };

  const sectionCard: React.CSSProperties = {
    ...layoutStyles.cardCompact,
    marginBottom: 12,
  };

  const sectionHeaderRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 800,
    color: "#111827",
    letterSpacing: 0.2,
  };

  const divider: React.CSSProperties = {
    height: 1,
    background: "#eef2f7",
    marginBottom: 12,
  };

  const grid2: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  };

  const grid3: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
  };

  const inlineHint: React.CSSProperties = {
    fontSize: 12,
    color: "#64748b",
  };

  /* =========================
     Load Grupos
  ========================= */
  useEffect(() => {
    setLoadingGrupos(true);
    api
      .get("/grupos", { params: { limit: 1000 } })
      .then((res) => setGrupos(res.data.data || []))
      .catch(() => {
        toast.error("Erro ao carregar grupos");
        setGrupos([]);
      })
      .finally(() => setLoadingGrupos(false));
  }, []);

  /* =========================
     Load Subgrupos
  ========================= */
  useEffect(() => {
    if (!form.grupo_id) {
      setSubgrupos([]);
      return;
    }

    setLoadingSubgrupos(true);
    api
      .get("/subgrupos", { params: { grupo_id: Number(form.grupo_id) } })
      .then((res) => setSubgrupos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSubgrupos([]))
      .finally(() => setLoadingSubgrupos(false));
  }, [form.grupo_id]);

  /* =========================
     Handlers
  ========================= */
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    if (moneyFields.has(name)) {
      const digits = cleanMoneyDigits(value);
      setForm((prev) => ({ ...prev, [name]: digits }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "grupo_id" ? { subgrupo_id: "" } : {}),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/produtos", {
        nome: form.nome,
        descricao: form.descricao,
        unidade: form.unidade,

        grupo_id: form.grupo_id ? Number(form.grupo_id) : null,
        subgrupo_id: form.subgrupo_id ? Number(form.subgrupo_id) : null,

        preco_referencia: digitsToReaisNumber(form.preco_referencia),
        custo_medio: digitsToReaisNumber(form.custo_medio),
        ult_custo: digitsToReaisNumber(form.ult_custo),

        cod_barra: form.cod_barra || null,
        estoque_min: form.estoque_min ? Number(form.estoque_min) : 0,

        ativo: form.status === "ATIVO",
      });

      toast.success("Produto cadastrado com sucesso");
      navigate("/produtos");
    } catch {
      toast.error("Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     Render
  ========================= */
  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Novo Produto</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Cadastre um produto e defina classificação e valores.
          </div>
        </div>
      </div>

      <div style={layoutStyles.card}>
        <form onSubmit={handleSubmit} style={formStyles.form}>
          {/* ===== Dados do Produto ===== */}
          <div style={sectionCard}>
            <div style={sectionHeaderRow}>
              <div style={sectionTitle}>Dados do Produto</div>
              <div style={inlineHint}>Campos essenciais para identificação</div>
            </div>
            <div style={divider} />

            <div style={formStyles.field}>
              <label style={labelSmall}>Nome</label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                style={formStyles.input}
                required
                placeholder="Ex.: Arroz Parboilizado 1kg"
              />
            </div>

            <div style={{ ...grid2, marginTop: 12 }}>
              <div style={formStyles.field}>
                <label style={labelSmall}>Unidade</label>
                <input
                  name="unidade"
                  value={form.unidade}
                  onChange={handleChange}
                  style={formStyles.input}
                  placeholder="Ex.: UN, KG, CX"
                />
              </div>

              <div style={formStyles.field}>
                <label style={labelSmall}>Código de barras</label>
                <input
                  name="cod_barra"
                  value={form.cod_barra}
                  onChange={handleChange}
                  style={formStyles.input}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div style={{ marginTop: 12, ...formStyles.field }}>
              <label style={labelSmall}>Descrição</label>
              <textarea
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                style={{
                  ...formStyles.input,
                  height: 84,
                  resize: "vertical",
                  paddingTop: 10,
                  paddingBottom: 10,
                }}
                placeholder="Detalhes adicionais (opcional)"
              />
            </div>
          </div>

          {/* ===== Classificação ===== */}
          <div style={sectionCard}>
            <div style={sectionHeaderRow}>
              <div style={sectionTitle}>Classificação</div>
              <div style={inlineHint}>Organize por grupo e subgrupo</div>
            </div>
            <div style={divider} />

            <div style={grid2}>
              <div style={formStyles.field}>
                <label style={labelSmall}>Grupo</label>
                <select
                  name="grupo_id"
                  value={form.grupo_id}
                  onChange={handleChange}
                  style={formStyles.select}
                  disabled={loadingGrupos}
                >
                  <option value="">
                    {loadingGrupos ? "Carregando grupos..." : "Selecione"}
                  </option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div style={formStyles.field}>
                <label style={labelSmall}>Subgrupo</label>
                <select
                  name="subgrupo_id"
                  value={form.subgrupo_id}
                  onChange={handleChange}
                  disabled={!form.grupo_id || loadingSubgrupos}
                  style={{
                    ...formStyles.select,
                    opacity: form.grupo_id ? 1 : 0.6,
                  }}
                >
                  <option value="">
                    {!form.grupo_id
                      ? "Selecione um grupo"
                      : loadingSubgrupos
                        ? "Carregando subgrupos..."
                        : "Selecione"}
                  </option>
                  {subgrupos.map((sg) => (
                    <option key={sg.id} value={sg.id}>
                      {sg.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ===== Valores ===== */}
          <div style={sectionCard}>
            <div style={sectionHeaderRow}>
              <div style={sectionTitle}>Valores</div>
              <div style={inlineHint}>Informe preços e custos (R$)</div>
            </div>
            <div style={divider} />

            <div style={grid3}>
              <div style={formStyles.field}>
                <label style={labelSmall}>Preço de Referência</label>
                <input
                  name="preco_referencia"
                  inputMode="numeric"
                  value={moneyDigitsToBRL(form.preco_referencia)}
                  onChange={handleChange}
                  style={{ ...formStyles.input, textAlign: "right" }}
                  placeholder="R$ 0,00"
                />
              </div>

              <div style={formStyles.field}>
                <label style={labelSmall}>Custo Médio</label>
                <input
                  name="custo_medio"
                  inputMode="numeric"
                  value={moneyDigitsToBRL(form.custo_medio)}
                  onChange={handleChange}
                  style={{ ...formStyles.input, textAlign: "right" }}
                  placeholder="R$ 0,00"
                />
              </div>

              <div style={formStyles.field}>
                <label style={labelSmall}>Último Custo</label>
                <input
                  name="ult_custo"
                  inputMode="numeric"
                  value={moneyDigitsToBRL(form.ult_custo)}
                  onChange={handleChange}
                  style={{ ...formStyles.input, textAlign: "right" }}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
          </div>

          {/* ===== Complementos ===== */}
          <div style={sectionCard}>
            <div style={sectionHeaderRow}>
              <div style={sectionTitle}>Complementos</div>
              <div style={inlineHint}>Status e parâmetros operacionais</div>
            </div>
            <div style={divider} />

            <div style={grid3}>
              <div style={formStyles.field}>
                <label style={labelSmall}>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={formStyles.select}
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>

              <div style={formStyles.field}>
                <label style={labelSmall}>Estoque mínimo</label>
                <input
                  name="estoque_min"
                  inputMode="numeric"
                  value={form.estoque_min}
                  onChange={handleChange}
                  style={formStyles.input}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* ===== Actions fixas no rodapé ===== */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: 12,
              borderTop: "1px solid #eef2f7",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              background: "#fff",
            }}
          >
            <button
              type="button"
              style={buttonStyles.link}
              onClick={() => navigate("/produtos")}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={buttonStyles.primary}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}