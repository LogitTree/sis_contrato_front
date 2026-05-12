import type React from "react";

export const executiveStyles = {
  page: {
    minHeight: "100%",
  } as React.CSSProperties,

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    marginBottom: 20,
  } as React.CSSProperties,

  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 850,
    color: "#0f172a",
    letterSpacing: -0.6,
  } as React.CSSProperties,

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.5,
  } as React.CSSProperties,

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 26,
    padding: 20,
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.05)",
  } as React.CSSProperties,
};