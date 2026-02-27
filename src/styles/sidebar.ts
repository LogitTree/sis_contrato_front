// src/styles/sidebar.ts
import type { CSSProperties } from "react";
import { theme } from "./theme";

export const sidebarStyles: {
  container: CSSProperties;
  logo: CSSProperties;
  menuItem: CSSProperties;
  activeItem: CSSProperties;
  submenu: CSSProperties;
  submenuItem: CSSProperties;
  activeSubItem: CSSProperties;
  sectionLabel: CSSProperties;
} = {
  container: {
    width: 260,
    height: "100vh",
    background: theme.colors.sidebar,
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: 16,
    boxSizing: "border-box",
    borderRight: `1px solid rgba(226,232,240,0.08)`,
  },

  logo: {
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: 0.4,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    marginBottom: 14,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "rgba(255,255,255,0.55)",
    padding: "10px 12px 6px",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255,255,255,0.9)",
    userSelect: "none",
    transition: "background .18s ease, transform .18s ease",
  },

  activeItem: {
    background: "rgba(37, 99, 235, 0.14)",
    borderLeft: `3px solid ${theme.colors.primary}`,
    paddingLeft: 9, // compensa border-left
  },

  submenu: {
    marginLeft: 8,
    paddingLeft: 10,
    borderLeft: "1px dashed rgba(255,255,255,0.14)",
    marginTop: 6,
    marginBottom: 8,
  },

  submenuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: "rgba(255,255,255,0.82)",
    transition: "background .18s ease",
  },

  activeSubItem: {
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
  },
};