import React, { useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

export default function FormaPagamentoCreate() {
  const navigate = useNavigate();

  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [permiteParcelamento, setPermiteParcelamento] = useState(true);
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!descricao.trim()) {
      toast.warning("Informe a descrição.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/formas-pagamento", {
        descricao: descricao.trim(),
        ativo,
        permite_parcelamento: permiteParcelamento,
        observacao: observacao.trim() || null,
      });

      toast.success("Forma de pagamento cadastrada com sucesso!");
      navigate("/formas-pagamento");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error || "Erro ao cadastrar forma de pagamento"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Nova Forma de Pagamento</h1>
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
              placeholder="Ex.: PIX"
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
              placeholder="Observações adicionais"
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