import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { formStyles } from "../../styles/form";
import api from "../../api/api";

import { maskCNPJ, maskCEP, maskTelefone } from "../../utils/masks";
import { toast } from "react-toastify";

/* =========================
   Types
========================= */
type OrgaoForm = {
  nome: string;
  cnpj: string;
  tipo: string;
  esfera: "MUNICIPAL" | "ESTADUAL" | "FEDERAL";

  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;

  telefone: string;
  email_oficial: string;

  responsavel: string;
  cargo_responsavel: string;
};

/* =========================
   Section styles (padrão)
========================= */
const sectionStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 20,
  marginBottom: 16,
  backgroundColor: "#ffffff",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 12,
  color: "#111827",
};

const dividerStyle: React.CSSProperties = {
  height: 1,
  backgroundColor: "#e5e7eb",
  marginBottom: 20,
};

/* =========================
   Responsive grids
========================= */
const grid3 = (c3 = "240px"): React.CSSProperties => ({
  display: "grid",
  gridTemplateColumns: `minmax(240px, 1fr) minmax(240px, 1fr) minmax(${c3}, ${c3})`,
  gap: 16,
  alignItems: "end",
});

const grid4Address: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(280px, 1.6fr) minmax(120px, 0.5fr) minmax(120px, 0.45fr) minmax(170px, 0.6fr)",
  gap: 16,
  alignItems: "end",
};

const grid3City: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(220px, 1fr) minmax(220px, 1fr) minmax(120px, 140px)",
  gap: 16,
  alignItems: "end",
};

const grid2 = (c2 = "1fr"): React.CSSProperties => ({
  display: "grid",
  gridTemplateColumns: `minmax(240px, 1fr) minmax(240px, ${c2})`,
  gap: 16,
  alignItems: "end",
});

const responsiveWrap: React.CSSProperties = {
  width: "100%",
};

/* =========================
   Component
========================= */
export default function OrgaoCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<OrgaoForm>({
    nome: "",
    cnpj: "",
    tipo: "",
    esfera: "MUNICIPAL",

    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",

    telefone: "",
    email_oficial: "",

    responsavel: "",
    cargo_responsavel: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "cnpj") newValue = maskCNPJ(value);
    if (name === "cep") newValue = maskCEP(value);
    if (name === "telefone") newValue = maskTelefone(value);

    setForm((prev) => ({ ...prev, [name]: newValue }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/orgaocontratante", form);
      toast.success("Órgão contratante cadastrado com sucesso");
      navigate("/orgaos");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar órgão contratante");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Novo Órgão Contratante</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Cadastre os dados para vincular contratos e acompanhar a execução.
          </div>
        </div>
      </div>

      <div style={layoutStyles.card}>
        <form onSubmit={handleSubmit} style={formStyles.form}>
          {/* ===== Dados do Órgão ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Dados do Órgão</div>
            <div style={dividerStyle} />

            <div style={formStyles.field}>
              <label style={formStyles.label}>Nome do Órgão</label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                style={formStyles.input}
                required
              />
            </div>

            {/* CNPJ / Tipo / Esfera */}
            <div style={{ ...responsiveWrap, ...grid3("220px") }}>
              <div style={formStyles.field}>
                <label style={formStyles.label}>CNPJ</label>
                <input
                  name="cnpj"
                  value={form.cnpj}
                  onChange={handleChange}
                  style={formStyles.input}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>Tipo</label>
                <input
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  style={formStyles.input}
                  placeholder="Prefeitura, Secretaria, Fundação..."
                  required
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>Esfera</label>
                <select
                  name="esfera"
                  value={form.esfera}
                  onChange={handleChange}
                  style={formStyles.select}
                  required
                >
                  <option value="MUNICIPAL">Municipal</option>
                  <option value="ESTADUAL">Estadual</option>
                  <option value="FEDERAL">Federal</option>
                </select>
              </div>
            </div>
          </div>

          {/* ===== Endereço ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Endereço</div>
            <div style={dividerStyle} />

            {/* Logradouro / Número / UF / CEP */}
            <div style={{ ...responsiveWrap, ...grid4Address }}>
              <div style={formStyles.field}>
                <label style={formStyles.label}>Logradouro</label>
                <input
                  name="logradouro"
                  value={form.logradouro}
                  onChange={handleChange}
                  style={formStyles.input}
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>Número</label>
                <input
                  name="numero"
                  value={form.numero}
                  onChange={handleChange}
                  style={formStyles.input}
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>UF</label>
                <input
                  name="estado"
                  value={form.estado}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      estado: e.target.value.toUpperCase().slice(0, 2),
                    }))
                  }
                  style={formStyles.input}
                  maxLength={2}
                  placeholder="CE"
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>CEP</label>
                <input
                  name="cep"
                  value={form.cep}
                  onChange={handleChange}
                  style={formStyles.input}
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div style={formStyles.field}>
              <label style={formStyles.label}>Complemento</label>
              <input
                name="complemento"
                value={form.complemento}
                onChange={handleChange}
                style={formStyles.input}
              />
            </div>

            {/* Bairro / Cidade */}
            <div style={{ ...responsiveWrap, ...grid3City }}>
              <div style={formStyles.field}>
                <label style={formStyles.label}>Bairro</label>
                <input
                  name="bairro"
                  value={form.bairro}
                  onChange={handleChange}
                  style={formStyles.input}
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>Cidade</label>
                <input
                  name="cidade"
                  value={form.cidade}
                  onChange={handleChange}
                  style={formStyles.input}
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>—</label>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  (auto)
                </div>
              </div>
            </div>
          </div>

          {/* ===== Contato ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Contato</div>
            <div style={dividerStyle} />

            <div style={{ ...responsiveWrap, ...grid2("1.4fr") }}>
              <div style={formStyles.field}>
                <label style={formStyles.label}>Telefone</label>
                <input
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                  style={formStyles.input}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>E-mail Oficial</label>
                <input
                  name="email_oficial"
                  type="email"
                  value={form.email_oficial}
                  onChange={handleChange}
                  style={formStyles.input}
                  placeholder="contato@orgao.gov.br"
                />
              </div>
            </div>
          </div>

          {/* ===== Responsável ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Responsável</div>
            <div style={dividerStyle} />

            <div style={{ ...responsiveWrap, ...grid2("1.2fr") }}>
              <div style={formStyles.field}>
                <label style={formStyles.label}>Nome</label>
                <input
                  name="responsavel"
                  value={form.responsavel}
                  onChange={handleChange}
                  style={formStyles.input}
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>Cargo</label>
                <input
                  name="cargo_responsavel"
                  value={form.cargo_responsavel}
                  onChange={handleChange}
                  style={formStyles.input}
                />
              </div>
            </div>
          </div>

          {/* ===== Actions ===== */}
          <div style={formStyles.actions}>
            <button type="submit" style={buttonStyles.primary} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </button>

            <button
              type="button"
              style={buttonStyles.link}
              onClick={() => navigate("/orgaos")}
            >
              Cancelar
            </button>
          </div>

          {/* Mobile responsiveness (sem mexer no CSS global) */}
          <style>
            {`
              @media (max-width: 980px) {
                .grid3, .grid4, .grid3city, .grid2 { grid-template-columns: 1fr !important; }
              }
            `}
          </style>
        </form>
      </div>
    </div>
  );
}