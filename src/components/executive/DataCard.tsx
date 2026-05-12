import type React from "react";
import { executiveStyles } from "../../styles/executive";

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export default function DataCard({ title, subtitle, right, children }: Props) {
  return (
    <div style={executiveStyles.card}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 850,
              color: "#0f172a",
              letterSpacing: -0.2,
            }}
          >
            {title}
          </h2>

          {subtitle && (
            <p
              style={{
                margin: "5px 0 0",
                fontSize: 13,
                color: "#64748b",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {right}
      </div>

      {children}
    </div>
  );
}