import { useEffect, useState } from "react";

import type {
  AcaoSistema,
  AcaoSistemaPayload,
} from "../../../../services/controleacesso/acaoSistemaService";

import { buttonStyles } from "../../../../styles/buttons";
import { formStyles } from "../../../../styles/form";

type Props = {
  isOpen: boolean;
  initialData?: AcaoSistema | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: AcaoSistemaPayload) => Promise<void> | void;
};

const initialForm: AcaoSistemaPayload = {
  modulo: "",
  nome: "",
  codigo: "",
  descricao: "",
  status: "ATIVO",
};

export default function AcaoSistemaModal({
  isOpen,
  initialData,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<AcaoSistemaPayload>(initialForm);

  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm({
        modulo: initialData.modulo || "",
        nome: initialData.nome || "",
        codigo: initialData.codigo || "",
        descricao: initialData.descricao || "",
        status: initialData.status || "ATIVO",
      });
    } else {
      setForm(initialForm);
    }
  }, [isOpen, initialData]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onSubmit({
      ...form,
      modulo: form.modulo.trim().toUpperCase(),
      codigo: form.codigo.trim().toUpperCase(),
      nome: form.nome.trim(),
      descricao: form.descricao?.trim(),
      status: form.status,
    });
  }

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>
              {isEdit ? "Editar ação do sistema" : "Nova ação do sistema"}
            </h2>
            <p style={subtitleStyle}>
              Cadastre as permissões que serão vinculadas aos grupos de usuário.
            </p>
          </div>

          <button type="button" onClick={onClose} style={closeButtonStyle}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={sectionStyle}>
            <div style={grid2Style}>
              <div style={formStyles.field}>
                <label style={labelStyle}>Módulo</label>
                <input
                  name="modulo"
                  value={form.modulo}
                  onChange={handleChange}
                  required
                  placeholder="Ex.: CONTRATOS"
                  style={formStyles.input}
                />
              </div>

              <div style={formStyles.field}>
                <label style={labelStyle}>Código</label>
                <input
                  name="codigo"
                  value={form.codigo}
                  onChange={handleChange}
                  required
                  placeholder="Ex.: CONTRATO_LISTAR"
                  style={formStyles.input}
                />
              </div>
            </div>

            <div style={{ ...formStyles.field, marginTop: 12 }}>
              <label style={labelStyle}>Nome da ação</label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                placeholder="Ex.: Listar contratos"
                style={formStyles.input}
              />
            </div>

            <div style={{ ...formStyles.field, marginTop: 12 }}>
              <label style={labelStyle}>Descrição</label>
              <textarea
                name="descricao"
                value={form.descricao || ""}
                onChange={handleChange}
                placeholder="Descreva a finalidade desta permissão"
                style={{
                  ...formStyles.input,
                  height: 88,
                  resize: "vertical",
                  paddingTop: 10,
                }}
              />
            </div>

            <div style={{ ...formStyles.field, marginTop: 12, maxWidth: 260 }}>
              <label style={labelStyle}>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={formStyles.select}
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
          </div>

          <div style={footerStyle}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={buttonStyles.link}
            >
              Cancelar
            </button>

            <button type="submit" disabled={loading} style={buttonStyles.primary}>
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 999,
};

const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 720,
  background: "#ffffff",
  borderRadius: 24,
  boxShadow: "0 24px 80px rgba(15, 23, 42, 0.22)",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  padding: "20px 22px",
  borderBottom: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
};

const subtitleStyle: React.CSSProperties = {
  margin: "5px 0 0",
  fontSize: 13,
  color: "#64748b",
};

const closeButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#334155",
  fontSize: 22,
  cursor: "pointer",
};

const sectionStyle: React.CSSProperties = {
  padding: 22,
};

const grid2Style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#374151",
  marginBottom: 6,
};

const footerStyle: React.CSSProperties = {
  padding: "14px 22px",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  background: "#ffffff",
};