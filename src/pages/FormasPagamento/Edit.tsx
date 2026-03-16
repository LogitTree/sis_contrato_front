import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

export default function FormaPagamentoEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [permiteParcelamento, setPermiteParcelamento] = useState(true);
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const { data } = await api.get(`/formas-pagamento/${id}`);
      setDescricao(data?.descricao || "");
      setAtivo(!!data?.ativo);
      setPermiteParcelamento(!!data?.permite_parcelamento);
      setObservacao(data?.observacao || "");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error || "Erro ao carregar forma de pagamento"
      );
      navigate("/formas-pagamento");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!descricao.trim()) {
      toast.warning("Informe a descrição.");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/formas-pagamento/${id}`, {
        descricao: descricao.trim(),
        ativo,
        permite_parcelamento: permiteParcelamento,
        observacao: observacao.trim() || null,
      });

      toast.success("Forma de pagamento atualizada com sucesso!");
      navigate("/formas-pagamento");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error || "Erro ao atualizar forma de pagamento"
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [id]);

  if (loading) {
    return (
      <div style={layoutStyles.page}>
        <div style={layoutStyles.card}>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Editar Forma de Pagamento</h1>
      </div>

      <form onSubmit={handleSubmit} style={layoutStyles.card}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Descrição
            </label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              style={{ ...filterStyles.input, height: 40, padding: "0 12px", marginTop: 6 }}
              disabled={saving}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Situação
            </label>
            <select
              value={String(ativo)}
              onChange={(e) => setAtivo(e.target.value === "true")}
              style={{ ...filterStyles.select, height: 40, padding: "0 12px", marginTop: 6 }}
              disabled={saving}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Permite parcelamento
            </label>
            <select
              value={String(permiteParcelamento)}
              onChange={(e) => setPermiteParcelamento(e.target.value === "true")}
              style={{ ...filterStyles.select, height: 40, padding: "0 12px", marginTop: 6 }}
              disabled={saving}
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Observação
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              style={{
                ...filterStyles.input,
                minHeight: 100,
                padding: 12,
                marginTop: 6,
                resize: "vertical",
              }}
              disabled={saving}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            style={buttonStyles.link}
            onClick={() => navigate("/formas-pagamento")}
            disabled={saving}
          >
            Voltar
          </button>

          <button type="submit" style={buttonStyles.primary} disabled={saving}>
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}