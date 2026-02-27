import type { CSSProperties } from "react";
import { theme } from "./theme";

export const formStyles: {
  form: CSSProperties;
  field: CSSProperties;
  row: CSSProperties;
  label: CSSProperties;
  hint: CSSProperties;
  input: CSSProperties;
  select: CSSProperties;
  textarea: CSSProperties;
  actions: CSSProperties;
  actionsBar: CSSProperties;
} = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16, // ✅ mais compacto e moderno
    flex: 1,
    overflowY: "auto",
    width: "100%",
    paddingRight: 6, // ✅ evita “cortar” scrollbar
    minHeight: 0, 
  },

  row: {
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gap: 12,
  },

  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    minWidth: 0,
  },

  label: {
    fontSize: 12,
    fontWeight: 800,
    color: "#374151",
    letterSpacing: 0.2,
  },

  hint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: -2,
  },

  input: {
    height: 38,
    padding: "0 12px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    fontSize: 14,
    color: theme.colors.textPrimary,
    outline: "none",
    background: "#ffffff",
    transition: "border-color .15s ease, box-shadow .15s ease",
    boxSizing: "border-box",
  },

  select: {
    height: 38,
    padding: "0 12px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    fontSize: 14,
    color: theme.colors.textPrimary,
    outline: "none",
    background: "#ffffff",
    transition: "border-color .15s ease, box-shadow .15s ease",
    boxSizing: "border-box",
  },

  textarea: {
    padding: "10px 12px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: "#ffffff",
    color: theme.colors.textPrimary,
    fontSize: 14,
    resize: "vertical" as const,
    minHeight: 92,
    outline: "none",
    transition: "border-color .15s ease, box-shadow .15s ease",
    boxSizing: "border-box",
  },

  actions: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },

  // ✅ padrão “SaaS”: barra inferior com ações
  actionsBar: {
    marginTop: "auto",
    paddingTop: 12,
    borderTop: `1px solid ${theme.colors.border}`,
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    background: "#fff",
  },
};