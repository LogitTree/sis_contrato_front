import { theme } from "./theme";

export const filterStyles = {
  container: {
    position: "relative" as const,
    padding: "20px 18px 18px",
    marginBottom: 18,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    background: theme.colors.card,
    boxShadow: theme.shadow.sm,
  },

  title: {
    position: "absolute" as const,
    top: -10,
    left: 16,
    padding: "0 8px",
    background: theme.colors.card,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.6,
    color: theme.colors.textSecondary,
    textTransform: "uppercase" as const,
  },

  // 🔥 responsivo e escalável
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 220px auto",
    gap: 12,
    alignItems: "center",
  },

  input: {
    height: 40,
    padding: "0 14px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    fontSize: 14,
    color: theme.colors.textPrimary,
    background: "#ffffff",
    outline: "none",
    transition: "border-color .15s ease, box-shadow .15s ease",
  },

  select: {
    height: 40,
    padding: "0 14px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    fontSize: 14,
    color: theme.colors.textPrimary,
    background: "#ffffff",
    outline: "none",
    transition: "border-color .15s ease, box-shadow .15s ease",
  },

  actions: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
  },
};