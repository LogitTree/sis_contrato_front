// src/pages/ContasPagar/Detail.tsx

import { useState } from "react";
import {
  FiArrowLeft,
  FiDollarSign,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import { contasPagarListUtils } from "./hooks/useContasPagarList";
import { useContasPagarDetail } from "./hooks/useContasPagarDetail";

function formatCurrencyInput(value: string) {
  const onlyNumbers = value.replace(/\D/g, "");

  if (!onlyNumbers) return "";

  const numberValue = Number(onlyNumbers) / 100;

  return numberValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ContasPagarDetail() {
  const [modalPagamentoOpen, setModalPagamentoOpen] = useState(false);

  const {
    navigate,

    loading,
    conta,

    pagamentoForm,
    setPagamentoForm,

    savingPagamento,
    cancelandoConta,
    excluindoPagamentoId,

    formasPagamento,

    podePagar,
    podeCancelar,

    registrarPagamento,
    cancelarConta,
    excluirPagamento,
  } = useContasPagarDetail();

  if (loading) {
    return (
      <PageShell>
        <DataCard title="Conta a Pagar" subtitle="Carregando informações...">
          <div style={emptyStyle}>Carregando...</div>
        </DataCard>
      </PageShell>
    );
  }

  if (!conta) {
    return (
      <PageShell>
        <DataCard title="Conta a Pagar" subtitle="Registro não localizado.">
          <div style={emptyStyle}>Conta não encontrada.</div>
        </DataCard>
      </PageShell>
    );
  }

  const status = String(conta.status || "").toUpperCase();

  return (
    <PageShell>
      <PageHeader
        title={`Conta a Pagar #${conta.id}`}
        subtitle={`Parcela ${conta.parcela}/${conta.total_parcelas}`}
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              style={buttonStyles.secondary}
              onClick={() => navigate("/contas-pagar")}
              disabled={savingPagamento || cancelandoConta}
            >
              <FiArrowLeft size={15} /> Voltar
            </button>

            {podePagar && (
              <button
                type="button"
                style={buttonStyles.primary}
                onClick={() => setModalPagamentoOpen(true)}
                disabled={savingPagamento}
              >
                <FiDollarSign size={15} /> Registrar pagamento
              </button>
            )}

            {podeCancelar && (
              <button
                type="button"
                style={{
                  ...buttonStyles.secondary,
                  color: "#b45309",
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                }}
                onClick={cancelarConta}
                disabled={cancelandoConta}
              >
                <FiXCircle size={15} />{" "}
                {cancelandoConta ? "Cancelando..." : "Cancelar"}
              </button>
            )}
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
        <SummaryCard
          label="Valor original"
          value={contasPagarListUtils.formatMoneyBR(conta.valor_original)}
          tone="info"
        />

        <SummaryCard
          label="Valor pago"
          value={contasPagarListUtils.formatMoneyBR(conta.valor_pago)}
          tone="success"
        />

        <SummaryCard
          label="Saldo"
          value={contasPagarListUtils.formatMoneyBR(conta.saldo)}
          tone={
            contasPagarListUtils.parseDecimalApi(conta.saldo) > 0
              ? "danger"
              : "success"
          }
        />

        <SummaryCard
          label="Status"
          value={String(conta.status || "-").replaceAll("_", " ")}
          tone={
            status === "PAGO"
              ? "success"
              : status === "CANCELADO"
                ? "danger"
                : "info"
          }
        />
      </div>

      <DataCard title="Dados da conta" subtitle="Informações da parcela.">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          <InfoItem
            label="Fornecedor"
            value={
              conta.fornecedor?.nome ||
              (conta.fornecedor as any)?.razao_social ||
              "-"
            }
          />

          <InfoItem label="Compra" value={`#${conta.compra_id}`} />

          <InfoItem label="Documento" value={conta.numero_documento || "-"} />

          <InfoItem
            label="Parcela"
            value={`${conta.parcela}/${conta.total_parcelas}`}
          />

          <InfoItem
            label="Data emissão"
            value={contasPagarListUtils.formatDateBR(conta.data_emissao)}
          />

          <InfoItem
            label="Vencimento"
            value={contasPagarListUtils.formatDateBR(conta.data_vencimento)}
          />

          <InfoItem
            label="Forma de pagamento"
            value={conta.forma_pagamento || "-"}
          />

          <div>
            <div style={infoLabelStyle}>Status</div>
            <span
              style={{
                marginTop: 4,
                display: "inline-flex",
                borderRadius: 999,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 850,
                ...contasPagarListUtils.statusStyle(
                  conta.status,
                  conta.data_vencimento
                ),
              }}
            >
              {contasPagarListUtils.isVencida(
                conta.status,
                conta.data_vencimento
              )
                ? "VENCIDO"
                : String(conta.status || "-").replaceAll("_", " ")}
            </span>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <InfoItem label="Observação" value={conta.observacao || "-"} />
          </div>
        </div>
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Histórico de pagamentos"
        subtitle="Pagamentos registrados para esta conta."
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
                {[
                  "ID",
                  "Data",
                  "Valor",
                  "Forma de pagamento",
                  "Observação",
                  "Ações",
                ].map((title) => (
                  <th
                    key={title}
                    style={{
                      ...thStyle,
                      textAlign: title === "Ações" ? "right" : "left",
                    }}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {!conta.pagamentos?.length ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Nenhum pagamento registrado.
                  </td>
                </tr>
              ) : (
                conta.pagamentos.map((pagamento, index) => {
                  const isDeleting =
                    excluindoPagamentoId === Number(pagamento.id);

                  return (
                    <tr
                      key={pagamento.id}
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        background: index % 2 === 0 ? "#fff" : "#f8fafc",
                        opacity: isDeleting ? 0.65 : 1,
                      }}
                    >
                      <td style={tdStyle}>
                        <strong>#{pagamento.id}</strong>
                      </td>

                      <td style={tdStyle}>
                        {contasPagarListUtils.formatDateBR(
                          pagamento.data_pagamento
                        )}
                      </td>

                      <td style={tdMoneyStyle}>
                        {contasPagarListUtils.formatMoneyBR(
                          pagamento.valor_pago
                        )}
                      </td>

                      <td style={tdStyle}>
                        {pagamento.forma_pagamento || "-"}
                      </td>

                      <td style={tdStyle}>{pagamento.observacao || "-"}</td>

                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <button
                          type="button"
                          style={{
                            ...iconButtonDanger,
                            cursor: isDeleting ? "not-allowed" : "pointer",
                            opacity: isDeleting ? 0.65 : 1,
                          }}
                          onClick={() => excluirPagamento(pagamento)}
                          disabled={isDeleting}
                          title="Excluir pagamento"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DataCard>

      {modalPagamentoOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>Registrar pagamento</div>

            <form
              onSubmit={async (e) => {
                const ok = await registrarPagamento(e);
                if (ok) setModalPagamentoOpen(false);
              }}
              style={{ padding: 20 }}
            >
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Data do pagamento</label>
                  <input
                    type="date"
                    value={pagamentoForm.data_pagamento}
                    onChange={(e) =>
                      setPagamentoForm((old) => ({
                        ...old,
                        data_pagamento: e.target.value,
                      }))
                    }
                    style={fieldStyle}
                    disabled={savingPagamento}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Valor pago</label>
                  <input
                    value={pagamentoForm.valor_pago}
                    onChange={(e) =>
                      setPagamentoForm((old) => ({
                        ...old,
                        valor_pago: formatCurrencyInput(e.target.value),
                      }))
                    }
                    style={fieldStyle}
                    placeholder="R$ 0,00"
                    inputMode="numeric"
                    disabled={savingPagamento}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Forma de pagamento</label>
                  <select
                    value={pagamentoForm.forma_pagamento}
                    onChange={(e) =>
                      setPagamentoForm((old) => ({
                        ...old,
                        forma_pagamento: e.target.value,
                      }))
                    }
                    style={fieldStyle}
                    disabled={savingPagamento}
                  >
                    <option value="">Selecione</option>

                    {formasPagamento.map((fp) => (
                      <option key={fp.id} value={fp.descricao}>
                        {fp.descricao}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Observação</label>
                  <textarea
                    value={pagamentoForm.observacao}
                    onChange={(e) =>
                      setPagamentoForm((old) => ({
                        ...old,
                        observacao: e.target.value,
                      }))
                    }
                    style={{
                      ...fieldStyle,
                      height: 84,
                      resize: "vertical",
                      paddingTop: 10,
                    }}
                    disabled={savingPagamento}
                  />
                </div>
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
                  onClick={() => setModalPagamentoOpen(false)}
                  disabled={savingPagamento}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={buttonStyles.primary}
                  disabled={savingPagamento}
                >
                  <FiDollarSign size={15} />{" "}
                  {savingPagamento ? "Registrando..." : "Confirmar pagamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
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

const infoLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
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
  fontWeight: 900,
  color: "#166534",
};

const emptyStyle: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
};

const iconButtonDanger: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#dc2626",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
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
  width: 520,
  maxWidth: "95vw",
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