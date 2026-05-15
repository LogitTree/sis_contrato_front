import { useEffect, useMemo, useState } from "react";
import { FiEye, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  listarDatasExpedicoesPedidoVenda,
  type PedidoVendaExpedicaoDataResumo,
} from "../../services/pedidoVenda/pedidoVendaService";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateBR(value?: string | null) {
  if (!value) return "-";

  const s = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "-";

  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function formatQtyBR(v: any) {
  return Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export default function PedidoVendaExpedicoesDatas() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PedidoVendaExpedicaoDataResumo[]>([]);

  const [dataInicio, setDataInicio] = useState(todayISO());
  const [dataFim, setDataFim] = useState(todayISO());

  async function carregar() {
    setLoading(true);

    try {
      const result = await listarDatasExpedicoesPedidoVenda({
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
      });

      setRows(result);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.error || "Erro ao carregar datas de expedição."
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.totalDatas += 1;
        acc.totalLancamentos += Number(row.total_lancamentos || 0);
        acc.totalExpedido += Number(row.total_expedido || 0);
        return acc;
      },
      {
        totalDatas: 0,
        totalLancamentos: 0,
        totalExpedido: 0,
      }
    );
  }, [rows]);

  return (
    <PageShell>
      <PageHeader
        title="Expedições / Romaneios"
        subtitle="Acompanhe as expedições agrupadas por data para emissão de romaneio."
        action={
          <button
            type="button"
            style={buttonStyles.secondary}
            onClick={() => navigate("/pedidosvenda")}
          >
            Voltar
          </button>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <SummaryCard label="Datas" value={resumo.totalDatas} />

        <SummaryCard
          label="Lançamentos"
          value={resumo.totalLancamentos}
          tone="info"
        />

        <SummaryCard
          label="Total expedido"
          value={formatQtyBR(resumo.totalExpedido)}
          tone="success"
        />
      </div>

      <DataCard
        title="Filtros"
        subtitle="Por padrão, a tela abre com as expedições do dia."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle}>Data inicial</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Data final</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              style={fieldStyle}
            />
          </div>

          <button
            type="button"
            style={{
              ...buttonStyles.secondary,
              height: 40,
            }}
            onClick={carregar}
            disabled={loading}
          >
            <FiSearch size={15} /> Buscar
          </button>
        </div>
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Datas de expedição"
        subtitle="Selecione uma data para visualizar os itens expedidos e imprimir o romaneio."
      >
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {["Data", "Lançamentos", "Total expedido", "Ações"].map(
                  (title) => (
                    <th
                      key={title}
                      style={{
                        padding: "12px 14px",
                        textAlign: title === "Ações" ? "right" : "left",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        color: "#64748b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {title}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={emptyStyle}>
                    Carregando expedições...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={emptyStyle}>
                    Nenhuma expedição encontrada no período.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.data_expedicao}
                    style={{ borderTop: "1px solid #e5e7eb" }}
                  >
                    <td style={tdStyle}>
                      <strong>{formatDateBR(row.data_expedicao)}</strong>
                    </td>

                    <td style={tdStyle}>{row.total_lancamentos}</td>

                    <td style={tdStyle}>
                      <strong>{formatQtyBR(row.total_expedido)}</strong>
                    </td>

                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <button
                        type="button"
                        title="Visualizar romaneio"
                        style={iconButtonStyle}
                        onClick={() =>
                          navigate(
                            `/pedidosvenda/expedicoes/${row.data_expedicao}`
                          )
                        }
                      >
                        <FiEye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DataCard>
    </PageShell>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 800,
  color: "#374151",
  marginBottom: 6,
};

const fieldStyle: React.CSSProperties = {
  ...filterStyles.input,
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  height: 40,
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
  color: "#334155",
  verticalAlign: "middle",
};

const emptyStyle: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
};

const iconButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#334155",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};