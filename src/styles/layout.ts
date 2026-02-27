// src/styles/layout.ts
import type { CSSProperties } from "react";
import { theme } from "./theme";

export const layoutStyles: {
  page: CSSProperties;
  header: CSSProperties;
  card: CSSProperties;
  cardCompact: CSSProperties;
  title: CSSProperties;
  subtitle: CSSProperties;
  content: CSSProperties;
} = {
page: {
  display: "flex",
  flexDirection: "column",
  padding: "24px",
  backgroundColor: theme.colors.background,
  boxSizing: "border-box",
  width: "100%",
},
  
  content: {
    flex: 1,
    minHeight: 0,     // 🔥 essencial
    overflowY: 'auto',
    paddingRight: 6,
  },

  header: {
    display: "flex",
    alignItems: "flex-start", // ✅ melhor quando tem subtítulo
    justifyContent: "space-between",
    width: "100%",
    flexShrink: 0,

    // ✅ pequeno respiro
    padding: "4px 0",
  },

  card: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadow.sm,
    overflowY: 'auto',
  },

  cardCompact: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: "14px 16px",
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadow.sm,
  },

  title: {
    fontSize: 24,
    fontWeight: 800,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: 700,
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
};