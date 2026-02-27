import { theme } from "./theme";

export const buttonStyles = {
  primary: {
    background: theme.colors.primary,
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: theme.radius.sm,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all .2s ease",
    boxShadow: theme.shadow.sm,
  },

  secondary: {
    background: "#fff",
    color: theme.colors.textPrimary,
    border: `1px solid ${theme.colors.border}`,
    padding: "10px 18px",
    borderRadius: theme.radius.sm,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all .2s ease",
  },

  outlinePrimary: {
    background: "transparent",
    color: theme.colors.primary,
    border: `1px solid ${theme.colors.primary}`,
    padding: "10px 18px",
    borderRadius: theme.radius.sm,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all .2s ease",
  },

  link: {
    background: "transparent",
    border: "none",
    color: theme.colors.primary,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },

  danger: {
    background: theme.colors.danger,
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: theme.radius.sm,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all .2s ease",
  },

  dangerLink: {
    background: "transparent",
    border: "none",
    color: theme.colors.danger,
    cursor: "pointer",
    fontWeight: 600,
  },

  icon: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background .2s ease",
  },

  paginationButtonStyle: (disabled: boolean) => ({
    background: "#fff",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    padding: "6px 10px",
    color: theme.colors.textPrimary,
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all .2s ease",
  }),
};