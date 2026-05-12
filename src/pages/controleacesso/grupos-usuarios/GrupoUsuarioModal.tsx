import { useEffect, useState } from "react";
import type {
  GrupoUsuario,
  GrupoUsuarioPayload,
} from "../../../services/controleacesso/grupoUsuarioService";
import { buttonStyles } from "../../../styles/buttons";
import { formStyles } from "../../../styles/form";

type Props = {
  isOpen: boolean;
  initialData?: GrupoUsuario | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: GrupoUsuarioPayload) => Promise<void> | void;
};

const initialForm: GrupoUsuarioPayload = {
  nome: "",
  descricao: "",
  status: "ATIVO",
};

export default function GrupoUsuarioModal({
  isOpen,
  initialData,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<GrupoUsuarioPayload>(initialForm);
  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (!isOpen) return;

    setForm(
      initialData
        ? {
            nome: initialData.nome || "",
            descricao: initialData.descricao || "",
            status: initialData.status || "ATIVO",
          }
        : initialForm
    );
  }, [isOpen, initialData]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onSubmit({
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
              {isEdit ? "Editar grupo de usuário" : "Novo grupo de usuário"}
            </h2>
            <p style={subtitleStyle}>
              Defina os grupos que receberão permissões de acesso ao sistema.
            </p>
          </div>

          <button type="button" onClick={onClose} style={closeButtonStyle}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: 22 }}>
            <div style={formStyles.field}>
              <label style={labelStyle}>Nome do grupo</label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                placeholder="Ex.: Administrador"
                style={formStyles.input}
              />
            </div>

            <div style={{ ...formStyles.field, marginTop: 12 }}>
              <label style={labelStyle}>Descrição</label>
              <textarea
                name="descricao"
                value={form.descricao || ""}
                onChange={handleChange}
                placeholder="Descreva a finalidade deste grupo"
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
            <button type="button" onClick={onClose} disabled={loading} style={buttonStyles.link}>
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
  maxWidth: 620,
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