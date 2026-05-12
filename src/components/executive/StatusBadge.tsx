type StatusBadgeProps = {
  status: "ATIVO" | "INATIVO" | string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const ativo = status === "ATIVO";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 800,
        background: ativo ? "#ecfdf5" : "#fef2f2",
        color: ativo ? "#047857" : "#b91c1c",
      }}
    >
      {status}
    </span>
  );
}