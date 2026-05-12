import React from "react";
import { layoutStyles } from "../../styles/layout";

type PageShellProps = {
  children: React.ReactNode;
};

export default function PageShell({ children }: PageShellProps) {
  return <div style={layoutStyles.page}>{children}</div>;
}