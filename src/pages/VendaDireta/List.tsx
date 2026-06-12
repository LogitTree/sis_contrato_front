import { useEffect, useMemo, useState } from "react";
import { FiEye, FiPlus, FiRefreshCcw, FiSearch, FiPrinter } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import api from "../../api/api";
import { useAuth } from "../../contexts/AuthContext";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  listarVendasDiretas,
  imprimirReciboVendaDireta,
  type VendaDireta,
} from "../../services/vendadireta/vendaDiretaService";

function money(v: any) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function dateBR(v?: string | null) {
  if (!v) return "-";

  const s = String(v).slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }

  const dt = new Date(v);
  if (isNaN(dt.getTime())) return "-";

  return dt.toLocaleDateString("pt-BR");
}

function statusStyle(status?: string): React.CSSProperties {
  const s = String(status || "").toUpperCase();

  if (s === "CONCLUIDO") return { background: "#dcfce7", color: "#166534" };
  if (s === "CANCELADO") return { background: "#fee2e2", color: "#991b1b" };
  if (s === "RASCUNHO") return { background: "#f1f5f9", color: "#475569" };

  return { background: "#f8fafc", color: "#475569" };
}

type FormaPagamentoOption = {
  id: number;
  descricao?: string;
  nome?: string;
};

export default function VendaDiretaList() {
  const navigate = useNavigate();

  const { empresas, empresaAtiva, setEmpresaAtiva } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadingFormas, setLoadingFormas] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dataInicio, setDataInicio] = useState(todayISO());
  const [dataFim, setDataFim] = useState(todayISO());
  const [formaPagamentoId, setFormaPagamentoId] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [vendas, setVendas] = useState<VendaDireta[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoOption[]>(
    []
  );

  const semEmpresaVinculada = empresas.length === 0;

  useEffect(() => {
    if (empresas.length === 1 && !empresaAtiva) {
      setEmpresaAtiva(empresas[0]);
    }
  }, [empresas, empresaAtiva, setEmpresaAtiva]);

  async function carregarFormasPagamento() {
    setLoadingFormas(true);

    try {
      const response = await api.get("/formas-pagamento", {
        params: { limit: 1000 },
      });

      const rows = Array.isArray(response.data)
        ? response.data
        : response.data?.data || response.data?.rows || [];

      setFormasPagamento(rows);
    } catch (error) {
      console.error(error);
      setFormasPagamento([]);
    } finally {
      setLoadingFormas(false);
    }
  }

  async function carregar(pageParam = page) {
    if (!empresaAtiva) {
      setLoading(false);
      setVendas([]);
      setTotal(0);
      setTotalPages(1);
      return;
    }

    setLoading(true);

    try {
      const result = await listarVendasDiretas({
        search: search?.trim() || undefined,
        status: status || undefined,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        forma_pagamento_id: formaPagamentoId
          ? Number(formaPagamentoId)
          : undefined,
        page: pageParam,
        limit,
      } as any);

      const rows = Array.isArray(result?.data) ? result.data : [];

      setVendas(rows);
      setTotal(Number(result?.total || rows.length || 0));
      setTotalPages(Number(result?.totalPages || 1));
    } catch (error) {
      console.error(error);
      setVendas([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  function buscar() {
    setPage(1);
    carregar(1);
  }

  function limparFiltros() {
    const hoje = todayISO();

    setSearch("");
    setStatus("");
    setDataInicio(hoje);
    setDataFim(hoje);
    setFormaPagamentoId("");
    setPage(1);

    setTimeout(() => carregar(1), 0);
  }

  useEffect(() => {
    carregarFormasPagamento();
  }, []);

  useEffect(() => {
    carregar(1);
    setPage(1);
  }, [empresaAtiva]);

  useEffect(() => {
    carregar(page);
  }, [page, limit]);

  const resumo = useMemo(() => {
    const totalVendas = vendas.length;

    const concluidas = vendas.filter(
      (v) => String(v.status).toUpperCase() === "CONCLUIDO"
    ).length;

    const canceladas = vendas.filter(
      (v) => String(v.status).toUpperCase() === "CANCELADO"
    ).length;

    const valorTotal = vendas.reduce((acc, venda) => {
      return acc + Number(venda.valor_total || 0);
    }, 0);

    return {
      totalVendas,
      concluidas,
      canceladas,
      valorTotal,
    };
  }, [vendas]);

  return (
    <PageShell>
      <PageHeader
        title="Vendas Diretas / PDV"
        subtitle="Controle de vendas diretas com baixa imediata no estoque."
        action={
          <button
            type="button"
            style={buttonStyles.primary}
            disabled={!empresaAtiva}
            onClick={() => navigate("/vendadireta/novo")}
          >
            <FiPlus size={15} /> Nova venda
          </button>
        }
      />

      <DataCard
        title="Empresa da operação"
        subtitle="Selecione a empresa para consultar e registrar vendas diretas."
      >
        {semEmpresaVinculada ? (
          <div style={emptyStyle}>
            Seu usuário não possui empresa vinculada. Vincule uma empresa ao
            usuário antes de usar a venda direta.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label style={labelStyle}>Empresa</label>
              <select
                value={empresaAtiva?.id || ""}
                disabled={empresas.length === 1}
                onChange={(e) => {
                  const empresa = empresas.find(
                    (item) => Number(item.id) === Number(e.target.value)
                  );

                  setEmpresaAtiva(empresa || null);
                }}
                style={fieldStyle}
              >
                <option value="">Selecione</option>

                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nome_fantasia || empresa.razao_social}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Empresa ativa</label>
              <div
                style={{
                  ...fieldStyle,
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 800,
                  background: "#f8fafc",
                }}
              >
                {empresaAtiva
                  ? empresaAtiva.nome_fantasia || empresaAtiva.razao_social
                  : "Não selecionada"}
              </div>
            </div>
          </div>
        )}
      </DataCard>

      <div style={{ height: 16 }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <SummaryCard label="Vendas na página" value={resumo.totalVendas} />
        <SummaryCard label="Concluídas" value={resumo.concluidas} tone="success" />
        <SummaryCard label="Canceladas" value={resumo.canceladas} tone="danger" />
        <SummaryCard label="Valor da página" value={money(resumo.valorTotal)} tone="info" />
      </div>

      <DataCard
        title="Filtros"
        subtitle="Pesquise vendas por período, cliente, status e forma de pagamento."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 150px 150px 170px 220px",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle}>Pesquisar</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cliente, observação..."
              style={fieldStyle}
              disabled={!empresaAtiva}
              onKeyDown={(e) => {
                if (e.key === "Enter") buscar();
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Data inicial</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              style={fieldStyle}
              disabled={!empresaAtiva}
            />
          </div>

          <div>
            <label style={labelStyle}>Data final</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              style={fieldStyle}
              disabled={!empresaAtiva}
            />
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={fieldStyle}
              disabled={!empresaAtiva}
            >
              <option value="">Todos</option>
              <option value="RASCUNHO">Rascunho</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Forma de pagamento</label>
            <select
              value={formaPagamentoId}
              onChange={(e) => setFormaPagamentoId(e.target.value)}
              style={fieldStyle}
              disabled={loadingFormas || !empresaAtiva}
            >
              <option value="">{loadingFormas ? "Carregando..." : "Todas"}</option>

              {formasPagamento.map((forma) => (
                <option key={forma.id} value={forma.id}>
                  {forma.descricao || forma.nome || `Forma #${forma.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
            Período padrão: vendas do dia atual.
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" style={{ ...buttonStyles.secondary, height: 40 }} onClick={limparFiltros} disabled={!empresaAtiva}>
              <FiRefreshCcw size={15} /> Limpar
            </button>

            <button type="button" style={{ ...buttonStyles.primary, height: 40 }} onClick={buscar} disabled={!empresaAtiva}>
              <FiSearch size={15} /> Buscar
            </button>
          </div>
        </div>
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard title="Histórico de vendas" subtitle="Relação das vendas realizadas no PDV.">
        <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 18 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {["Venda", "Data", "Cliente", "Pagamento", "Status", "Valor", "Ações"].map((title) => (
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
                ))}
              </tr>
            </thead>

            <tbody>
              {!empresaAtiva ? (
                <tr>
                  <td colSpan={7} style={emptyStyle}>
                    Selecione uma empresa para visualizar as vendas.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={7} style={emptyStyle}>
                    Carregando vendas...
                  </td>
                </tr>
              ) : vendas.length === 0 ? (
                <tr>
                  <td colSpan={7} style={emptyStyle}>
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              ) : (
                vendas.map((venda) => (
                  <tr key={venda.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={tdStyle}><strong>#{venda.id}</strong></td>
                    <td style={tdStyle}>{dateBR(venda.data)}</td>
                    <td style={tdStyle}>
                      <strong>
                        {venda.cliente?.nome || venda.cliente?.razao_social || "-"}
                      </strong>
                    </td>
                    <td style={tdStyle}>
                      {(venda as any).forma_pagamento?.descricao ||
                        (venda as any).formaPagamento?.descricao ||
                        (venda as any).forma_pagamento?.nome ||
                        "-"}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-flex",
                          borderRadius: 999,
                          padding: "5px 10px",
                          fontSize: 11,
                          fontWeight: 850,
                          ...statusStyle(venda.status),
                        }}
                      >
                        {venda.status}
                      </span>
                    </td>
                    <td style={tdStyle}><strong>{money(venda.valor_total)}</strong></td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 8,
                        }}
                      >
                        <button
                          type="button"
                          style={iconButtonStyle}
                          title="Visualizar venda"
                          onClick={() => navigate(`/vendadireta/${venda.id}/editar`)}
                        >
                          <FiEye size={15} />
                        </button>

                        <button
                          type="button"
                          style={iconButtonStyle}
                          title="Imprimir recibo"
                          onClick={() => imprimirReciboVendaDireta(venda.id)}
                        >
                          <FiPrinter size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>
            Total: {total} registro(s) • Página {page} de {totalPages}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
              style={{ ...fieldStyle, width: 90 }}
              disabled={!empresaAtiva}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <button type="button" style={buttonStyles.secondary} disabled={page <= 1 || loading || !empresaAtiva} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              Anterior
            </button>

            <button type="button" style={buttonStyles.secondary} disabled={page >= totalPages || loading || !empresaAtiva} onClick={() => setPage((prev) => prev + 1)}>
              Próxima
            </button>
          </div>
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