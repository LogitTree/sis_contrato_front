import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";

type DashboardFinanceiroData = {
  cards: {
    total_contas: number;
    valor_total: number;
    valor_pago: number;
    saldo_total: number;
    contas_em_aberto: number;
    saldo_em_aberto: number;
    contas_vencidas: number;
    saldo_vencido: number;
    contas_pagas: number;
    total_pago: number;
  };
  por_status: {
    status: string;
    quantidade: number;
    saldo: number;
  }[];
  proximos_vencimentos: any[];
  top_fornecedores_aberto: any[];
};

function money(v: any) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dateBR(value: any) {
  if (!value) return "-";
  const s = String(value).slice(0, 10);
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function statusStyle(status: string) {
  const s = String(status || "").toUpperCase();

  if (s === "PAGO") return { background: "#dcfce7", color: "#166534" };
  if (s === "PARCIAL") return { background: "#fef3c7", color: "#92400e" };
  if (s === "VENCIDO") return { background: "#fee2e2", color: "#991b1b" };
  if (s === "CANCELADO") return { background: "#e5e7eb", color: "#374151" };
  return { background: "#dbeafe", color: "#1e40af" };
}

export default function DashboardFinanceiro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardFinanceiroData | null>(null);

  async function carregar() {
    setLoading(true);
    try {
      const res = await api.get("/dashboard-financeiro");
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dashboard financeiro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Dashboard Financeiro</h1>
      </div>

      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <button style={buttonStyles.link} onClick={() => navigate(-1)}>
          Voltar
        </button>
      </div>

      {loading && (
        <div style={layoutStyles.card}>Carregando dashboard...</div>
      )}

      {!loading && data && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div style={layoutStyles.cardCompact}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                Saldo em aberto
              </div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>
                {money(data.cards.saldo_em_aberto)}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                {data.cards.contas_em_aberto} conta(s)
              </div>
            </div>

            <div style={layoutStyles.cardCompact}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                Saldo vencido
              </div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700, color: "#b91c1c" }}>
                {money(data.cards.saldo_vencido)}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                {data.cards.contas_vencidas} conta(s)
              </div>
            </div>

            <div style={layoutStyles.cardCompact}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                Total pago
              </div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700, color: "#166534" }}>
                {money(data.cards.total_pago)}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                {data.cards.contas_pagas} conta(s)
              </div>
            </div>

            <div style={layoutStyles.cardCompact}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                Valor total
              </div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>
                {money(data.cards.valor_total)}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                {data.cards.total_contas} conta(s)
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div style={layoutStyles.card}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                Contas por status
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={tableStyles.table}>
                  <thead>
                    <tr>
                      <th style={tableStyles.th}>Status</th>
                      <th style={{ ...tableStyles.th, textAlign: "right" }}>Qtd</th>
                      <th style={{ ...tableStyles.th, textAlign: "right" }}>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.por_status.map((item) => (
                      <tr key={item.status}>
                        <td style={tableStyles.td}>
                          <span
                            style={{
                              padding: "3px 9px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              display: "inline-block",
                              ...statusStyle(item.status),
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td style={{ ...tableStyles.td, textAlign: "right" }}>
                          {item.quantidade}
                        </td>
                        <td style={{ ...tableStyles.td, textAlign: "right" }}>
                          {money(item.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={layoutStyles.card}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                Próximos vencimentos
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={tableStyles.table}>
                  <thead>
                    <tr>
                      <th style={tableStyles.th}>Conta</th>
                      <th style={tableStyles.th}>Fornecedor</th>
                      <th style={tableStyles.th}>Vencimento</th>
                      <th style={{ ...tableStyles.th, textAlign: "right" }}>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.proximos_vencimentos.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ ...tableStyles.td, textAlign: "center" }}>
                          Nenhum vencimento próximo.
                        </td>
                      </tr>
                    )}

                    {data.proximos_vencimentos.map((item: any) => (
                      <tr key={item.id}>
                        <td style={tableStyles.td}>#{item.id}</td>
                        <td style={tableStyles.td}>{item.fornecedor?.nome || "-"}</td>
                        <td style={tableStyles.td}>{dateBR(item.data_vencimento)}</td>
                        <td style={{ ...tableStyles.td, textAlign: "right" }}>
                          {money(item.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ ...layoutStyles.card, marginTop: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              Top fornecedores por saldo em aberto
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={tableStyles.th}>Fornecedor</th>
                    <th style={{ ...tableStyles.th, textAlign: "right" }}>Qtd</th>
                    <th style={{ ...tableStyles.th, textAlign: "right" }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_fornecedores_aberto.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ ...tableStyles.td, textAlign: "center" }}>
                        Nenhum fornecedor com saldo em aberto.
                      </td>
                    </tr>
                  )}

                  {data.top_fornecedores_aberto.map((item: any) => (
                    <tr key={item.fornecedor_id}>
                      <td style={tableStyles.td}>{item.fornecedor?.nome || "-"}</td>
                      <td style={{ ...tableStyles.td, textAlign: "right" }}>
                        {item.quantidade}
                      </td>
                      <td style={{ ...tableStyles.td, textAlign: "right" }}>
                        {money(item.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}