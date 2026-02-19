import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { formStyles } from "../../styles/form";
import api from "../../api/api";

import { toast } from "react-toastify";

/* =========================
   Types
========================= */
type Grupo = {
  id: number;
  nome: string;
};

type Subgrupo = {
  id: number;
  nome: string;
};

type ProdutoForm = {
  nome: string;
  descricao: string;
  unidade: string;

  grupo_id: string;
  subgrupo_id: string;

  // ⚠️ agora guardamos DIGITOS (centavos) como string
  // ex: "641" => R$ 6,41
  preco_referencia: string;
  custo_medio: string;
  ult_custo: string;

  ativo: boolean;
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

// "64000" -> "640.00" (SEM milhar, SEM vírgula)
function digitsToDecimalString(digits: string) {
  const d = cleanMoneyDigits(digits);
  if (!d) return "0.00";

  const padded = d.padStart(3, "0"); // garante pelo menos 3 dígitos
  const reais = padded.slice(0, -2);
  const cents = padded.slice(-2);

  return `${Number(reais)}.${cents}`;
}

// converte "641" -> 6.41 (number)
function digitsToReaisNumber(digits: string) {
  const onlyDigits = (digits || "").replace(/\D/g, "");
  if (!onlyDigits) return 0;
  return Number(onlyDigits) / 100;
}

// normaliza valor que vem do backend pro formato "dígitos"
function apiValueToDigits(value: any) {
  if (value === null || value === undefined || value === "") return "";

  // se vier número 6.41 ou string "6.41" / "6,41"
  const str = String(value).trim();

  // remove "R$" e espaços
  const noCurrency = str.replace(/[R$\s]/g, "");

  // troca milhar e decimal pra converter com segurança
  // "1.234,56" -> "1234.56"
  const normalized = noCurrency.replace(/\./g, "").replace(",", ".");

  const n = Number(normalized);
  if (Number.isNaN(n)) {
    // fallback: pega só dígitos
    return str.replace(/\D/g, "");
  }

  // transforma em centavos (dígitos)
  const cents = Math.round(n * 100);
  return String(cents);
}

/* =========================
   Component
========================= */
export default function ProdutoEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [subgrupos, setSubgrupos] = useState<Subgrupo[]>([]);

  const [form, setForm] = useState<ProdutoForm>({
    nome: "",
    descricao: "",
    unidade: "",
    grupo_id: "",
    subgrupo_id: "",
    preco_referencia: "",
    custo_medio: "",
    ult_custo: "",
    ativo: true,
  });

  /* =========================
     Styles (igual Create)
  ========================= */
  const sectionStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    backgroundColor: "#ffffff",
  };

  const sectionStyleStatus = {
    display: "flex",
    alignItems: "end",
    gap: "10px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    backgroundColor: "#ffffff",
  };

  const sectionTitleStyle = {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    color: "#111827",
  };

  const dividerStyle = {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 20,
  };

  /* =========================
     Load Grupos
  ========================= */
  useEffect(() => {
    async function carregarGrupos() {
      try {
        const res = await api.get("/grupos", {
          params: { limit: 1000 },
        });

        setGrupos(res.data.data || []);
      } catch {
        toast.error("Erro ao carregar grupos");
        setGrupos([]);
      }
    }

    carregarGrupos();
  }, []);

  /* =========================
     Load Produto
  ========================= */
  useEffect(() => {
    async function loadProduto() {
      try {
        const response = await api.get(`/produtos/${id}`);
        const data = response.data;

        const grupoId = data.grupo_id ? String(data.grupo_id) : "";

        setForm({
          nome: data.nome ?? "",
          descricao: data.descricao ?? "",
          unidade: data.unidade ?? "",
          grupo_id: grupoId,
          subgrupo_id: data.subgrupo_id ? String(data.subgrupo_id) : "",
          // normaliza pra dígitos (centavos)
          preco_referencia: apiValueToDigits(data.preco_referencia),
          custo_medio: apiValueToDigits(data.custo_medio),
          ult_custo: apiValueToDigits(data.ult_custo),
          ativo: Boolean(data.ativo),
        });

        // ⬇️ carrega subgrupos do grupo atual
        if (grupoId) {
          try {
            const sg = await api.get("/subgrupos", {
              params: { grupo_id: grupoId },
            });

            setSubgrupos(Array.isArray(sg.data) ? sg.data : []);
          } catch {
            setSubgrupos([]);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar produto");
        navigate("/produtos");
      } finally {
        setLoadingData(false);
      }
    }

    loadProduto();
  }, [id, navigate]);

  /* =========================
     Load Subgrupos on Grupo change
  ========================= */
  useEffect(() => {
    if (!form.grupo_id) {
      setSubgrupos([]);
      return;
    }

    api
      .get("/subgrupos", {
        params: { grupo_id: Number(form.grupo_id) },
      })
      .then((res) => {
        setSubgrupos(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        setSubgrupos([]);
      });
  }, [form.grupo_id]);

  /* =========================
     Handlers
  ========================= */
  const moneyFields = new Set(["preco_referencia", "custo_medio", "ult_custo"]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    if (moneyFields.has(name)) {

      const digits = cleanMoneyDigits(value);
      setForm((prev) => ({ ...prev, [name]: digits }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }
  function apiValueToDigits(value: any) {
    if (value === null || value === undefined || value === "") return "";

    const raw = String(value).trim().replace(/[R$\s]/g, "");

    let normalized = raw;

    const hasDot = normalized.includes(".");
    const hasComma = normalized.includes(",");

    if (hasDot && hasComma) {
      // pt-BR com milhar e decimal: "1.234,56" -> "1234.56"
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else if (hasComma && !hasDot) {
      // pt-BR decimal: "640,00" -> "640.00"
      normalized = normalized.replace(",", ".");
    } else {
      // só ponto ou só número: assume ponto como decimal ("640.00") e não remove.
      // "64000" continua "64000"
    }

    const n = Number(normalized);
    if (Number.isNaN(n)) return "";

    return String(Math.round(n * 100)); // "640.00" -> "64000"
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        nome: form.nome,
        descricao: form.descricao,
        unidade: form.unidade,
        grupo_id: form.grupo_id || null,
        subgrupo_id: form.subgrupo_id || null,

        // ✅ ENVIA EM REAIS (decimal), não em dígitos
        // ✅ envia "640.00"
        preco_referencia: digitsToReaisNumber(form.preco_referencia),
        custo_medio: digitsToReaisNumber(form.custo_medio),
        ult_custo: digitsToReaisNumber(form.ult_custo),
        ativo: form.ativo,
      };

      await api.put(`/produtos/${id}`, payload);

      toast.success("Produto atualizado com sucesso");
      navigate("/produtos");
    } catch {
      toast.error("Erro ao atualizar produto");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     Render
  ========================= */
  if (loadingData) {
    return (
      <div style={layoutStyles.page}>
        <div style={layoutStyles.header}>
          <h1 style={layoutStyles.title}>Editar Produto</h1>
        </div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Editar Produto</h1>
      </div>

      <div style={layoutStyles.card}>
        <form onSubmit={handleSubmit} style={formStyles.form}>
          {/* ===== Dados do Produto ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Dados do Produto</div>
            <div style={dividerStyle} />

            <div style={formStyles.field}>
              <label style={formStyles.label}>Nome</label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                style={formStyles.input}
                required
              />
            </div>

            <div style={formStyles.field}>
              <label style={formStyles.label}>Descrição</label>
              <input
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                style={formStyles.input}
              />
            </div>
          </div>

          {/* ===== Classificação ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Classificação</div>
            <div style={dividerStyle} />

            <div style={formStyles.row}>
              <div style={formStyles.field}>
                <label style={formStyles.label}>Grupo</label>
                <select
                  name="grupo_id"
                  value={form.grupo_id}
                  onChange={handleChange}
                  style={formStyles.select}
                >
                  <option value="">Selecione</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>Subgrupo</label>
                <select
                  name="subgrupo_id"
                  value={form.subgrupo_id}
                  onChange={handleChange}
                  disabled={!form.grupo_id}
                  style={{
                    ...formStyles.select,
                    opacity: form.grupo_id ? 1 : 0.6,
                  }}
                >
                  <option value="">Selecione</option>
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
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Valores</div>
            <div style={dividerStyle} />

            <div style={formStyles.row}>
              <div style={formStyles.field}>
                <label style={formStyles.label}>Preço de Referência</label>
                <input
                  name="preco_referencia"
                  inputMode="numeric"
                  value={moneyDigitsToBRL(form.preco_referencia)}
                  onChange={handleChange}
                  style={{ ...formStyles.input, textAlign: "right" }}
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>Custo Médio</label>
                <input
                  name="custo_medio"
                  inputMode="numeric"
                  value={moneyDigitsToBRL(form.custo_medio)}
                  onChange={handleChange}
                  style={{ ...formStyles.input, textAlign: "right" }}
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>Último Custo</label>
                <input
                  name="ult_custo"
                  inputMode="numeric"
                  value={moneyDigitsToBRL(form.ult_custo)}
                  onChange={handleChange}
                  style={{ ...formStyles.input, textAlign: "right" }}
                />
              </div>
            </div>
          </div>

          {/* ===== Status ===== */}
          <div style={sectionStyleStatus}>
            <div>
              <div style={sectionTitleStyle}>Status</div>

              <select
                value={form.ativo ? "ATIVO" : "INATIVO"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    ativo: e.target.value === "ATIVO",
                  }))
                }
                style={formStyles.select}
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>

            <div style={formStyles.field}>
              <label style={formStyles.label}>Estoque minimo</label>
              <input
                name="estoque_min"
                value={form.descricao}
                onChange={handleChange}
                style={formStyles.input}
              />
            </div>

            <div style={formStyles.field}>
              <label style={formStyles.label}>Código de barras</label>
              <input
                name="cod_barra"
                value={form.descricao}
                onChange={handleChange}
                style={formStyles.input}
              />
            </div>
          </div>

          {/* ===== Actions ===== */}
          <div style={formStyles.actions}>
            <button
              type="submit"
              style={buttonStyles.primary}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>

            <button
              type="button"
              style={buttonStyles.link}
              onClick={() => navigate("/produtos")}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
