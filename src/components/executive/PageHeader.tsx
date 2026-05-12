import type React from "react";
import { executiveStyles } from "../../styles/executive";

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div style={executiveStyles.header}>
      <div>
        <h1 style={executiveStyles.title}>{title}</h1>
        {subtitle && <div style={executiveStyles.subtitle}>{subtitle}</div>}
      </div>

      {action}
    </div>
  );
}