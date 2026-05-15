// src/pages/Compras/List.tsx

import {
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiEdit,
  FiPackage,
  FiPlus,
  FiRefreshCcw,
  FiSearch,
  FiTrash2,
  FiXCircle,
  FiRotateCcw,
} from "react-icons/fi";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import {
  comprasListUtils,
  useComprasList,
} from "./hooks/useComprasList";

export default function ComprasList() {
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
    filtroDataInicio,
    setFiltroDataInicio,
    filtroDataFim,
    setFiltroDataFim,

    orderBy,
    orderDir,
    handleSort,

    fornecedoresOptions,
    fornecedoresMap,
    formasPagamento,

    deletingId,
    financeiroLoadingId,

    financeiroModalOpen,
    financeiroCompra,
    financeiroForm,
    financeiroSaving,

    hasFilters,
    resumo,

    buscar,
    limparFiltros,
    excluirCompra,
    cancelarCompra,
    acaoFinanceiraCompra,
    cancelarFinanceiroCompra,
    fecharFinanceiroModal,
    confirmarGeracaoFinanceira,
    updateFinanceiroForm,
    parcelasFinanceiras,
    updateParcelaFinanceira,
  } = useComprasList();

  return (
    <PageShell>
      <PageHeader
        title="Compras"
        subtitle="Controle de compras, recebimento de itens e geração financeira para contas a pagar."
        action={
          <button
            type="button"
            style={buttonStyles.primary}
            onClick={() => navigate("/compras/novo")}
          >
            <FiPlus size={15} /> Nova compra
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
          label="Valor da página"
          value={comprasListUtils.formatMoneyBR(resumo.valorTotal)}
          tone="info"
        />

        <SummaryCard
          label="Recebidas"
          value={resumo.recebidas}
          tone="success"
        />

        <SummaryCard
          label="Em aberto"
          value={resumo.abertas + resumo.parciais}
          tone="danger"
        />
      </div>

      <DataCard
        title="Filtros"
        subtitle="Pesquise compras por fornecedor, status e período do pedido."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 180px 160px 160px 1fr",
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
              disabled={loading || deletingId !== null}
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
            <label style={labelStyle}>Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={fieldStyle}
              disabled={loading || deletingId !== null}
            >
              <option value="">Todos</option>
              <option value="ABERTA">Aberta</option>
              <option value="PARCIALMENTE_RECEBIDA">
                Parcialmente recebida
              </option>
              <option value="RECEBIDA">Recebida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Data inicial</label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              style={fieldStyle}
              disabled={loading || deletingId !== null}
            />
          </div>

          <div>
            <label style={labelStyle}>Data final</label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              style={fieldStyle}
              disabled={loading || deletingId !== null}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <button
              type="button"
              style={{
                ...buttonStyles.secondary,
                height: 40,
                whiteSpace: "nowrap",
              }}
              disabled={!hasFilters || loading || deletingId !== null}
              onClick={limparFiltros}
            >
              <FiRefreshCcw size={15} /> Limpar
            </button>

            <button
              type="button"
              style={{
                ...buttonStyles.primary,
                height: 40,
                whiteSpace: "nowrap",
              }}
              disabled={loading || deletingId !== null}
              onClick={buscar}
            >
              <FiSearch size={15} /> Buscar
            </button>
          </div>
        </div>
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Relação de compras"
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
                  title="Data"
                  active={orderBy === "data_pedido"}
                  dir={orderDir}
                  onClick={() => handleSort("data_pedido")}
                  width={120}
                />

                <th style={{ ...thStyle, textAlign: "right" }}>Total</th>

                <th style={{ ...thStyle, textAlign: "center" }}>
                  Recebimento
                </th>

                <th style={{ ...thStyle, textAlign: "center" }}>
                  Financeiro
                </th>

                <HeaderCell
                  title="Status"
                  active={orderBy === "status"}
                  dir={orderDir}
                  onClick={() => handleSort("status")}
                  width={170}
                />

                <th style={{ ...thStyle, textAlign: "right", width: 190 }}>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={emptyStyle}>
                    Carregando compras...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={emptyStyle}>
                    Nenhuma compra encontrada.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const fornecedorId = Number(row?.fornecedor_id);

                  const fornecedorNome =
                    row?.fornecedor?.nome ||
                    row?.fornecedor?.razao_social ||
                    row?.Fornecedor?.nome ||
                    row?.Fornecedor?.razao_social ||
                    fornecedoresMap.get(fornecedorId)?.nome ||
                    (fornecedorId ? `Fornecedor #${fornecedorId}` : "-");

                  const totalCompra = comprasListUtils.getTotalCompra(row);
                  const recebimento = comprasListUtils.getResumoRecebimento(row);
                  const status = String(row.status || "").toUpperCase();

                  const podeReceber =
                    status === "ABERTA" ||
                    status === "PARCIALMENTE_RECEBIDA";

                  const podeExcluir =
                    status === "ABERTA" || status === "CANCELADA";

                  const podeCancelar =
                    status === "ABERTA" ||
                    status === "PARCIALMENTE_RECEBIDA";

                  const isDeleting = deletingId === Number(row.id);

                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        background: index % 2 === 0 ? "#fff" : "#f8fafc",
                        opacity: isDeleting ? 0.65 : 1,
                      }}
                    >
                      <td style={tdStyle}>
                        <strong>#{row.id}</strong>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>
                          {fornecedorNome}
                        </div>

                        {fornecedorId ? (
                          <div style={subTextStyle}>
                            Fornecedor #{fornecedorId}
                          </div>
                        ) : null}
                      </td>

                      <td style={tdStyle}>
                        {comprasListUtils.formatDateBR(row.data_pedido)}
                      </td>

                      <td style={tdMoneyStyle}>
                        {totalCompra === null
                          ? "-"
                          : comprasListUtils.formatMoneyBR(totalCompra)}
                      </td>

                      <td style={tdStyle}>
                        <div style={{ minWidth: 150 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 12,
                              fontWeight: 800,
                              color: "#334155",
                              marginBottom: 6,
                            }}
                          >
                            <span>
                              {comprasListUtils.formatQtyBR(
                                recebimento.totalRecebido
                              )}
                            </span>
                            <span>{Math.round(recebimento.percentual)}%</span>
                          </div>

                          <div
                            style={{
                              height: 8,
                              borderRadius: 999,
                              background: "#e5e7eb",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${recebimento.percentual}%`,
                                background:
                                  recebimento.percentual >= 100
                                    ? "#22c55e"
                                    : recebimento.percentual > 0
                                      ? "#f59e0b"
                                      : "#94a3b8",
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            borderRadius: 999,
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 850,
                            background: row.tem_contas_pagar
                              ? "#dcfce7"
                              : "#f1f5f9",
                            color: row.tem_contas_pagar ? "#166534" : "#475569",
                          }}
                        >
                          {row.tem_contas_pagar ? "Gerado" : "Pendente"}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            borderRadius: 999,
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 850,
                            ...comprasListUtils.statusStyle(row.status),
                          }}
                        >
                          {String(row.status || "-").replaceAll("_", " ")}
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
                            title="Editar compra"
                            disabled={loading || isDeleting}
                            onClick={() => navigate(`/compras/${row.id}/editar`)}
                          >
                            <FiEdit size={15} />
                          </button>

                          <button
                            type="button"
                            style={{
                              ...iconButtonStyle,
                              color: podeReceber ? "#16a34a" : "#94a3b8",
                              border: podeReceber
                                ? "1px solid #bbf7d0"
                                : "1px solid #e5e7eb",
                              background: podeReceber ? "#f0fdf4" : "#ffffff",
                              cursor:
                                !podeReceber || loading || isDeleting
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                            title={
                              podeReceber
                                ? "Receber compra"
                                : "Compra não disponível para recebimento"
                            }
                            disabled={!podeReceber || loading || isDeleting}
                            onClick={() => navigate(`/compras/${row.id}/receber`)}
                          >
                            <FiPackage size={15} />
                          </button>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: 8,
                            }}
                          >
                            <button
                              type="button"
                              style={iconButtonStyle}
                              title={
                                row.tem_contas_pagar
                                  ? "Visualizar financeiro"
                                  : "Gerar financeiro"
                              }
                              disabled={financeiroLoadingId === row.id}
                              onClick={() => acaoFinanceiraCompra(row)}
                            >
                              <FiCreditCard size={15} />
                            </button>

                            {row.tem_contas_pagar && (
                              <button
                                type="button"
                                style={{
                                  ...iconButtonStyle,
                                  color: "#dc2626",
                                }}
                                title="Cancelar fechamento financeiro"
                                disabled={financeiroLoadingId === row.id}
                                onClick={() => cancelarFinanceiroCompra(row)}
                              >
                                <FiRotateCcw size={15} />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            style={{
                              ...iconButtonStyle,
                              color: podeCancelar ? "#f59e0b" : "#94a3b8",
                              cursor:
                                !podeCancelar || loading || isDeleting
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                            title={
                              podeCancelar
                                ? "Cancelar compra"
                                : "Compra não pode ser cancelada"
                            }
                            disabled={!podeCancelar || loading || isDeleting}
                            onClick={() => cancelarCompra(row)}
                          >
                            <FiXCircle size={15} />
                          </button>

                          <button
                            type="button"
                            style={{
                              ...iconButtonStyle,
                              color: podeExcluir ? "#dc2626" : "#94a3b8",
                              cursor:
                                !podeExcluir || loading || isDeleting
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                            title={
                              podeExcluir
                                ? "Excluir compra"
                                : "Compra não pode ser excluída"
                            }
                            disabled={!podeExcluir || loading || isDeleting}
                            onClick={() => excluirCompra(row)}
                          >
                            <FiTrash2 size={15} />
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
              disabled={page <= 1 || loading || deletingId !== null}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              <FiChevronLeft size={15} /> Anterior
            </button>

            <button
              type="button"
              style={buttonStyles.secondary}
              disabled={page >= totalPages || loading || deletingId !== null}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Próxima <FiChevronRight size={15} />
            </button>
          </div>
        </div>
      </DataCard>

      {financeiroModalOpen && financeiroCompra && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>Gerar contas a pagar</div>

            <div style={{ padding: 20 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <InfoItem label="Compra" value={`#${financeiroCompra.id}`} />

                <InfoItem
                  label="Valor total"
                  value={comprasListUtils.formatMoneyBR(
                    comprasListUtils.getTotalCompra(financeiroCompra) || 0
                  )}
                />
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Forma de pagamento</label>

                  <select
                    value={financeiroForm.forma_pagamento}
                    onChange={(e) =>
                      updateFinanceiroForm("forma_pagamento", e.target.value)
                    }
                    style={fieldStyle}
                    disabled={financeiroSaving}
                  >
                    <option value="">Selecione</option>

                    {formasPagamento.map((fp) => (
                      <option key={fp.id} value={fp.descricao}>
                        {fp.descricao}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div>
                    <label style={labelStyle}>Parcelas</label>
                    <input
                      type="number"
                      min={1}
                      value={financeiroForm.quantidade_parcelas}
                      onChange={(e) =>
                        updateFinanceiroForm(
                          "quantidade_parcelas",
                          Number(e.target.value)
                        )
                      }
                      style={fieldStyle}
                      disabled={financeiroSaving}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Primeiro vencimento</label>
                    <input
                      type="date"
                      value={financeiroForm.data_primeiro_vencimento}
                      onChange={(e) =>
                        updateFinanceiroForm(
                          "data_primeiro_vencimento",
                          e.target.value
                        )
                      }
                      style={fieldStyle}
                      disabled={financeiroSaving}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Intervalo dias</label>
                    <input
                      type="number"
                      min={0}
                      value={financeiroForm.intervalo_dias}
                      onChange={(e) =>
                        updateFinanceiroForm("intervalo_dias", Number(e.target.value))
                      }
                      style={fieldStyle}
                      disabled={financeiroSaving}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Observação</label>
                  <textarea
                    value={financeiroForm.observacao}
                    onChange={(e) =>
                      updateFinanceiroForm("observacao", e.target.value)
                    }
                    style={{
                      ...fieldStyle,
                      height: 76,
                      resize: "vertical",
                      paddingTop: 10,
                    }}
                    disabled={financeiroSaving}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      {[
                        "Parcela",
                        "Vencimento",
                        "Valor",
                        "Nº documento",
                        "Anexo",
                      ].map((title) => (
                        <th key={title} style={thStyle}>
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {parcelasFinanceiras.map((p) => (
                      <tr
                        key={p.parcela}
                        style={{ borderTop: "1px solid #e5e7eb" }}
                      >
                        <td style={tdStyle}>
                          {p.parcela}/{p.total_parcelas}
                        </td>

                        <td style={tdStyle}>
                          {comprasListUtils.formatDateBR(p.data_vencimento)}
                        </td>

                        <td style={tdMoneyStyle}>
                          {comprasListUtils.formatMoneyBR(p.valor_original)}
                        </td>

                        <td style={tdStyle}>
                          <input
                            value={p.numero_documento}
                            onChange={(e) =>
                              updateParcelaFinanceira(
                                p.parcela,
                                "numero_documento",
                                e.target.value
                              )
                            }
                            placeholder="Ex.: boleto, NF, doc..."
                            disabled={financeiroSaving}
                            style={{
                              ...fieldStyle,
                              height: 34,
                              fontSize: 12,
                            }}
                          />
                        </td>

                        <td style={tdStyle}>
                          <label
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: 34,
                              padding: "0 12px",
                              borderRadius: 10,
                              border: "1px dashed #cbd5e1",
                              background: "#f8fafc",
                              color: "#475569",
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: financeiroSaving ? "not-allowed" : "pointer",
                              whiteSpace: "nowrap",
                              maxWidth: 180,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={p.anexo_nome || "Anexar documento"}
                          >
                            {p.anexo_nome || "Anexar documento"}

                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              disabled={financeiroSaving}
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                updateParcelaFinanceira(
                                  p.parcela,
                                  "anexo_file",
                                  file
                                );
                              }}
                            />
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  style={buttonStyles.secondary}
                  disabled={financeiroSaving}
                  onClick={fecharFinanceiroModal}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  style={buttonStyles.primary}
                  disabled={financeiroSaving}
                  onClick={confirmarGeracaoFinanceira}
                >
                  <FiCreditCard size={15} />{" "}
                  {financeiroSaving ? "Gerando..." : "Gerar financeiro"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

function InfoItem({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div style={infoLabelStyle}>{label}</div>

      <div
        style={{
          marginTop: 4,
          fontSize: 14,
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        {value || "-"}
      </div>
    </div>
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
  fontWeight: 900,
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

const infoLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  width: 680,
  maxWidth: "96vw",
  background: "#fff",
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
};

const modalHeaderStyle: React.CSSProperties = {
  padding: "18px 22px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
};