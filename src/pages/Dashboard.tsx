import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { layoutStyles } from "../styles/layout";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type UltimoContrato = {
  id: number;
  numero: string;
  orgao: string;
  empresa: string;
  status: "ATIVO" | "SUSPENSO" | "ENCERRADO";
  valor: number;
  inicio: string;
  fim: string;
};

export default function Dashboard() {
  const navigate = useNavigate();

  /* =========================
     MOCK DATA (simulação)
  ========================= */
  const kpis = useMemo(
    () => [
      { label: "Contratos Ativos", value: 42, hint: "+3 este mês" },
      { label: "Contratos a Vencer (30d)", value: 7, hint: "atenção" },
      { label: "Empresas Ativas", value: 128, hint: "+5 este mês" },
      { label: "Órgãos Cadastrados", value: 19, hint: "estável" },
    ],
    []
  );

  const contratosMes = useMemo(
    () => [
      { mes: "Ago", qtd: 10 },
      { mes: "Set", qtd: 14 },
      { mes: "Out", qtd: 12 },
      { mes: "Nov", qtd: 18 },
      { mes: "Dez", qtd: 16 },
      { mes: "Jan", qtd: 22 },
      { mes: "Fev", qtd: 19 },
    ],
    []
  );

  const gastosPorOrgao = useMemo(
    () => [
      { nome: "Saúde", valor: 180000 },
      { nome: "Educação", valor: 145000 },
      { nome: "Assistência", valor: 98000 },
      { nome: "Infra", valor: 210000 },
      { nome: "ADM", valor: 72000 },
    ],
    []
  );

  const statusContratos = useMemo(
    () => [
      { name: "Ativo", value: 42 },
      { name: "Suspenso", value: 6 },
      { name: "Encerrado", value: 14 },
    ],
    []
  );

  const ultimosContratos: UltimoContrato[] = useMemo(
    () => [
      {
        id: 1,
        numero: "001/2026",
        orgao: "Saúde",
        empresa: "Alpha LTDA",
        status: "ATIVO",
        valor: 85000,
        inicio: "2026-01-10",
        fim: "2026-12-31",
      },
      {
        id: 2,
        numero: "002/2026",
        orgao: "Educação",
        empresa: "Beta Serviços",
        status: "ATIVO",
        valor: 42000,
        inicio: "2026-02-01",
        fim: "2026-10-01",
      },
      {
        id: 3,
        numero: "098/2025",
        orgao: "Infra",
        empresa: "Gamma Fornecimentos",
        status: "SUSPENSO",
        valor: 120000,
        inicio: "2025-09-15",
        fim: "2026-09-15",
      },
      {
        id: 4,
        numero: "077/2025",
        orgao: "ADM",
        empresa: "Delta Comércio",
        status: "ENCERRADO",
        valor: 36000,
        inicio: "2025-03-01",
        fim: "2025-12-01",
      },
    ],
    []
  );

  function moedaBR(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  /* =========================
     STYLES (no padrão do sistema)
  ========================= */
  const gridShortcuts: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginTop: 16,
  };

  const gridDashboard: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gap: 16,
    marginTop: 16,
  };

  const cardBase: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: 12,
    border: "1px solid #eef2f7",
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 10,
  };

  const kpiCard: React.CSSProperties = {
    ...cardBase,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  };

  const kpiLabel: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#64748b",
  };

  const kpiValue: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 900,
    color: "#111827",
    lineHeight: "26px",
  };

  const kpiHint: React.CSSProperties = {
    fontSize: 13,
    color: "#64748b",
  };

  const shortcutCard: React.CSSProperties = {
    ...cardBase,
    cursor: "pointer",
    transition: "transform .18s ease, box-shadow .18s ease",
  };

  const shortcutTitle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 6,
  };

  const shortcutDesc: React.CSSProperties = {
    fontSize: 13,
    color: "#64748b",
  };

  const tableWrap: React.CSSProperties = {
    width: "100%",
    overflowX: "auto",
    borderRadius: 10,
    border: "1px solid #eef2f7",
  };

  const table: React.CSSProperties = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 640,
    background: "#fff",
  };

  const th: React.CSSProperties = {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    padding: "12px 12px",
    background: "#f8fafc",
    borderBottom: "1px solid #eef2f7",
    position: "sticky",
    top: 0,
    zIndex: 1,
  };

  const td: React.CSSProperties = {
    fontSize: 13,
    color: "#111827",
    padding: "12px 12px",
    borderBottom: "1px solid #f1f5f9",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 1,
  };

  const rowHover: React.CSSProperties = {
    cursor: "pointer",
    transition: "background .15s ease",
  };

  const pieColors = ["#22c55e", "#f59e0b", "#94a3b8"];

  function Badge({ status }: { status: UltimoContrato["status"] }) {
    const base: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      border: "1px solid #e5e7eb",
    };

    const map: Record<UltimoContrato["status"], React.CSSProperties> = {
      ATIVO: { background: "#ecfdf5", color: "#065f46", borderColor: "#a7f3d0" },
      SUSPENSO: { background: "#fffbeb", color: "#92400e", borderColor: "#fde68a" },
      ENCERRADO: { background: "#f1f5f9", color: "#334155", borderColor: "#e2e8f0" },
    };

    return <span style={{ ...base, ...map[status] }}>{status}</span>;
  }

  function Shortcut({
    title,
    description,
    path,
  }: {
    title: string;
    description: string;
    path: string;
  }) {
    return (
      <div
        style={shortcutCard}
        onClick={() => navigate(path)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.07)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
        }}
      >
        <div style={shortcutTitle}>{title}</div>
        <div style={shortcutDesc}>{description}</div>
      </div>
    );
  }

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Dashboard</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Visão geral do sistema.
          </div>
        </div>
      </div>

      {/* 🔥 CONTENT SCROLLÁVEL */}
      <div style={layoutStyles.content}>
        {/* Aviso */}
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            fontWeight: 800,
            color: "#b45309",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            padding: "8px 10px",
            borderRadius: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          🚧 Módulo em desenvolvimento — dados meramente ilustrativos.
        </div>

        {/* KPIs */}
        <div style={gridDashboard}>
          {kpis.map((k) => (
            <div key={k.label} style={{ ...kpiCard, gridColumn: "span 3" }}>
              <div style={kpiLabel}>{k.label}</div>
              <div style={kpiValue}>{k.value}</div>
              <div style={kpiHint}>{k.hint}</div>
            </div>
          ))}
        </div>

        {/* GRÁFICOS + TABELA */}
        <div style={gridDashboard}>
          {/* Linha */}
          <div style={{ ...cardBase, gridColumn: "span 7" }}>
            <div style={sectionTitle}>Contratos por mês</div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={contratosMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="qtd" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pizza */}
          <div style={{ ...cardBase, gridColumn: "span 5" }}>
            <div style={sectionTitle}>Status dos contratos</div>
            <div style={{ height: 260, display: "grid", placeItems: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={statusContratos}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {statusContratos.map((_, idx) => (
                      <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
              {statusContratos.map((s, idx) => (
                <div
                  key={s.name}
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      display: "inline-block",
                      background: pieColors[idx % pieColors.length],
                    }}
                  />
                  {s.name}: <strong style={{ color: "#111827" }}>{s.value}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Barras */}
          <div style={{ ...cardBase, gridColumn: "span 6" }}>
            <div style={sectionTitle}>Gasto estimado por órgão</div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gastosPorOrgao}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip formatter={(v: any) => moedaBR(Number(v))} />
                  <Bar dataKey="valor" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Últimos contratos */}
          <div style={{ ...cardBase, gridColumn: "span 6" }}>
            <div style={sectionTitle}>Últimos contratos</div>

            <div style={tableWrap}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Contrato</th>
                    <th style={th}>Órgão</th>
                    <th style={th}>Empresa</th>
                    <th style={th}>Status</th>
                    <th style={{ ...th, textAlign: "right" }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosContratos.map((c) => (
                    <tr
                      key={c.id}
                      style={rowHover}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      onClick={() => navigate(`/contratos/${c.id}/editar`)}
                    >
                      <td style={td}>{c.numero}</td>
                      <td style={td}>{c.orgao}</td>
                      <td style={td}>{c.empresa}</td>
                      <td style={td}>
                        <Badge status={c.status} />
                      </td>
                      <td style={{ ...td, textAlign: "right", fontWeight: 900 }}>
                        {moedaBR(c.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button style={cardLinkButton} onClick={() => navigate("/contratos")}>
                Ver todos →
              </button>
            </div>
          </div>
        </div>

        {/* ATALHOS */}
        {/* ATALHOS */}
        <div style={layoutStyles.card}>
          <div style={sectionTitle}>Atalhos do Sistema</div>
          <div style={{ height: 1, background: "#eef2f7", margin: "10px 0 4px" }} />
          <div style={gridShortcuts}>
            <Shortcut title="Contratos" description="Gerencie contratos e vigências" path="/contratos" />
            <Shortcut title="Produtos" description="Cadastro e controle de produtos" path="/produtos" />
            <Shortcut title="Órgãos" description="Órgãos contratantes e vínculos" path="/orgaos" />
            <Shortcut title="Empresas" description="Empresas contratadas e status" path="/empresas" />
          </div>
        </div>
      </div>
    </div>
  );
}

const cardLinkButton: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "#2563eb",
  fontWeight: 900,
  fontSize: 13,
  padding: 0,
};