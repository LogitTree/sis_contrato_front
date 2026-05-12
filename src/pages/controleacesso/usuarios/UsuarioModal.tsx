import { useEffect, useState } from "react";

import type {
  UsuarioPayload,
  UsuarioSistema,
} from "../../../services/controleacesso/usuarioService";

import type { GrupoUsuario } from "../../../services/controleacesso/grupoUsuarioService";

import { buttonStyles } from "../../../styles/buttons";
import { formStyles } from "../../../styles/form";

type Props = {
  isOpen: boolean;
  initialData?: UsuarioSistema | null;
  grupos: GrupoUsuario[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: UsuarioPayload) => Promise<void> | void;
};

type UsuarioForm = {
  nome: string;
  email: string;
  senha: string;
  status: "ATIVO" | "INATIVO";
  grupo_usuario_id: string;
};

const initialForm: UsuarioForm = {
  nome: "",
  email: "",
  senha: "",
  status: "ATIVO",
  grupo_usuario_id: "",
};

export default function UsuarioModal({
  isOpen,
  initialData,
  grupos,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<UsuarioForm>(initialForm);

  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm({
        nome: initialData.nome || "",
        email: initialData.email || "",
        senha: "",
        status: initialData.status ? "ATIVO" : "INATIVO",
        grupo_usuario_id: initialData.grupo_usuario_id
          ? String(initialData.grupo_usuario_id)
          : "",
      });
    } else {
      setForm(initialForm);
    }
  }, [isOpen, initialData]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: UsuarioPayload = {
      nome: form.nome.trim(),
      status: form.status,
      grupo_usuario_id: Number(form.grupo_usuario_id),
    };

    if (!isEdit) {
      payload.email = form.email.trim();
      payload.senha = form.senha;
    }

    await onSubmit(payload);
  }

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>
              {isEdit ? "Editar usuário" : "Novo usuário"}
            </h2>
            <p style={subtitleStyle}>
              Cadastre usuários e vincule-os a um grupo de permissões.
            </p>
          </div>

          <button type="button" onClick={onClose} style={closeButtonStyle}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: 22 }}>
            <div style={grid2Style}>
              <div style={formStyles.field}>
                <label style={labelStyle}>Nome</label>
                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  placeholder="Nome do usuário"
                  style={formStyles.input}
                />
              </div>

              <div style={formStyles.field}>
                <label style={labelStyle}>Grupo de usuário</label>
                <select
                  name="grupo_usuario_id"
                  value={form.grupo_usuario_id}
                  onChange={handleChange}
                  required
                  style={formStyles.select}
                >
                  <option value="">Selecione</option>

                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ ...grid2Style, marginTop: 12 }}>
              <div style={formStyles.field}>
                <label style={labelStyle}>Email</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required={!isEdit}
                  disabled={isEdit}
                  placeholder="email@dominio.com"
                  style={{
                    ...formStyles.input,
                    opacity: isEdit ? 0.65 : 1,
                  }}
                />
              </div>

              {!isEdit ? (
                <div style={formStyles.field}>
                  <label style={labelStyle}>Senha</label>
                  <input
                    name="senha"
                    type="password"
                    value={form.senha}
                    onChange={handleChange}
                    required
                    placeholder="Senha de acesso"
                    style={formStyles.input}
                  />
                </div>
              ) : (
                <div style={formStyles.field}>
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
              )}
            </div>

            {!isEdit && (
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
            )}
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