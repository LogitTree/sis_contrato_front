import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

import { layoutStyles } from "../../styles/layout";
import { formStyles } from "../../styles/form";
import { buttonStyles } from "../../styles/buttons";

import { toast } from "react-toastify";

/* =========================
   TYPES
========================= */
type OrgaoOption = {
  id: number;
  nome: string;
};

type EmpresaOption = {
  id: number;
  nome_fantasia?: string;
  razao_social?: string;
};

type ContratoForm = {
  numero: string;
  orgao_id: string;
  empresa_contratada_id: string;
  tipo: string;
  objeto?: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  observacao: string;
};

/* =========================
   HELPERS
========================= */
function extrairArray(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.rows)) return res.rows;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function extrairObjeto(res: any): any {
  if (res?.data) return res.data;
  return res;
}

/* =========================
   COMPONENT
========================= */
export default function ContratoEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [orgaos, setOrgaos] = useState<OrgaoOption[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);

  const [form, setForm] = useState<ContratoForm>({
    numero: "",
    orgao_id: "",
    empresa_contratada_id: "",
    tipo: "COMPRA",
    objeto: "",
    data_inicio: "",
    data_fim: "",
    status: "ATIVO",
    observacao: "",
  });

  /* =========================
     Styles (padrão Produto)
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
    fontWeight: 700,
    marginBottom: 12,
    color: "#111827",
  };

  const dividerStyle: React.CSSProperties = {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 18,
  };

  /* =========================
     LOAD DADOS
  ========================= */
  useEffect(() => {
    async function loadData() {
      setLoadingData(true);

      try {
        const [contratoRes, orgaosRes, empresasRes] = await Promise.all([
          api.get(`/contratos/${id}`),
          api.get("/orgaocontratante", { params: { limit: 1000 } }),
          api.get("/empresas", { params: { limit: 1000 } }),
        ]);

        const contrato = extrairObjeto(contratoRes.data);

        setForm({
          numero: contrato.numero ?? "",
          orgao_id: contrato.orgao ? String(contrato.orgao.id) : "",
          empresa_contratada_id: contrato.empresa ? String(contrato.empresa.id) : "",
          tipo: contrato.tipo ?? "COMPRA",
          objeto: contrato.objeto ?? "",
          data_inicio: contrato.data_inicio ?? "",
          data_fim: contrato.data_fim ?? "",
          status: contrato.status ?? "ATIVO",
          observacao: contrato.observacao ?? "",
        });

        setOrgaos(extrairArray(orgaosRes?.data));
        setEmpresas(extrairArray(empresasRes?.data));
      } catch (error) {
        console.error("🔥 ERRO AO CARREGAR:", error);
        toast.error("Erro ao carregar contrato");
        navigate("/contratos");
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [id, navigate]);

  /* =========================
     HANDLERS
  ========================= */
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/contratos/${id}`, {
        ...form,
        orgao_id: Number(form.orgao_id),
        empresa_contratada_id: Number(form.empresa_contratada_id),
      });

      toast.success("Contrato atualizado com sucesso");
      navigate("/contratos");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar contrato");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     LOADING
  ========================= */
  if (loadingData) {
    return (
      <div style={layoutStyles.page}>
        <div style={layoutStyles.header}>
          <h1 style={layoutStyles.title}>Editar Contrato</h1>
        </div>

        <div style={layoutStyles.card}>
          <p style={{ color: "#0f172a" }}>Carregando dados...</p>
        </div>
      </div>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Editar Contrato</h1>
      </div>

      <div style={layoutStyles.card}>
        <form onSubmit={handleSubmit} style={formStyles.form}>
          {/* ===== Dados do Contrato ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Dados do Contrato</div>
            <div style={dividerStyle} />

            <div style={formStyles.row}>
              <div style={{ ...formStyles.field, flex: 2, minWidth: 260 }}>
                <label style={formStyles.label}>Número</label>
                <input
                  name="numero"
                  value={form.numero}
                  onChange={handleChange}
                  style={formStyles.input}
                  required
                />
              </div>

              <div style={{ ...formStyles.field, flex: 1, minWidth: 180 }}>
                <label style={formStyles.label}>Tipo</label>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  style={formStyles.select}
                >
                  <option value="COMPRA">Compra</option>
                  <option value="SERVICO">Serviço</option>
                  <option value="LOCACAO">Locação</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div style={{ ...formStyles.field, flex: 1, minWidth: 180 }}>
                <label style={formStyles.label}>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={formStyles.select}
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="SUSPENSO">Suspenso</option>
                  <option value="ENCERRADO">Encerrado</option>
                </select>
              </div>
            </div>
          </div>

          {/* ===== Partes ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Partes Envolvidas</div>
            <div style={dividerStyle} />

            <div style={formStyles.row}>
              <div style={{ ...formStyles.field, flex: 1, minWidth: 320 }}>
                <label style={formStyles.label}>Órgão Contratante</label>
                <select
                  name="orgao_id"
                  value={form.orgao_id}
                  onChange={handleChange}
                  style={formStyles.select}
                  required
                >
                  <option value="">Selecione</option>
                  {orgaos.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ ...formStyles.field, flex: 1, minWidth: 320 }}>
                <label style={formStyles.label}>Empresa Contratada</label>
                <select
                  name="empresa_contratada_id"
                  value={form.empresa_contratada_id}
                  onChange={handleChange}
                  style={formStyles.select}
                  required
                >
                  <option value="">Selecione</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={String(e.id)}>
                      {e.nome_fantasia || e.razao_social}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ===== Vigência ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Vigência</div>
            <div style={dividerStyle} />

            <div style={formStyles.row}>
              <div style={{ ...formStyles.field, minWidth: 220 }}>
                <label style={formStyles.label}>Data Início</label>
                <input
                  type="date"
                  name="data_inicio"
                  value={form.data_inicio}
                  onChange={handleChange}
                  style={formStyles.input}
                />
              </div>

              <div style={{ ...formStyles.field, minWidth: 220 }}>
                <label style={formStyles.label}>Data Fim</label>
                <input
                  type="date"
                  name="data_fim"
                  value={form.data_fim}
                  onChange={handleChange}
                  style={formStyles.input}
                />
              </div>
            </div>
          </div>

          {/* ===== Detalhes ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Detalhes</div>
            <div style={dividerStyle} />

            <div style={formStyles.field}>
              <label style={formStyles.label}>Objeto do Contrato</label>
              <textarea
                name="objeto"
                value={form.objeto}
                onChange={handleChange}
                style={formStyles.textarea}
                placeholder="Descreva o objeto do contrato..."
              />
            </div>

            <div style={formStyles.field}>
              <label style={formStyles.label}>Observação</label>
              <textarea
                name="observacao"
                value={form.observacao}
                onChange={handleChange}
                style={formStyles.textarea}
                placeholder="Observações internas..."
              />
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
              onClick={() => navigate("/contratos")}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}