// src/pages/ContasPagar/List.tsx

import {
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiFileText,
  FiRefreshCcw,
  FiSearch,
  FiXCircle,
} from "react-icons/fi";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  contasPagarListUtils,
  useContasPagarList,
} from "./hooks/useContasPagarList";

export default function ContasPagarList() {
  const {
    navigate,

    rows,
    loading,
    total,
    totalPages,
    page,
    setPage,
    limit,
    setLimit,

    filtroFornecedorId,
    setFiltroFornecedorId,
    filtroStatus,
    setFiltroStatus,
    filtroCompraId,
    setFiltroCompraId,
    filtroDocumento,
    setFiltroDocumento,
    filtroVencimentoInicio,
    setFiltroVencimentoInicio,
    filtroVencimentoFim,
    setFiltroVencimentoFim,
    situacaoRapida,
    setSituacaoRapida,

    orderBy,
    orderDir,
    handleSort,

    fornecedoresOptions,
    fornecedoresMap,

    cancelingId,
    hasFilters,
    resumoTotais,

    buscar,
    limparFiltros,
    cancelarConta,
    abrirRelatorioPdf,
  } = useContasPagarList();

  return (
    <PageShell>
      <PageHeader
        title="Contas a Pagar"
        subtitle="Controle financeiro de parcelas, vencimentos, pagamentos e saldos em aberto."
        action={
          <button
            type="button"
            style={buttonStyles.secondary}
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>
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
        <SummaryCard label="Registros" value={total} />
        <SummaryCard
          label="Valor original"
          value={contasPagarListUtils.formatMoneyBR(resumoTotais.valorOriginal)}
          tone="info"
        />
        <SummaryCard
          label="Valor pago"
          value={contasPagarListUtils.formatMoneyBR(resumoTotais.valorPago)}
          tone="success"
        />
        <SummaryCard
          label="Saldo"
          value={contasPagarListUtils.formatMoneyBR(resumoTotais.saldo)}
          tone={resumoTotais.saldo > 0 ? "danger" : "success"}
        />
      </div>

      <DataCard
        title="Filtros"
        subtitle="Filtre por fornecedor, documento, compra, vencimento, status e situação."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 140px 180px 150px 150px",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle}>Fornecedor</label>
            <select
              value={filtroFornecedorId}
              onChange={(e) => setFiltroFornecedorId(e.target.value)}
              style={fieldStyle}
              disabled={loading || cancelingId !== null}
            >
              <option value="">Todos</option>
              {fornecedoresOptions.map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Compra ID</label>
            <input
              value={filtroCompraId}
              onChange={(e) => setFiltroCompraId(e.target.value)}
              style={fieldStyle}
              placeholder="Ex.: 15"
              disabled={loading || cancelingId !== null}
            />
          </div>

          <div>
            <label style={labelStyle}>Documento</label>
            <input
              value={filtroDocumento}
              onChange={(e) => setFiltroDocumento(e.target.value)}
              style={fieldStyle}
              placeholder="Nº documento"
              disabled={loading || cancelingId !== null}
              onKeyDown={(e) => {
                if (e.key === "Enter") buscar();
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Vencimento de</label>
            <input
              type="date"
              value={filtroVencimentoInicio}
              onChange={(e) => setFiltroVencimentoInicio(e.target.value)}
              style={fieldStyle}
              disabled={loading || cancelingId !== null}
            />
          </div>

          <div>
            <label style={labelStyle}>Vencimento até</label>
            <input
              type="date"
              value={filtroVencimentoFim}
              onChange={(e) => setFiltroVencimentoFim(e.target.value)}
              style={fieldStyle}
              disabled={loading || cancelingId !== null}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "220px 220px 1fr auto auto auto",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle}>Situação rápida</label>
            <select
              value={situacaoRapida}
              onChange={(e) => setSituacaoRapida(e.target.value)}
              style={fieldStyle}
              disabled={loading || cancelingId !== null}
            >
              <option value="">Todos</option>
              <option value="aberto">Somente em aberto</option>
              <option value="vencidas">Somente vencidas</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={fieldStyle}
              disabled={loading || cancelingId !== null}
            >
              <option value="">Todos</option>
              <option value="ABERTO">Aberto</option>
              <option value="PARCIAL">Parcial</option>
              <option value="PAGO">Pago</option>
              <option value="VENCIDO">Vencido</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div />

          <button
            type="button"
            style={{
              ...buttonStyles.secondary,
              height: 40,
              whiteSpace: "nowrap",
            }}
            disabled={!hasFilters || loading || cancelingId !== null}
            onClick={limparFiltros}
          >
            <FiRefreshCcw size={15} /> Limpar
          </button>

          <button
            type="button"
            style={{
              ...buttonStyles.secondary,
              height: 40,
              whiteSpace: "nowrap",
            }}
            disabled={loading || cancelingId !== null}
            onClick={abrirRelatorioPdf}
          >
            <FiFileText size={15} /> Relatório
          </button>

          <button
            type="button"
            style={{
              ...buttonStyles.primary,
              height: 40,
              whiteSpace: "nowrap",
            }}
            disabled={loading || cancelingId !== null}
            onClick={buscar}
          >
            <FiSearch size={15} /> Buscar
          </button>
        </div>
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Relação de contas"
        subtitle={
          loading
            ? "Atualizando lista..."
            : `Exibindo ${rows.length} de ${total} registro(s).`
        }
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
                <HeaderCell
                  title="ID"
                  active={orderBy === "id"}
                  dir={orderDir}
                  onClick={() => handleSort("id")}
                  width={70}
                />

                <HeaderCell
                  title="Fornecedor"
                  active={orderBy === "fornecedor_id"}
                  dir={orderDir}
                  onClick={() => handleSort("fornecedor_id")}
                />

                <HeaderCell
                  title="Documento"
                  active={orderBy === "compra_id"}
                  dir={orderDir}
                  onClick={() => handleSort("compra_id")}
                />

                <th style={{ ...thStyle, width: 90, textAlign: "center" }}>
                  Parcela
                </th>

                <HeaderCell
                  title="Vencimento"
                  active={orderBy === "data_vencimento"}
                  dir={orderDir}
                  onClick={() => handleSort("data_vencimento")}
                  width={140}
                />

                <th style={{ ...thStyle, textAlign: "right" }}>Valor</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Pago</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Saldo</th>

                <HeaderCell
                  title="Status"
                  active={orderBy === "status"}
                  dir={orderDir}
                  onClick={() => handleSort("status")}
                  width={140}
                />

                <th style={{ ...thStyle, textAlign: "right", width: 110 }}>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={emptyStyle}>
                    Carregando registros...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={emptyStyle}>
                    Nenhuma conta a pagar encontrada.
                  </td>
                </tr>
              ) : (
                rows.map((r, index) => {
                  const isCanceling = cancelingId === Number(r.id);
                  const fornecedorIdNum = Number(r?.fornecedor_id);

                  const fornecedorNome =
                    r?.fornecedor?.nome ??
                    fornecedoresMap.get(fornecedorIdNum)?.nome ??
                    (fornecedorIdNum
                      ? `Fornecedor #${fornecedorIdNum}`
                      : "-");

                  const status = String(r.status || "").toUpperCase();

                  const podeCancelar = status === "ABERTO" || status === "VENCIDO";

                  const vencida = contasPagarListUtils.isVencida(
                    r.status,
                    r.data_vencimento
                  );

                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        background: index % 2 === 0 ? "#fff" : "#f8fafc",
                        opacity: isCanceling ? 0.65 : 1,
                        boxShadow: `inset 3px 0 0 ${contasPagarListUtils.rowAccent(
                          r.status,
                          r.data_vencimento
                        )}`,
                      }}
                    >
                      <td style={tdStyle}>
                        <strong>#{r.id}</strong>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>
                          {fornecedorNome}
                        </div>

                        {r.fornecedor_id ? (
                          <div style={subTextStyle}>
                            Fornecedor #{r.fornecedor_id}
                          </div>
                        ) : null}
                      </td>

                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>
                          {r.numero_documento || "-"}
                        </div>
                        <div style={subTextStyle}>Compra #{r.compra_id}</div>
                      </td>

                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        {r.parcela}/{r.total_parcelas}
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            fontWeight: vencida ? 900 : 700,
                            color: vencida ? "#b91c1c" : "#0f172a",
                          }}
                        >
                          {contasPagarListUtils.formatDateBR(r.data_vencimento)}
                        </div>

                        {vencida && (
                          <div
                            style={{
                              ...subTextStyle,
                              color: "#b91c1c",
                              fontWeight: 800,
                            }}
                          >
                            {contasPagarListUtils.diasEmAtraso(
                              r.data_vencimento
                            )}{" "}
                            dia(s) em atraso
                          </div>
                        )}
                      </td>

                      <td style={tdMoneyStyle}>
                        {contasPagarListUtils.formatMoneyBR(r.valor_original)}
                      </td>

                      <td
                        style={{
                          ...tdMoneyStyle,
                          color: "#166534",
                        }}
                      >
                        {contasPagarListUtils.formatMoneyBR(r.valor_pago)}
                      </td>

                      <td
                        style={{
                          ...tdMoneyStyle,
                          color:
                            contasPagarListUtils.parseDecimalApi(r.saldo) > 0
                              ? vencida
                                ? "#b91c1c"
                                : "#0f172a"
                              : "#166534",
                          fontWeight: 900,
                        }}
                      >
                        {contasPagarListUtils.formatMoneyBR(r.saldo)}
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            borderRadius: 999,
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 850,
                            ...contasPagarListUtils.statusStyle(
                              r.status,
                              r.data_vencimento
                            ),
                          }}
                        >
                          {vencida
                            ? "VENCIDO"
                            : String(r.status || "-").replaceAll("_", " ")}
                        </span>
                      </td>

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
                            onClick={() => navigate(`/contas-pagar/${r.id}`)}
                            disabled={loading || isCanceling}
                            title="Visualizar detalhes"
                          >
                            <FiEye size={15} />
                          </button>

                          <button
                            type="button"
                            style={{
                              ...iconButtonStyle,
                              color: podeCancelar ? "#f59e0b" : "#94a3b8",
                              cursor:
                                loading || isCanceling || !podeCancelar
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                            onClick={() => cancelarConta(r)}
                            disabled={loading || isCanceling || !podeCancelar}
                            title={
                              podeCancelar
                                ? "Cancelar conta"
                                : "Conta não pode ser cancelada"
                            }
                          >
                            <FiXCircle size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
          <div
            style={{
              fontSize: 13,
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            Total: {total} registro(s) • Página {page} de {totalPages}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <select
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
              style={{
                ...fieldStyle,
                width: 90,
              }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <button
              type="button"
              style={buttonStyles.secondary}
              disabled={page <= 1 || loading || cancelingId !== null}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              <FiChevronLeft size={15} /> Anterior
            </button>

            <button
              type="button"
              style={buttonStyles.secondary}
              disabled={page >= totalPages || loading || cancelingId !== null}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Próxima <FiChevronRight size={15} />
            </button>
          </div>
        </div>
      </DataCard>
    </PageShell>
  );
}

function HeaderCell({
  title,
  active,
  dir,
  onClick,
  width,
}: {
  title: string;
  active?: boolean;
  dir?: "ASC" | "DESC";
  onClick?: () => void;
  width?: number;
}) {
  return (
    <th
      style={{
        ...thStyle,
        width,
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      {title} {active ? (dir === "ASC" ? "▲" : "▼") : ""}
    </th>
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

const tdMoneyStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: "right",
  fontWeight: 800,
};

const subTextStyle: React.CSSProperties = {
  marginTop: 3,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 600,
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
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};