import { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

export default function FornecedorEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const fornecedorId = Number(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [observacao, setObservacao] = useState("");

  async function carregar() {
    if (!fornecedorId) {
      toast.error("ID inválido");
      navigate("/fornecedores");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/fornecedores/${fornecedorId}`);
      const f = res.data?.data ?? res.data;

      setNome(f?.nome ?? "");
      setDocumento(f?.documento ?? "");
      setTelefone(f?.telefone ?? "");
      setEmail(f?.email ?? "");
      setAtivo(f?.ativo !== false);
      setObservacao(f?.observacao ?? "");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao carregar fornecedor");
      navigate("/fornecedores");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvar() {
    if (!nome.trim()) {
      toast.error("Informe o nome do fornecedor");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/fornecedores/${fornecedorId}`, {
        nome: nome.trim(),
        documento: documento.trim() || null,
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        ativo,
        observacao: observacao.trim() || null,
      });

      toast.success("Fornecedor atualizado!");
      navigate("/fornecedores");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao atualizar fornecedor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Editar Fornecedor</h1>
      </div>

      <div style={layoutStyles.card}>
        {loading ? (
          <div style={{ padding: 12, color: "#64748b" }}>Carregando...</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 320 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>Nome *</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  style={{ ...filterStyles.input, height: 40, padding: "0 12px" }}
                  disabled={saving}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 260 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>Documento (CPF/CNPJ)</label>
                <input
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  style={{ ...filterStyles.input, height: 40, padding: "0 12px" }}
                  disabled={saving}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 220 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>Telefone</label>
                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  style={{ ...filterStyles.input, height: 40, padding: "0 12px" }}
                  disabled={saving}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 320 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ ...filterStyles.input, height: 40, padding: "0 12px" }}
                  disabled={saving}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 200 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>Status</label>
                <select
                  value={String(ativo)}
                  onChange={(e) => setAtivo(e.target.value === "true")}
                  style={{ ...filterStyles.select, height: 40, padding: "0 12px" }}
                  disabled={saving}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>Observação</label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  style={{ ...filterStyles.input, height: 110, padding: "10px 12px", resize: "vertical" }}
                  disabled={saving}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button style={buttonStyles.link} onClick={() => navigate(-1)} disabled={saving}>
                Cancelar
              </button>
              <button style={buttonStyles.primary} onClick={salvar} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}