import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSave } from "react-icons/fi";
import { toast } from "react-toastify";

import api from "../../api/api";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

type GrupoForm = {
  nome: string;
  ativo: boolean;
};

export default function GrupoCreate() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<GrupoForm>({
    nome: "",
    ativo: true,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "ativo" ? value === "true" : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nome.trim()) {
      toast.error("Informe o nome do grupo.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/grupos", {
        ...form,
        nome: form.nome.trim(),
      });

      toast.success("Grupo cadastrado com sucesso");
      navigate("/grupos");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao salvar grupo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Novo Grupo"
        subtitle="Cadastre um novo grupo para organização dos produtos."
        action={
          <button
            type="button"
            style={buttonStyles.secondary}
            onClick={() => navigate("/grupos")}
            disabled={loading}
          >
            Voltar
          </button>
        }
      />

      <DataCard
        title="Dados do grupo"
        subtitle="Informe o nome e a situação inicial do grupo."
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label style={labelStyle}>Nome</label>

              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                style={fieldStyle}
                placeholder="Ex: Material de Limpeza"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label style={labelStyle}>Status</label>

              <select
                name="ativo"
                value={String(form.ativo)}
                onChange={handleChange}
                style={fieldStyle}
                disabled={loading}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <button
              type="button"
              style={buttonStyles.secondary}
              onClick={() => navigate("/grupos")}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={buttonStyles.primary}
              disabled={loading || !form.nome.trim()}
            >
              <FiSave size={15} /> {loading ? "Salvando..." : "Salvar grupo"}
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