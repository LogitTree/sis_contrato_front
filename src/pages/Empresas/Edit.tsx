import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { formStyles } from "../../styles/form";
import api from "../../api/api";

import { maskCNPJ, maskCEP, maskTelefone } from "../../utils/masks";
import { toast } from "react-toastify";
import { fieldFocusHandlers } from "../../styles/focus";

/* =========================
   Types
========================= */
type EmpresaForm = {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual: string;
  inscricao_municipal: string;

  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;

  telefone: string;
  email: string;

  responsavel_legal: string;
  cargo_responsavel: string;

  status: "ATIVA" | "INATIVA";
};

/* =========================
   Card Section (padrão SaaS)
========================= */
function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 18,
        background: "#ffffff",
        boxShadow: "0 1px 2px rgba(16,24,40,.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>
          {title}
        </h3>
      </div>

      <div style={{ height: 1, background: "#e5e7eb", marginBottom: 14 }} />

      {children}
    </div>
  );
}

export default function EmpresaEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState<EmpresaForm>({
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    inscricao_estadual: "",
    inscricao_municipal: "",

    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",

    telefone: "",
    email: "",

    responsavel_legal: "",
    cargo_responsavel: "",

    status: "ATIVA",
  });

  /* =========================
     Load Empresa
  ========================= */
  useEffect(() => {
    async function loadEmpresa() {
      try {
        const response = await api.get(`/empresas/${id}`);
        setForm(response.data);
      } catch (error) {
        console.error("Erro ao carregar empresa", error);
        toast.error("Erro ao carregar empresa");
        navigate("/empresas");
      } finally {
        setLoadingData(false);
      }
    }

    loadEmpresa();
  }, [id, navigate]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
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
      await api.put(`/empresas/${id}`, form);
      toast.success("Empresa atualizada com sucesso");
      navigate("/empresas");
    } catch {
      toast.error("Erro ao atualizar empresa");
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div style={layoutStyles.page}>
        <div style={layoutStyles.header}>
          <h1 style={layoutStyles.title}>Editar Empresa</h1>
        </div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Editar Empresa</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Atualize as informações cadastrais e salve.
          </div>
        </div>
      </div>

      <div style={layoutStyles.card}>
        <form onSubmit={handleSubmit} style={formStyles.form}>
          {/* ===== Dados da Empresa ===== */}
          <FormSection title="Dados da Empresa">
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div style={formStyles.field}>
                <label style={formStyles.label}>Razão Social</label>
                <input
                  name="razao_social"
                  value={form.razao_social}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                  required
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>Nome Fantasia</label>
                <input
                  name="nome_fantasia"
                  value={form.nome_fantasia}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                  required
                />
              </div>
            </div>
          </FormSection>

          {/* ===== Documentos ===== */}
          <FormSection title="Documentos">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
              <div style={{ ...formStyles.field, gridColumn: "span 4" }}>
                <label style={formStyles.label}>CNPJ</label>
                <input
                  name="cnpj"
                  value={form.cnpj}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>

              <div style={{ ...formStyles.field, gridColumn: "span 4" }}>
                <label style={formStyles.label}>Inscrição Estadual</label>
                <input
                  name="inscricao_estadual"
                  value={form.inscricao_estadual}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                />
              </div>

              <div style={{ ...formStyles.field, gridColumn: "span 4" }}>
                <label style={formStyles.label}>Inscrição Municipal</label>
                <input
                  name="inscricao_municipal"
                  value={form.inscricao_municipal}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                />
              </div>
            </div>
          </FormSection>

          {/* ===== Endereço ===== */}
          <FormSection title="Endereço">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
              <div style={{ ...formStyles.field, gridColumn: "span 6" }}>
                <label style={formStyles.label}>Logradouro</label>
                <input
                  name="logradouro"
                  value={form.logradouro}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                />
              </div>

              <div style={{ ...formStyles.field, gridColumn: "span 2" }}>
                <label style={formStyles.label}>Número</label>
                <input
                  name="numero"
                  value={form.numero}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                />
              </div>

              <div style={{ ...formStyles.field, gridColumn: "span 4" }}>
                <label style={formStyles.label}>Complemento</label>
                <input
                  name="complemento"
                  value={form.complemento}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                />
              </div>

              <div style={{ ...formStyles.field, gridColumn: "span 4" }}>
                <label style={formStyles.label}>Bairro</label>
                <input
                  name="bairro"
                  value={form.bairro}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                />
              </div>

              <div style={{ ...formStyles.field, gridColumn: "span 4" }}>
                <label style={formStyles.label}>Cidade</label>
                <input
                  name="cidade"
                  value={form.cidade}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                />
              </div>

              <div style={{ ...formStyles.field, gridColumn: "span 2" }}>
                <label style={formStyles.label}>Estado</label>
                <input
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                  maxLength={2}
                  placeholder="UF"
                />
              </div>

              <div style={{ ...formStyles.field, gridColumn: "span 2" }}>
                <label style={formStyles.label}>CEP</label>
                <input
                  name="cep"
                  value={form.cep}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </FormSection>

          {/* ===== Contato ===== */}
          <FormSection title="Contato">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
              <div style={{ ...formStyles.field, gridColumn: "span 4" }}>
                <label style={formStyles.label}>Telefone</label>
                <input
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div style={{ ...formStyles.field, gridColumn: "span 8" }}>
                <label style={formStyles.label}>E-mail</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                />
              </div>
            </div>
          </FormSection>

          {/* ===== Responsável Legal + Status ===== */}
          <FormSection title="Responsável Legal">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
              <div style={{ ...formStyles.field, gridColumn: "span 5" }}>
                <label style={formStyles.label}>Nome</label>
                <input
                  name="responsavel_legal"
                  value={form.responsavel_legal}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                />
              </div>

              <div style={{ ...formStyles.field, gridColumn: "span 4" }}>
                <label style={formStyles.label}>Cargo</label>
                <input
                  name="cargo_responsavel"
                  value={form.cargo_responsavel}
                  onChange={handleChange}
                  style={formStyles.input}
                  {...fieldFocusHandlers}
                />
              </div>

              <div style={{ ...formStyles.field, gridColumn: "span 3" }}>
                <label style={formStyles.label}>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={formStyles.select}
                  {...fieldFocusHandlers}
                >
                  <option value="ATIVA">Ativa</option>
                  <option value="INATIVA">Inativa</option>
                </select>
              </div>
            </div>
          </FormSection>

          {/* ===== Actions (barra inferior padrão) ===== */}
          <div style={formStyles.actionsBar}>
            <button
              type="button"
              style={buttonStyles.secondary}
              onClick={() => navigate("/empresas")}
              disabled={loading}
            >
              Cancelar
            </button>

            <button type="submit" style={buttonStyles.primary} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}