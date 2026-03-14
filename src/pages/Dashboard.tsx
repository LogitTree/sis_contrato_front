import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { layoutStyles } from "../styles/layout";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/api";

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

type DashboardKpis = {
  contratosAtivos: number;
  contratosVencer30d: number;
  empresasAtivas: number;
  orgaosCadastrados: number;
  contratosAtivosHint?: string;
  contratosVencer30dHint?: string;
  empresasAtivasHint?: string;
  orgaosCadastradosHint?: string;
};

type DashboardContratoMes = {
  mes: string;
  qtd: number;
};

type DashboardGastoOrgao = {
  nome: string;
  valor: number;
};

type DashboardStatus = {
  name: string;
  value: number;
};

type DashboardResponse = {
  kpis: DashboardKpis;
  contratosMes: DashboardContratoMes[];
  gastosPorOrgao: DashboardGastoOrgao[];
  statusContratos: DashboardStatus[];
  ultimosContratos: UltimoContrato[];
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/dashboard/resumo");
      setDashboard(data);
    } catch (err: any) {
      console.error("Erro ao carregar dashboard:", err);
      setError(
        err?.response?.data?.error || "Não foi possível carregar a dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const kpis = useMemo(
    () => [
      {
        label: "Contratos Ativos",
        value: dashboard?.kpis?.contratosAtivos ?? 0,
        hint: dashboard?.kpis?.contratosAtivosHint ?? "sem dados",
      },
      {
        label: "A vencer em 30 dias",
        value: dashboard?.kpis?.contratosVencer30d ?? 0,
        hint: dashboard?.kpis?.contratosVencer30dHint ?? "sem dados",
      },
      {
        label: "Empresas Ativas",
        value: dashboard?.kpis?.empresasAtivas ?? 0,
        hint: dashboard?.kpis?.empresasAtivasHint ?? "sem dados",
      },
      {
        label: "Órgãos Cadastrados",
        value: dashboard?.kpis?.orgaosCadastrados ?? 0,
        hint: dashboard?.kpis?.orgaosCadastradosHint ?? "sem dados",
      },
    ],
    [dashboard]
  );

  const contratosMes = dashboard?.contratosMes ?? [];
  const gastosPorOrgao = dashboard?.gastosPorOrgao ?? [];
  const statusContratos = dashboard?.statusContratos ?? [];
  const ultimosContratos = dashboard?.ultimosContratos ?? [];

  function moedaBR(v: number) {
    return Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const gridShortcuts: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginTop: 18,
  };

  const gridKpis: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gap: 16,
    marginTop: 18,
  };

  const gridDashboard: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gap: 18,
    marginTop: 18,
  };

  const cardBase: React.CSSProperties = {
    background: "linear-gradient(180deg, #ffffff 0%, #fcfdff 100%)",
    borderRadius: 18,
    border: "1px solid #e8eef5",
    padding: 18,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 12,
    letterSpacing: 0.2,
  };

  const cardHeaderLine: React.CSSProperties = {
    height: 1,
    background: "#edf2f7",
    margin: "10px 0 4px",
  };

  const kpiCard: React.CSSProperties = {
    ...cardBase,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 116,
    justifyContent: "center",
  };

  const kpiLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "#64748b",
  };

  const kpiValue: React.CSSProperties = {
    fontSize: 30,
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: "32px",
  };

  const kpiHint: React.CSSProperties = {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
  };

  const shortcutCard: React.CSSProperties = {
    ...cardBase,
    cursor: "pointer",
    transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
    padding: 18,
  };

  const shortcutTitle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 6,
  };

  const shortcutDesc: React.CSSProperties = {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.4,
  };

  const tableWrap: React.CSSProperties = {
    width: "100%",
    overflowX: "auto",
    borderRadius: 14,
    border: "1px solid #e9eef5",
    background: "#fff",
  };

  const table: React.CSSProperties = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 860,
    background: "#fff",
    tableLayout: "fixed",
  };

  const th: React.CSSProperties = {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    padding: "14px 14px",
    background: "#f8fafc",
    borderBottom: "1px solid #e9eef5",
    position: "sticky",
    top: 0,
    zIndex: 1,
    whiteSpace: "nowrap",
  };

  const td: React.CSSProperties = {
    fontSize: 13,
    color: "#0f172a",
    padding: "13px 14px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
  };

  const cellTruncate: React.CSSProperties = {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
      justifyContent: "center",
      minWidth: 98,
      padding: "5px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 900,
      border: "1px solid #e5e7eb",
      letterSpacing: 0.3,
    };

    const map: Record<UltimoContrato["status"], React.CSSProperties> = {
      ATIVO: {
        background: "#ecfdf5",
        color: "#065f46",
        borderColor: "#a7f3d0",
      },
      SUSPENSO: {
        background: "#fffbeb",
        color: "#92400e",
        borderColor: "#fde68a",
      },
      ENCERRADO: {
        background: "#f1f5f9",
        color: "#334155",
        borderColor: "#e2e8f0",
      },
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
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 18px 40px rgba(15, 23, 42, 0.08)";
          e.currentTarget.style.borderColor = "#dbe7f3";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 10px 30px rgba(15, 23, 42, 0.05)";
          e.currentTarget.style.borderColor = "#e8eef5";
        }}
      >
        <div style={shortcutTitle}>{title}</div>
        <div style={shortcutDesc}>{description}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={layoutStyles.page}>
        <div style={layoutStyles.header}>
          <div>
            <h1 style={layoutStyles.title}>Dashboard</h1>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
              Carregando dados do sistema...
            </div>
          </div>
        </div>

        <div style={layoutStyles.content}>
          <div style={layoutStyles.card}>Carregando dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={layoutStyles.page}>
        <div style={layoutStyles.header}>
          <div>
            <h1 style={layoutStyles.title}>Dashboard</h1>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
              Visão geral do sistema.
            </div>
          </div>
        </div>

        <div style={layoutStyles.content}>
          <div
            style={{
              ...layoutStyles.card,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 8 }}>
              Erro ao carregar a dashboard
            </div>
            <div style={{ marginBottom: 12 }}>{error}</div>

            <button
              onClick={loadDashboard}
              style={{
                height: 38,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid #fca5a5",
                background: "#fff",
                color: "#991b1b",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Dashboard</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Visão geral executiva do sistema.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              lineHeight: 1.25,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>
              {user?.nome || "—"}
              {user?.perfil ? (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: 900,
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#334155",
                  }}
                >
                  {user.perfil}
                </span>
              ) : null}
            </div>

            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
              {user?.email || ""}
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontWeight: 900,
              fontSize: 13,
              color: "#0f172a",
              cursor: "pointer",
            }}
            title="Sair"
          >
            Sair
          </button>
        </div>
      </div>

      <div style={layoutStyles.content}>
        <div style={cardBase}>
          <div style={sectionTitle}>Atalhos do Sistema</div>
          <div style={cardHeaderLine} />
          <div style={gridShortcuts}>
            <Shortcut
              title="Contratos"
              description="Gerencie contratos e vigências"
              path="/contratos"
            />

            <Shortcut
              title="Produtos"
              description="Cadastro e controle de produtos"
              path="/produtos"
            />

            <Shortcut
              title="Vendas"
              description="Pedidos de venda e entregas"
              path="/pedidosvenda"
            />

            <Shortcut
              title="Compras"
              description="Controle de compras e recebimentos"
              path="/compras"
            />
          </div>
        </div>

        <div style={gridKpis}>
          {kpis.map((k) => (
            <div key={k.label} style={{ ...kpiCard, gridColumn: "span 3" }}>
              <div style={kpiLabel}>{k.label}</div>
              <div style={kpiValue}>{k.value}</div>
              <div style={kpiHint}>{k.hint}</div>
            </div>
          ))}
        </div>

        <div style={gridDashboard}>
          <div style={{ ...cardBase, gridColumn: "span 7" }}>
            <div style={sectionTitle}>Contratos por mês</div>
            <div style={cardHeaderLine} />
            <div style={{ height: 285, marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={contratosMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eef5" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="qtd"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ ...cardBase, gridColumn: "span 5" }}>
            <div style={sectionTitle}>Status dos contratos</div>
            <div style={cardHeaderLine} />
            <div style={{ height: 285, display: "grid", placeItems: "center", marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={statusContratos}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {statusContratos.map((_, idx) => (
                      <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                marginTop: 6,
              }}
            >
              {statusContratos.map((s, idx) => (
                <div
                  key={s.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "#334155",
                    fontWeight: 700,
                  }}
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

          <div style={{ ...cardBase, gridColumn: "span 6" }}>
            <div style={sectionTitle}>Gasto estimado por órgão</div>
            <div style={cardHeaderLine} />
            <div style={{ height: 285, marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gastosPorOrgao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eef5" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip formatter={(v: any) => moedaBR(Number(v))} />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ ...cardBase, gridColumn: "span 6" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div style={sectionTitle}>Últimos contratos</div>

              <button
                style={cardLinkButton}
                onClick={() => navigate("/contratos")}
              >
                Ver todos →
              </button>
            </div>

            <div style={tableWrap}>
              <table style={table}>
                <colgroup>
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "16%" }} />
                </colgroup>

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
                  {ultimosContratos.length > 0 ? (
                    ultimosContratos.map((c) => (
                      <tr
                        key={c.id}
                        style={rowHover}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                        onClick={() => navigate(`/contratos/${c.id}/editar`)}
                      >
                        <td style={td}>
                          <span style={{ ...cellTruncate, fontWeight: 800 }}>
                            {c.numero}
                          </span>
                        </td>

                        <td style={td} title={c.orgao}>
                          <span style={cellTruncate}>{c.orgao}</span>
                        </td>

                        <td style={td} title={c.empresa}>
                          <span style={cellTruncate}>{c.empresa}</span>
                        </td>

                        <td style={td}>
                          <Badge status={c.status} />
                        </td>

                        <td
                          style={{
                            ...td,
                            textAlign: "right",
                            fontWeight: 900,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {moedaBR(c.valor)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          ...td,
                          textAlign: "center",
                          color: "#64748b",
                          padding: "24px 12px",
                        }}
                      >
                        Nenhum contrato encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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