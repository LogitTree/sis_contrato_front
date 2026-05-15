import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiPrinter } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";

import {
  listarExpedicoesPedidoVenda,
  type PedidoVendaExpedicaoRow,
  gerarRomaneioExpedicaoPdf,
} from "../../services/pedidoVenda/pedidoVendaService";

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

function getClienteNome(row: PedidoVendaExpedicaoRow) {
  return (
    row.pedido?.cliente?.nome ||
    row.pedido?.cliente?.razao_social ||
    row.pedido?.cliente?.nome_fantasia ||
    row.pedido?.contrato?.orgao?.nome ||
    row.pedido?.contrato?.orgao?.razao_social ||
    row.pedido?.contrato?.orgao?.nome_fantasia ||
    "-"
  );
}

function getContratoNumero(row: PedidoVendaExpedicaoRow) {
  return row.pedido?.contrato?.numero || row.pedido?.contrato_id || "-";
}

export default function PedidoVendaExpedicoesDataDetalhe() {
  const navigate = useNavigate();
  const { dataExpedicao } = useParams();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PedidoVendaExpedicaoRow[]>([]);

  async function carregar() {
    if (!dataExpedicao) return;

    setLoading(true);

    try {
      const result = await listarExpedicoesPedidoVenda({
        data_expedicao: dataExpedicao,
      });

      setRows(result.data || []);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.error || "Erro ao carregar expedições da data."
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [dataExpedicao]);

  const resumo = useMemo(() => {
    const pedidos = new Set<number>();
    const produtos = new Set<number>();

    const totalExpedido = rows.reduce((acc, row) => {
      if (row.pedido_venda_id) pedidos.add(row.pedido_venda_id);
      if (row.produto_id) produtos.add(row.produto_id);

      return acc + Number(row.qtd_expedida || 0);
    }, 0);

    return {
      totalLancamentos: rows.length,
      totalPedidos: pedidos.size,
      totalProdutos: produtos.size,
      totalExpedido,
    };
  }, [rows]);

  const pedidosResumo = useMemo(() => {
    const map = new Map<
      number,
      {
        pedido: number;
        dataPedido?: string | null;
        contrato: string | number;
        cliente: string;
        totalItens: number;
        totalExpedido: number;
      }
    >();

    rows.forEach((row) => {
      const pedidoId = Number(row.pedido_venda_id);

      if (!map.has(pedidoId)) {
        map.set(pedidoId, {
          pedido: pedidoId,
          dataPedido: row.pedido?.data,
          contrato: getContratoNumero(row),
          cliente: getClienteNome(row),
          totalItens: 0,
          totalExpedido: 0,
        });
      }

      const item = map.get(pedidoId);

      if (item) {
        item.totalItens += 1;
        item.totalExpedido += Number(row.qtd_expedida || 0);
      }
    });

    return Array.from(map.values());
  }, [rows]);

  async function imprimirRomaneio() {
    if (!dataExpedicao) {
      toast.error("Data de expedição inválida.");
      return;
    }

    try {
      const blob = await gerarRomaneioExpedicaoPdf(dataExpedicao);

      const fileURL = URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );

      window.open(fileURL, "_blank");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.error || "Erro ao gerar romaneio em PDF."
      );
    }
  }

  return (
    <PageShell>
      <PageHeader
        title={`Romaneio de Expedição - ${formatDateBR(dataExpedicao)}`}
        subtitle="Itens expedidos agrupados pela data de expedição."
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              style={buttonStyles.secondary}
              onClick={() => navigate("/pedidosvenda/expedicoes")}
            >
              <FiArrowLeft size={15} /> Voltar
            </button>

            <button
              type="button"
              style={buttonStyles.primary}
              onClick={imprimirRomaneio}
              disabled={!rows.length}
            >
              <FiPrinter size={15} /> Imprimir
            </button>
          </div>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <SummaryCard label="Lançamentos" value={resumo.totalLancamentos} />

        <SummaryCard label="Pedidos" value={resumo.totalPedidos} tone="info" />

        <SummaryCard label="Produtos" value={resumo.totalProdutos} />

        <SummaryCard
          label="Total expedido"
          value={formatQtyBR(resumo.totalExpedido)}
          tone="success"
        />
      </div>

      <DataCard
        title="Pedidos e contratos da expedição"
        subtitle="Pedidos vinculados à data de expedição selecionada."
      >
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 900,
              borderCollapse: "collapse",
            }}
          >
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {[
                  "Pedido",
                  "Data pedido",
                  "Contrato",
                  "Cliente / Órgão",
                  "Itens",
                  "Qtd expedida",
                ].map((title) => (
                  <th
                    key={title}
                    style={{
                      ...thStyle,
                      textAlign:
                        title === "Itens" || title === "Qtd expedida"
                          ? "right"
                          : "left",
                    }}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Carregando dados dos pedidos...
                  </td>
                </tr>
              ) : pedidosResumo.length === 0 ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Nenhum pedido encontrado para esta data.
                  </td>
                </tr>
              ) : (
                pedidosResumo.map((item, index) => (
                  <tr
                    key={item.pedido}
                    style={{
                      borderTop: "1px solid #e5e7eb",
                      background: index % 2 === 0 ? "#fff" : "#f8fafc",
                    }}
                  >
                    <td style={tdStyle}>
                      <strong>#{item.pedido}</strong>
                    </td>

                    <td style={tdStyle}>{formatDateBR(item.dataPedido)}</td>

                    <td style={tdStyle}>{item.contrato}</td>

                    <td style={tdStyle}>
                      <strong>{item.cliente}</strong>
                    </td>

                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {item.totalItens}
                    </td>

                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <strong>{formatQtyBR(item.totalExpedido)}</strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Itens expedidos"
        subtitle="Relação operacional dos produtos expedidos na data selecionada."
      >
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 900,
              borderCollapse: "collapse",
            }}
          >
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {[
                  "Produto",
                  "Lote",
                  "Validade",
                  "Qtd expedida",
                  "Observação",
                ].map((title) => (
                  <th
                    key={title}
                    style={{
                      ...thStyle,
                      textAlign: title === "Qtd expedida" ? "right" : "left",
                    }}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Carregando expedições...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Nenhuma expedição encontrada para esta data.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={row.id}
                    style={{
                      borderTop: "1px solid #e5e7eb",
                      background: index % 2 === 0 ? "#fff" : "#f8fafc",
                    }}
                  >

                    <td style={tdStyle}>
                      <strong>
                        {row.produto?.nome ||
                          row.produto?.descricao ||
                          `Produto #${row.produto_id}`}
                      </strong>
                    </td>

                    <td style={tdStyle}>{row.lote?.lote || "-"}</td>

                    <td style={tdStyle}>{formatDateBR(row.lote?.validade)}</td>

                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <strong>{formatQtyBR(row.qtd_expedida)}</strong>
                    </td>

                    <td style={tdStyle}>{row.observacao || "-"}</td>
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

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "#64748b",
  whiteSpace: "nowrap",
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