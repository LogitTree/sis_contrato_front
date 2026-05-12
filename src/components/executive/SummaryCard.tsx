import type React from "react";

type Props = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "danger" | "info";
};

export default function SummaryCard({
  label,
  value,
  icon,
  tone = "default",
}: Props) {
  const toneColor =
    tone === "success"
      ? "#059669"
      : tone === "danger"
        ? "#dc2626"
        : tone === "info"
          ? "#2563eb"
          : "#0f172a";

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        borderRadius: 22,
        padding: 16,
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: "#64748b",
            }}
          >
            {label}
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 24,
              fontWeight: 850,
              color: toneColor,
              letterSpacing: -0.5,
            }}
          >
            {value}
          </div>
        </div>

        {icon && (
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 16,
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: toneColor,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}