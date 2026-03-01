import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

import { layoutStyles } from "../../styles/layout";
import { filterStyles } from "../../styles/filters";
import { buttonStyles } from "../../styles/buttons";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const emailRef = useRef<HTMLInputElement | null>(null);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => emailRef.current?.focus(), 50);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, senha);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || "E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  const wrapperStyle: React.CSSProperties = {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    background: "#f6f7fb", // ✅ padrão mais “sistema”
  };

  const cardStyle: React.CSSProperties = {
    width: 420,
    maxWidth: "100%",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 20px 45px rgba(0,0,0,0.10)",
    border: "1px solid #eef2f7",
    overflow: "hidden",
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: "18px 20px",
    borderBottom: "1px solid #eef2f7",
    background: "#ffffff",
  };

  const cardBodyStyle: React.CSSProperties = {
    padding: 20,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: -0.2,
  };

  const subtitleStyle: React.CSSProperties = {
    margin: "6px 0 0",
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
  };

  const errorBoxStyle: React.CSSProperties = {
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#9f1239",
    fontSize: 13,
    fontWeight: 700,
  };

  return (
    <div style={wrapperStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        {/* Header do card (padrão sistema) */}
        <div style={cardHeaderStyle}>
          <div style={titleStyle}>Acesso ao Sistema</div>
          <div style={subtitleStyle}>Informe suas credenciais para continuar</div>
        </div>

        <div style={cardBodyStyle}>
          {/* Erro */}
          {error && <div style={errorBoxStyle}>{error}</div>}

          {/* Campos */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={labelStyle}>E-mail</label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                autoComplete="email"
                style={{
                  ...filterStyles.input,
                  height: 40,
                  padding: "0 12px",
                  boxSizing: "border-box",
                  width: "100%",
                }}
                disabled={loading}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={labelStyle}>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  ...filterStyles.input,
                  height: 40,
                  padding: "0 12px",
                  boxSizing: "border-box",
                  width: "100%",
                }}
                disabled={loading}
              />
            </div>

            {/* Botão */}
            <button
              type="submit"
              style={{
                ...buttonStyles.primary,
                height: 40,
                padding: "0 14px",
                width: "100%",
                opacity: loading ? 0.8 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            {/* Rodapé do card */}
            <div style={{ marginTop: 6, textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
              © {new Date().getFullYear()} • Sistema de Contratos
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}