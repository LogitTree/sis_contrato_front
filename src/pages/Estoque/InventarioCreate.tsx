import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSave } from "react-icons/fi";
import { toast } from "react-toastify";

import api from "../../api/api";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

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
          limit: 500,
          ativo: true,
          orderBy: "descricao",
          orderDir: "ASC",
        },
      });

      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setMotivos(rows);
    } catch (error) {
      console.error(error);
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

      await api.post("/inventario", {
        data_inventario: form.data_inventario,
        motivo_id: Number(form.motivo_id),
        observacao: form.observacao.trim() || null,
      });

      toast.success("Inventário criado com sucesso");

      navigate("/estoque/inventario");
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.error ||
          "Erro ao criar inventário"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Novo Inventário"
        subtitle="Abra um inventário para conferência e ajuste posterior do estoque."
        action={
          <button
            type="button"
            style={buttonStyles.secondary}
            onClick={() => navigate("/estoque/inventario")}
          >
            Voltar
          </button>
        }
      />

      <DataCard
        title="Dados do inventário"
        subtitle="Informe os dados iniciais para abertura do inventário."
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label style={labelStyle}>
                Data do inventário
              </label>

              <input
                type="date"
                value={form.data_inventario}
                onChange={(e) =>
                  updateField(
                    "data_inventario",
                    e.target.value
                  )
                }
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Motivo
              </label>

              <select
                value={form.motivo_id}
                onChange={(e) =>
                  updateField("motivo_id", e.target.value)
                }
                disabled={loadingMotivos}
                style={fieldStyle}
              >
                <option value="">
                  {loadingMotivos
                    ? "Carregando..."
                    : "Selecione"}
                </option>

                {motivos.map((motivo) => (
                  <option
                    key={motivo.id}
                    value={motivo.id}
                  >
                    {motivo.descricao}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>
              Observação
            </label>

            <textarea
              value={form.observacao}
              onChange={(e) =>
                updateField(
                  "observacao",
                  e.target.value
                )
              }
              placeholder="Observações gerais do inventário"
              style={{
                ...fieldStyle,
                height: 100,
                resize: "vertical",
                paddingTop: 10,
              }}
            />
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="submit"
              style={buttonStyles.primary}
              disabled={loading}
            >
              <FiSave size={15} />

              {loading
                ? " Salvando..."
                : " Criar inventário"}
            </button>
          </div>
        </form>
      </DataCard>
    </PageShell>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 800,
  color: "#374151",
  marginBottom: 6,
};

const fieldStyle: React.CSSProperties = {
  ...filterStyles.input,
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  height: 40,
};