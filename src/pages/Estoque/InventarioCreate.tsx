import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/api";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { fieldFocusHandlers } from "../../styles/focus";

type Motivo = {
  id: number;
  descricao: string;
};

export default function InventarioCreate() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingMotivos, setLoadingMotivos] = useState(false);
  const [motivos, setMotivos] = useState<Motivo[]>([]);

  const [form, setForm] = useState({
    data_inventario: new Date().toISOString().slice(0, 10),
    motivo_id: "",
    observacao: "",
  });

  useEffect(() => {
    loadMotivos();
  }, []);

  async function loadMotivos() {
    try {
      setLoadingMotivos(true);

      const { data } = await api.get("/inventario-motivos", {
        params: {
          page: 1,
          limit: 200,
          ativo: true,
          orderBy: "descricao",
          orderDir: "ASC",
        },
      });

      setMotivos(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar motivos");
    } finally {
      setLoadingMotivos(false);
    }
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function validate() {
    if (!form.data_inventario) {
      toast.error("Informe a data do inventário");
      return false;
    }

    if (!form.motivo_id) {
      toast.error("Selecione o motivo");
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const payload = {
        data_inventario: form.data_inventario,
        motivo_id: Number(form.motivo_id),
        observacao: form.observacao.trim() || null,
      };

      await api.post("/inventario", payload);

      toast.success("Inventário criado com sucesso");

      navigate("/estoque/inventario");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao criar inventário");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Novo Inventário</h1>
          <p style={layoutStyles.subtitle}>
            Abra um inventário para conferência e ajuste posterior do estoque.
          </p>
        </div>
      </div>

      <div style={layoutStyles.card}>
        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            <div>
              <label style={styles.label}>Data do inventário *</label>
              <input
                type="date"
                value={form.data_inventario}
                onChange={(e) => updateField("data_inventario", e.target.value)}
                style={styles.input}
                onFocus={fieldFocusHandlers.onFocus}
                onBlur={fieldFocusHandlers.onBlur}
              />
            </div>

            <div>
              <label style={styles.label}>Motivo *</label>
              <select
                value={form.motivo_id}
                onChange={(e) => updateField("motivo_id", e.target.value)}
                style={styles.input}
                disabled={loadingMotivos}
                onFocus={fieldFocusHandlers.onFocus}
                onBlur={fieldFocusHandlers.onBlur}
              >
                <option value="">
                  {loadingMotivos ? "Carregando motivos..." : "Selecione"}
                </option>
                {motivos.map((motivo) => (
                  <option key={motivo.id} value={motivo.id}>
                    {motivo.descricao}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={styles.label}>Observação</label>
            <textarea
              value={form.observacao}
              onChange={(e) => updateField("observacao", e.target.value)}
              rows={5}
              placeholder="Observações gerais do inventário"
              style={styles.textarea}
              onFocus={fieldFocusHandlers.onFocus}
              onBlur={fieldFocusHandlers.onBlur}
            />
          </div>

          <div style={styles.footer}>
            <button
              type="button"
              style={buttonStyles.secondary}
              onClick={() => navigate("/estoque/inventario")}
              disabled={loading}
            >
              Voltar
            </button>

            <button type="submit" style={buttonStyles.primary} disabled={loading}>
              {loading ? "Salvando..." : "Criar inventário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#334155",
  },
  input: {
    width: "100%",
    height: 42,
    borderRadius: 10,
    border: "1px solid #dbe2ea",
    padding: "0 12px",
    background: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #dbe2ea",
    padding: 12,
    background: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
  },
  footer: {
    marginTop: 22,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },
};