import { theme } from "./theme";

export const tableStyles = {
  table: {
    width: "100%",
    borderCollapse: "separate" as const,
    borderSpacing: 0,
    tableLayout: "fixed" as const,
  },

  thead: {
    background: "#f8fafc",
  },

  th: {
    textAlign: "left" as const,
    fontSize: "12px",
    fontWeight: 800,
    color: theme.colors.textSecondary,
    padding: "12px 14px",
    borderBottom: `1px solid ${theme.colors.border}`,
    letterSpacing: "0.02em",
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap" as const,
  },

  td: {
    padding: "12px 14px",
    borderBottom: `1px solid ${theme.colors.border}`,
    fontSize: "14px",
    color: theme.colors.textPrimary,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    verticalAlign: "top" as const,
  },

  // ✅ use no <tr style={...}>
  row: (index: number): React.CSSProperties => ({
    background: index % 2 === 0 ? "#ffffff" : "#fbfdff",
    transition: "background .15s ease",
  }),

  // ✅ use no <tr onMouseEnter/onMouseLeave> se quiser
  rowHover: {
    background: "rgba(37, 99, 235, 0.06)",
  },

  // ✅ opcional: célula alinhada à direita (valores)
  tdRight: {
    textAlign: "right" as const,
    fontVariantNumeric: "tabular-nums" as const,
  },

  // ✅ opcional: colunas com quebra (nome/grupo/subgrupo)
  tdWrap: {
    whiteSpace: "normal" as const,
    wordBreak: "break-word" as const,
    overflow: "visible",
    textOverflow: "clip",
    lineHeight: 1.35,
  },
};