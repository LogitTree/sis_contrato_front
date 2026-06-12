import { useState } from "react";
import { FiKey, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

import { buttonStyles } from "../../../styles/buttons";

import type { UsuarioSistema } from "../../../services/controleacesso/usuarioService";
import { alterarSenhaUsuario } from "../../../services/controleacesso/usuarioService";

type Props = {
  isOpen: boolean;
  usuario: UsuarioSistema | null;
  onClose: () => void;
};

export default function UsuarioSenhaModal({
  isOpen,
  usuario,
  onClose,
}: Props) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [loading, setLoading] = useState(false);

  async function salvar() {
    if (!usuario?.id) return;

    if (!senha) {
      return toast.error("Informe a nova senha.");
    }

    if (senha.length < 6) {
      return toast.error(
        "A senha deve possuir pelo menos 6 caracteres."
      );
    }

    if (senha !== confirmacao) {
      return toast.error("As senhas não conferem.");
    }

    try {
      setLoading(true);

      await alterarSenhaUsuario(
        usuario.id,
        senha
      );

      toast.success("Senha alterada com sucesso.");

      setSenha("");
      setConfirmacao("");

      onClose();
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.error ||
          "Erro ao alterar senha."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !usuario) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <div style={titleStyle}>
              Alterar Senha
            </div>

            <div style={subtitleStyle}>
              {usuario.nome}
            </div>
          </div>

          <button
            onClick={onClose}
            style={closeButtonStyle}
          >
            <FiX size={16} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={fieldContainer}>
            <label>Nova senha</label>

            <input
              type="password"
              value={senha}
              onChange={(e) =>
                setSenha(e.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div
            style={{
              ...fieldContainer,
              marginTop: 12,
            }}
          >
            <label>Confirmar senha</label>

            <input
              type="password"
              value={confirmacao}
              onChange={(e) =>
                setConfirmacao(e.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <button
              style={buttonStyles.secondary}
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              style={buttonStyles.primary}
              onClick={salvar}
              disabled={loading}
            >
              <FiKey size={15} />
              {loading
                ? " Salvando..."
                : " Alterar senha"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  width: 480,
  background: "#fff",
  borderRadius: 20,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  padding: 20,
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
};

const titleStyle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 18,
};

const subtitleStyle: React.CSSProperties = {
  marginTop: 4,
  color: "#64748b",
};

const closeButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
};

const fieldContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const inputStyle: React.CSSProperties = {
  height: 42,
  borderRadius: 12,
  border: "1px solid #d1d5db",
  padding: "0 12px",
};